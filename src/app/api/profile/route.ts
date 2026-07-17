import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const profileSchema = z.object({
  goal: z.string().min(1),
  fitnessLevel: z.string().min(1),
  dietaryRestrictions: z.string(),
  injuryHistory: z.string(),
  availableEquipment: z.string(),
  weeklySchedule: z.array(z.string()),
  weight: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  age: z.number().nullable().optional(),
  gender: z.string().nullable().optional(),
  activityLevel: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = profileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const data = result.data;
    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        goal: data.goal,
        fitnessLevel: data.fitnessLevel,
        dietaryRestrictions: data.dietaryRestrictions,
        injuryHistory: data.injuryHistory,
        availableEquipment: data.availableEquipment,
        weeklySchedule: JSON.stringify(data.weeklySchedule),
        weight: data.weight,
        height: data.height,
        age: data.age,
        gender: data.gender,
        activityLevel: data.activityLevel,
      },
      create: {
        userId: session.user.id,
        goal: data.goal,
        fitnessLevel: data.fitnessLevel,
        dietaryRestrictions: data.dietaryRestrictions,
        injuryHistory: data.injuryHistory,
        availableEquipment: data.availableEquipment,
        weeklySchedule: JSON.stringify(data.weeklySchedule),
        weight: data.weight,
        height: data.height,
        age: data.age,
        gender: data.gender,
        activityLevel: data.activityLevel,
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error("POST /api/profile error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  return POST(req); // UPSERT behavior is standard for onboarding/profile updates
}
