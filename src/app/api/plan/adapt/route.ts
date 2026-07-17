import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { classifyCheckIn, WeeklyPerformanceHistory, ExercisePerformance } from "@/lib/coach/classification";
import { generateGeminiContent } from "@/lib/ai/llmClient";
import { adaptationSystemPrompt } from "@/prompts/adaptation";
import { nutritionSystemPrompt } from "@/prompts/nutrition";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 400 });
    }

    const activeWorkout = await prisma.workoutPlan.findFirst({
      where: { userId: session.user.id, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });

    const activeMeal = await prisma.mealPlan.findFirst({
      where: { userId: session.user.id, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });

    if (!activeWorkout || !activeMeal) {
      return NextResponse.json({ error: "No active plans found to adapt" }, { status: 400 });
    }

    // 1. Query current week check-ins (since active plan was created)
    const currentWeekCheckIns = await prisma.checkIn.findMany({
      where: {
        userId: session.user.id,
        createdAt: { gte: activeWorkout.createdAt },
      },
      orderBy: { date: "asc" },
    });

    // 2. Query historical plans and reconstruct WeeklyPerformanceHistory
    const allWorkoutPlans = await prisma.workoutPlan.findMany({
      where: { userId: session.user.id },
      orderBy: { weekNumber: "asc" },
    });

    const history: WeeklyPerformanceHistory[] = [];
    for (let i = 0; i < allWorkoutPlans.length; i++) {
      const plan = allWorkoutPlans[i];
      // Skip the current active plan since it is current week
      if (plan.id === activeWorkout.id) continue;

      const nextPlan = allWorkoutPlans[i + 1];

      // Find check-ins completed during this plan's active window
      const checkIns = await prisma.checkIn.findMany({
        where: {
          userId: session.user.id,
          workoutCompleted: true,
          createdAt: {
            gte: plan.createdAt,
            lt: nextPlan ? nextPlan.createdAt : activeWorkout.createdAt,
          },
        },
      });

      const exercises: ExercisePerformance[] = [];
      const exMap: Record<string, number> = {};

      for (const c of checkIns) {
        if (c.workoutPerformanceJson) {
          try {
            const perf = JSON.parse(c.workoutPerformanceJson);
            const completed = perf.completedExercises || [];
            for (const ex of completed) {
              const maxW = Math.max(...(ex.sets || []).map((s: any) => s.weight || 0), 0);
              if (maxW > 0) {
                exMap[ex.name] = Math.max(exMap[ex.name] || 0, maxW);
              }
            }
          } catch (e) {
            // ignore JSON parse errors
          }
        }
      }

      for (const [name, maxW] of Object.entries(exMap)) {
        exercises.push({ exerciseName: name, maxWeight: maxW });
      }

      history.push({
        weekNumber: plan.weekNumber,
        exercises,
      });
    }

    // Get prescribed workouts count
    let prescribedCount = 3;
    try {
      const schedule = JSON.parse(profile.weeklySchedule);
      if (Array.isArray(schedule)) {
        prescribedCount = schedule.length;
      }
    } catch (e) {}

    // 3. Run the deterministic classifier
    const classificationResult = classifyCheckIn(
      currentWeekCheckIns.map((c) => ({
        workoutCompleted: c.workoutCompleted,
        sorenessPainSeverity: c.sorenessPainSeverity,
        sorenessPainLocation: c.sorenessPainLocation,
        energyLevel: c.energyLevel,
        workoutPerformanceJson: c.workoutPerformanceJson,
      })),
      prescribedCount,
      history
    );

    console.log(`Classified current week adaptation as: ${classificationResult.classification}`);

    // 4. Generate the Adapted Workout Plan using Gemini
    const profileText = `
User Onboarding Profile:
- Goal: ${profile.goal}
- Fitness Level: ${profile.fitnessLevel}
- Available Equipment: ${profile.availableEquipment}
- Constraints / Injury History: ${profile.injuryHistory}
- Weekly Schedule: ${profile.weeklySchedule}
    `;

    const adaptationInput = `
${profileText}

Current Week Plan (Week ${activeWorkout.weekNumber}):
${activeWorkout.exercisesJson}

Deterministic Classification Trigger:
- Classification: ${classificationResult.classification}
- Reason: ${classificationResult.reason}

Weekly Check-in logs:
${JSON.stringify(
  currentWeekCheckIns.map((c) => ({
    date: c.date,
    completed: c.workoutCompleted,
    pain: c.sorenessPainLocation ? `${c.sorenessPainLocation} (${c.sorenessPainSeverity}/10)` : "None",
    energy: c.energyLevel,
  }))
)}
    `;

    console.log("Generating adapted workout plan...");
    const adaptedWorkoutResponse = await generateGeminiContent(
      `Please generate the adapted workout plan for Week ${activeWorkout.weekNumber + 1}:\n${adaptationInput}`,
      {
        systemInstruction: adaptationSystemPrompt,
        responseMimeType: "application/json",
      }
    );

    const adaptedWorkoutJson = JSON.parse(adaptedWorkoutResponse);

    // 5. Generate adapted Meal Plan (can adjust macros slightly or regenerate shopping list)
    // For nutrition, if low adherence, we can make meals simpler. Otherwise, keep macros steady.
    console.log("Generating adapted meal plan...");
    const adaptedMealResponse = await generateGeminiContent(
      `Generate the next week's (Week ${activeWorkout.weekNumber + 1}) nutrition plan matching the user profile. Adaptation state is ${classificationResult.classification}.\nUser Profile:\n${profileText}`,
      {
        systemInstruction: nutritionSystemPrompt,
        responseMimeType: "application/json",
      }
    );

    const adaptedMealJson = JSON.parse(adaptedMealResponse);

    // 6. Deactivate old plans in DB
    await prisma.workoutPlan.update({
      where: { id: activeWorkout.id },
      data: { status: "SUPERSEDED" },
    });

    await prisma.mealPlan.update({
      where: { id: activeMeal.id },
      data: { status: "SUPERSEDED" },
    });

    // 7. Save new adapted plans
    const nextWeekNumber = activeWorkout.weekNumber + 1;

    const newWorkoutPlan = await prisma.workoutPlan.create({
      data: {
        userId: session.user.id,
        weekNumber: nextWeekNumber,
        status: "ACTIVE",
        exercisesJson: JSON.stringify(adaptedWorkoutJson.exercises),
        rationale: adaptedWorkoutJson.rationale || `Adapted plan for Week ${nextWeekNumber}.`,
      },
    });

    const newMealPlan = await prisma.mealPlan.create({
      data: {
        userId: session.user.id,
        weekNumber: nextWeekNumber,
        status: "ACTIVE",
        mealsJson: JSON.stringify(adaptedMealJson.meals),
        macroProtein: Number(adaptedMealJson.macroProtein) || activeMeal.macroProtein,
        macroCarbs: Number(adaptedMealJson.macroCarbs) || activeMeal.macroCarbs,
        macroFat: Number(adaptedMealJson.macroFat) || activeMeal.macroFat,
        macroCalories: Number(adaptedMealJson.macroCalories) || activeMeal.macroCalories,
        shoppingListJson: JSON.stringify(adaptedMealJson.shoppingList),
        rationale: adaptedMealJson.rationale || `Adapted meals for Week ${nextWeekNumber}.`,
      },
    });

    // 8. Create AdaptationEvent
    const adaptationEvent = await prisma.adaptationEvent.create({
      data: {
        userId: session.user.id,
        classification: classificationResult.classification,
        rationale: classificationResult.reason,
        prePlanId: activeWorkout.id,
        postPlanId: newWorkoutPlan.id,
      },
    });

    return NextResponse.json({
      classification: classificationResult.classification,
      reason: classificationResult.reason,
      workoutPlan: newWorkoutPlan,
      mealPlan: newMealPlan,
      adaptationEvent,
    });
  } catch (error) {
    console.error("POST /api/plan/adapt error:", error);
    return NextResponse.json({ error: "Failed to adapt plans." }, { status: 500 });
  }
}
