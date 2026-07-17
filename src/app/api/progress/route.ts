import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id;

    // 1. Fetch check-ins
    const checkIns = await prisma.checkIn.findMany({
      where: { userId },
      orderBy: { date: "asc" },
    });

    // 2. Fetch active meal plan for macro target comparisons
    const activeMealPlan = await prisma.mealPlan.findFirst({
      where: { userId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });

    const targetCalories = activeMealPlan?.macroCalories || 2200;
    const targetProtein = activeMealPlan?.macroProtein || 140;
    const targetCarbs = activeMealPlan?.macroCarbs || 260;
    const targetFat = activeMealPlan?.macroFat || 70;

    // 3. Extract Macro & Calorie Trends
    const macroTrends = checkIns.map((c) => {
      let logged = { protein: 0, carbs: 0, fat: 0, calories: 0 };
      if (c.mealsLoggedJson) {
        try {
          logged = JSON.parse(c.mealsLoggedJson);
        } catch (e) {}
      }
      return {
        date: c.date,
        caloriesLogged: logged.calories || 0,
        caloriesTarget: targetCalories,
        proteinLogged: logged.protein || 0,
        proteinTarget: targetProtein,
        carbsLogged: logged.carbs || 0,
        carbsTarget: targetCarbs,
        fatLogged: logged.fat || 0,
        fatTarget: targetFat,
      };
    });

    // 4. Strength Progression Curves (Track maximum compound lift weight over dates)
    const strengthHistory: { date: string; lifts: Record<string, number> }[] = [];
    for (const c of checkIns) {
      if (c.workoutCompleted && c.workoutPerformanceJson) {
        try {
          const perf = JSON.parse(c.workoutPerformanceJson);
          const completed = perf.completedExercises || [];
          const lifts: Record<string, number> = {};
          
          for (const ex of completed) {
            const maxW = Math.max(...(ex.sets || []).map((s: any) => s.weight || 0), 0);
            if (maxW > 0) {
              lifts[ex.name] = maxW;
            }
          }

          if (Object.keys(lifts).length > 0) {
            strengthHistory.push({
              date: c.date,
              lifts,
            });
          }
        } catch (e) {}
      }
    }

    // 5. Weekly consistency streaks
    const totalCheckInsCount = checkIns.length;
    const completedCount = checkIns.filter((c) => c.workoutCompleted).length;
    const consistencyRate = totalCheckInsCount > 0 ? (completedCount / totalCheckInsCount) * 100 : 0;

    // 6. 12-Week Body Metric Projection
    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    const startWeight = profile?.weight || 75;
    const goal = profile?.goal || "Build Muscle";
    const weightProjections: { week: string; weight: number }[] = [];

    // Projection calculation:
    // Build Muscle -> gain ~0.2kg per week
    // Fat Loss -> lose ~0.4kg per week
    // General Health -> maintenance (stable)
    let weightRate = 0;
    if (goal.toLowerCase().includes("muscle") || goal.toLowerCase().includes("gain")) {
      weightRate = 0.2;
    } else if (goal.toLowerCase().includes("loss") || goal.toLowerCase().includes("lean")) {
      weightRate = -0.4;
    }

    for (let i = 0; i <= 12; i++) {
      weightProjections.push({
        week: `Wk ${i}`,
        weight: Number((startWeight + weightRate * i).toFixed(2)),
      });
    }

    return NextResponse.json({
      macroTrends,
      strengthHistory,
      consistencyRate: Math.round(consistencyRate),
      completedWorkouts: completedCount,
      totalLoggedDays: totalCheckInsCount,
      weightProjections,
    });
  } catch (error) {
    console.error("GET /api/progress error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
