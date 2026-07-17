import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { generateGeminiContent } from "@/lib/ai/llmClient";
import { trainerSystemPrompt } from "@/prompts/trainer";
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
      return NextResponse.json(
        { error: "Profile not found. Please complete onboarding first." },
        { status: 400 }
      );
    }

    const userProfileText = `
User Profile details:
- Primary Goal: ${profile.goal}
- Fitness Level: ${profile.fitnessLevel}
- Dietary Restrictions: ${profile.dietaryRestrictions}
- Injury History: ${profile.injuryHistory}
- Available Equipment: ${profile.availableEquipment}
- Weekly Workout Schedule: ${profile.weeklySchedule}
- Current Weight: ${profile.weight} kg
- Current Height: ${profile.height} cm
- Age: ${profile.age}
- Gender: ${profile.gender}
- Activity Level: ${profile.activityLevel}
    `;

    // 1. Generate Workout Plan
    console.log("Generating Week 1 Workout Plan...");
    const workoutResponseText = await generateGeminiContent(
      `Please generate the initial Week 1 workout plan based on the following profile:\n${userProfileText}`,
      {
        systemInstruction: trainerSystemPrompt,
        responseMimeType: "application/json",
      }
    );

    const workoutJson = JSON.parse(workoutResponseText);

    // 2. Generate Nutrition Plan
    console.log("Generating Week 1 Meal Plan...");
    const nutritionResponseText = await generateGeminiContent(
      `Please generate the initial Week 1 nutrition and meal plan based on the following profile:\n${userProfileText}`,
      {
        systemInstruction: nutritionSystemPrompt,
        responseMimeType: "application/json",
      }
    );

    const nutritionJson = JSON.parse(nutritionResponseText);

    // Deactivate previous plans for this user if any exist
    await prisma.workoutPlan.updateMany({
      where: { userId: session.user.id, status: "ACTIVE" },
      data: { status: "SUPERSEDED" },
    });

    await prisma.mealPlan.updateMany({
      where: { userId: session.user.id, status: "ACTIVE" },
      data: { status: "SUPERSEDED" },
    });

    // 3. Save Workout Plan
    const savedWorkoutPlan = await prisma.workoutPlan.create({
      data: {
        userId: session.user.id,
        weekNumber: 1,
        status: "ACTIVE",
        exercisesJson: JSON.stringify(workoutJson.exercises),
        rationale: workoutJson.rationale || "Generated baseline workout plan.",
      },
    });

    // 4. Save Meal Plan
    const savedMealPlan = await prisma.mealPlan.create({
      data: {
        userId: session.user.id,
        weekNumber: 1,
        status: "ACTIVE",
        mealsJson: JSON.stringify(nutritionJson.meals),
        macroProtein: Number(nutritionJson.macroProtein) || 140,
        macroCarbs: Number(nutritionJson.macroCarbs) || 260,
        macroFat: Number(nutritionJson.macroFat) || 70,
        macroCalories: Number(nutritionJson.macroCalories) || 2230,
        shoppingListJson: JSON.stringify(nutritionJson.shoppingList),
        rationale: nutritionJson.rationale || "Generated baseline meal plan.",
      },
    });

    return NextResponse.json({
      workoutPlan: savedWorkoutPlan,
      mealPlan: savedMealPlan,
    });
  } catch (error) {
    console.error("POST /api/plan/generate error:", error);
    return NextResponse.json(
      { error: "Failed to generate plan. Please verify Gemini API key config." },
      { status: 500 }
    );
  }
}
