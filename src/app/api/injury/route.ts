import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { generateGeminiContent } from "@/lib/ai/llmClient";
import { injurySystemPrompt } from "@/prompts/injury";
import { z } from "zod";

const injurySchema = z.object({
  sorenessPainLocation: z.string().min(1, { message: "Pain location is required" }),
  sorenessPainSeverity: z.number().min(0).max(10),
  sorenessPainDescription: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = injurySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { sorenessPainLocation, sorenessPainSeverity, sorenessPainDescription } = result.data;

    // Load active plan
    const activeWorkoutPlan = await prisma.workoutPlan.findFirst({
      where: { userId: session.user.id, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });

    if (!activeWorkoutPlan) {
      return NextResponse.json({ error: "No active workout plan found to modify." }, { status: 400 });
    }

    const promptInput = `
Active Workout Plan exercises:
${activeWorkoutPlan.exercisesJson}

Injury Pain Report:
- Pain Location: ${sorenessPainLocation}
- Severity: ${sorenessPainSeverity}/10
- Description: ${sorenessPainDescription || "None provided"}
    `;

    console.log(`Manually triggering injury re-plan for ${sorenessPainLocation}...`);
    const modifiedResponseText = await generateGeminiContent(
      promptInput,
      {
        systemInstruction: injurySystemPrompt,
        responseMimeType: "application/json",
      }
    );

    const modifiedJson = JSON.parse(modifiedResponseText);

    // Supersede the active plan
    await prisma.workoutPlan.update({
      where: { id: activeWorkoutPlan.id },
      data: { status: "SUPERSEDED" },
    });

    // Create the new plan
    const updatedWorkoutPlan = await prisma.workoutPlan.create({
      data: {
        userId: session.user.id,
        weekNumber: activeWorkoutPlan.weekNumber,
        status: "ACTIVE",
        exercisesJson: JSON.stringify(modifiedJson.exercises),
        rationale: `[MANUAL INJURY TRIGGER] ${modifiedJson.rationale}`,
      },
    });

    // Create adaptation event
    const adaptationEvent = await prisma.adaptationEvent.create({
      data: {
        userId: session.user.id,
        classification: "INJURY",
        rationale: `Manual injury trigger reported for ${sorenessPainLocation}. Exercises adjusted accordingly.`,
        prePlanId: activeWorkoutPlan.id,
        postPlanId: updatedWorkoutPlan.id,
      },
    });

    return NextResponse.json({
      success: true,
      workoutPlan: updatedWorkoutPlan,
      adaptationEvent,
    });
  } catch (error) {
    console.error("POST /api/injury error:", error);
    return NextResponse.json({ error: "Failed to process injury modification plan." }, { status: 500 });
  }
}
