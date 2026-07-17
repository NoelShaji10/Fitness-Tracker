import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { generateGeminiContent } from "@/lib/ai/llmClient";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id;

    const activeWorkoutPlan = await prisma.workoutPlan.findFirst({
      where: { userId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });

    if (!activeWorkoutPlan) {
      return NextResponse.json({ error: "No active workout plan found." }, { status: 400 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 400 });
    }

    console.log("Resolving injury and generating return-to-play taper plan...");

    // We fetch the historical plans to find the original pre-injury baseline weights if available
    const lastNonInjuryPlan = await prisma.workoutPlan.findFirst({
      where: {
        userId,
        status: "SUPERSEDED",
        NOT: { rationale: { contains: "INJURY" } },
      },
      orderBy: { createdAt: "desc" },
    });

    const promptInput = `
Active Plan (Modified for Injury):
${activeWorkoutPlan.exercisesJson}

Original Plan Baseline (Pre-Injury if available):
${lastNonInjuryPlan ? lastNonInjuryPlan.exercisesJson : "No previous non-injury plan available"}

User Profile:
- Goal: ${profile.goal}
- Fitness Level: ${profile.fitnessLevel}
- Available Equipment: ${profile.availableEquipment}

Instructions:
1. Reintroduce the exercises that were previously avoided or replaced due to joint pain (e.g. if they had knee pain and avoided Squats/Leg Extensions, reintroduce them).
2. Taper the load: Set the starting weight for these reintroduced exercises at approximately 70% to 80% of their original baseline weights. Do not return to full pre-injury weight immediately.
3. Keep the schedule and overall structure matching the user's preferences.
4. Output must be a valid JSON object matching this structure:
{
  "exercises": [
    // Updated exercises list with reintroduced, tapered movements
  ],
  "rationale": "Return-to-play tapering guidance. Advise the user to perform these movements with light weights first, monitor joint discomfort, and stop immediately if sharp pain returns."
}
Do NOT include markdown formatting wrappers (like \`\`\`json) in the response.
    `;

    const systemInstruction = `You are AuraCoach, a rehabilitative sports scientist. The user's joint pain is now resolved, and you are designing a return-to-play training sheet that safely reintroduces compound lifts at a tapered weight (~70% of baseline).`;

    const responseText = await generateGeminiContent(promptInput, {
      systemInstruction,
      responseMimeType: "application/json",
    });

    const parsedJson = JSON.parse(responseText);

    // Supersede the active plan
    await prisma.workoutPlan.update({
      where: { id: activeWorkoutPlan.id },
      data: { status: "SUPERSEDED" },
    });

    // Save the new tapered plan
    const taperedPlan = await prisma.workoutPlan.create({
      data: {
        userId,
        weekNumber: activeWorkoutPlan.weekNumber,
        status: "ACTIVE",
        exercisesJson: JSON.stringify(parsedJson.exercises),
        rationale: `[REHAB TAPER] ${parsedJson.rationale}`,
      },
    });

    // Create an AdaptationEvent
    await prisma.adaptationEvent.create({
      data: {
        userId,
        classification: "PROGRESSION",
        rationale: "Injury marked resolved. Initiated return-to-play tapering protocol to safely reintroduce baseline exercises.",
        prePlanId: activeWorkoutPlan.id,
        postPlanId: taperedPlan.id,
      },
    });

    return NextResponse.json({
      success: true,
      workoutPlan: taperedPlan,
    });
  } catch (error) {
    console.error("POST /api/injury/resolve error:", error);
    return NextResponse.json({ error: "Failed to resolve injury plan." }, { status: 500 });
  }
}
