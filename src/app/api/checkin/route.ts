import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { generateGeminiContent } from "@/lib/ai/llmClient";
import { injurySystemPrompt } from "@/prompts/injury";

const checkInSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Date must be in YYYY-MM-DD format" }),
  workoutCompleted: z.boolean(),
  workoutPerformanceJson: z.string().nullable().optional(),
  mealsLoggedJson: z.string().nullable().optional(),
  sorenessPainLocation: z.string().nullable().optional(),
  sorenessPainSeverity: z.number().min(0).max(10).nullable().optional(),
  sorenessPainDescription: z.string().nullable().optional(),
  energyLevel: z.number().min(1).max(10).nullable().optional(),
  mood: z.string().nullable().optional(),
  sleepHours: z.number().nullable().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = checkInSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const data = result.data;

    // Save the daily check-in (upsert by user and date)
    const checkIn = await prisma.checkIn.upsert({
      where: {
        userId_date: {
          userId: session.user.id,
          date: data.date,
        },
      },
      update: {
        workoutCompleted: data.workoutCompleted,
        workoutPerformanceJson: data.workoutPerformanceJson,
        mealsLoggedJson: data.mealsLoggedJson,
        sorenessPainLocation: data.sorenessPainLocation,
        sorenessPainSeverity: data.sorenessPainSeverity,
        sorenessPainDescription: data.sorenessPainDescription,
        energyLevel: data.energyLevel,
        mood: data.mood,
        sleepHours: data.sleepHours,
      },
      create: {
        userId: session.user.id,
        date: data.date,
        workoutCompleted: data.workoutCompleted,
        workoutPerformanceJson: data.workoutPerformanceJson,
        mealsLoggedJson: data.mealsLoggedJson,
        sorenessPainLocation: data.sorenessPainLocation,
        sorenessPainSeverity: data.sorenessPainSeverity,
        sorenessPainDescription: data.sorenessPainDescription,
        energyLevel: data.energyLevel,
        mood: data.mood,
        sleepHours: data.sleepHours,
      },
    });

    let injuryModified = false;
    let updatedWorkoutPlan = null;

    // Check if check-in triggers an immediate injury modification (severity > 3)
    if (data.sorenessPainSeverity && data.sorenessPainSeverity > 3 && data.sorenessPainLocation) {
      console.log(`Injury detected at ${data.sorenessPainLocation} (Severity: ${data.sorenessPainSeverity}/10). Initiating immediate plan modification...`);
      
      const activeWorkoutPlan = await prisma.workoutPlan.findFirst({
        where: { userId: session.user.id, status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
      });

      if (activeWorkoutPlan) {
        try {
          const promptInput = `
Active Workout Plan exercises:
${activeWorkoutPlan.exercisesJson}

Injury Pain Report:
- Pain Location: ${data.sorenessPainLocation}
- Severity: ${data.sorenessPainSeverity}/10
- Description: ${data.sorenessPainDescription || "None provided"}
          `;

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
          updatedWorkoutPlan = await prisma.workoutPlan.create({
            data: {
              userId: session.user.id,
              weekNumber: activeWorkoutPlan.weekNumber,
              status: "ACTIVE",
              exercisesJson: JSON.stringify(modifiedJson.exercises),
              rationale: `[INJURY MODIFICATION] ${modifiedJson.rationale}`,
            },
          });

          // Create adaptation event
          await prisma.adaptationEvent.create({
            data: {
              userId: session.user.id,
              checkInId: checkIn.id,
              classification: "INJURY",
              rationale: `Pain reported in ${data.sorenessPainLocation}. Exercises modified to exclude strain on the area.`,
              prePlanId: activeWorkoutPlan.id,
              postPlanId: updatedWorkoutPlan.id,
            },
          });

          injuryModified = true;
        } catch (geminiError) {
          console.error("Gemini injury re-plan failed:", geminiError);
        }
      }
    }

    return NextResponse.json({
      checkIn,
      injuryModified,
      updatedWorkoutPlan,
    });
  } catch (error) {
    console.error("POST /api/checkin error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
