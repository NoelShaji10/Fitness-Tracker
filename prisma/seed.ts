import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning database...");
  await prisma.adaptationEvent.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.workoutPlan.deleteMany();
  await prisma.mealPlan.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  console.log("Creating demo user...");
  const hashedPassword = await bcrypt.hash("password123", 10);
  const user = await prisma.user.create({
    data: {
      email: "demo@auracoach.com",
      password: hashedPassword,
    },
  });

  console.log("Creating demo profile...");
  const profile = await prisma.profile.create({
    data: {
      userId: user.id,
      goal: "Build Muscle",
      fitnessLevel: "Intermediate",
      dietaryRestrictions: "None",
      injuryHistory: "Slight left knee discomfort occasionally",
      availableEquipment: "Barbell, Dumbbells, Pull-up Bar, Bench",
      weeklySchedule: JSON.stringify(["MON", "WED", "FRI"]),
      weight: 75.0,
      height: 180.0,
      age: 28,
      gender: "Male",
      activityLevel: "Moderate",
    },
  });

  console.log("Creating default Week 1 plans...");
  
  const exercisesJson = JSON.stringify([
    {
      day: "MON",
      name: "Push Day",
      exercises: [
        { name: "Barbell Bench Press", sets: 3, reps: "8-10", weight: 60, rest: "90s" },
        { name: "Overhead Press", sets: 3, reps: "8-10", weight: 35, rest: "90s" },
        { name: "Incline Dumbbell Flyes", sets: 3, reps: "10-12", weight: 14, rest: "75s" },
        { name: "Lateral Raises", sets: 3, reps: "12-15", weight: 8, rest: "60s" },
        { name: "Tricep Pushdowns", sets: 3, reps: "10-12", weight: 20, rest: "60s" }
      ]
    },
    {
      day: "WED",
      name: "Pull Day",
      exercises: [
        { name: "Pull-ups", sets: 3, reps: "6-8", weight: 0, rest: "90s" },
        { name: "Barbell Rows", sets: 3, reps: "8-10", weight: 50, rest: "90s" },
        { name: "Lat Pulldowns", sets: 3, reps: "10-12", weight: 45, rest: "75s" },
        { name: "Bicep Curls", sets: 3, reps: "10-12", weight: 12, rest: "60s" },
        { name: "Face Pulls", sets: 3, reps: "12-15", weight: 15, rest: "60s" }
      ]
    },
    {
      day: "FRI",
      name: "Leg Day",
      exercises: [
        { name: "Barbell Squats", sets: 3, reps: "8-10", weight: 70, rest: "120s" },
        { name: "Romanian Deadlifts", sets: 3, reps: "8-10", weight: 60, rest: "90s" },
        { name: "Leg Extensions", sets: 3, reps: "10-12", weight: 40, rest: "75s" },
        { name: "Calf Raises", sets: 3, reps: "12-15", weight: 50, rest: "60s" },
        { name: "Hanging Knee Raises", sets: 3, reps: "12-15", weight: 0, rest: "60s" }
      ]
    }
  ]);

  const workoutPlan = await prisma.workoutPlan.create({
    data: {
      userId: user.id,
      weekNumber: 1,
      status: "ACTIVE",
      exercisesJson,
      rationale: "Initial plan set up for baseline strength metrics, incorporating custom split for available equipment.",
    },
  });

  const mealsJson = JSON.stringify({
    MON: [
      { meal: "Breakfast", description: "Oatmeal with protein powder, banana, and peanut butter", calories: 550, protein: 35, carbs: 70, fat: 15 },
      { meal: "Lunch", description: "Grilled chicken breast with brown rice and broccoli", calories: 600, protein: 45, carbs: 65, fat: 12 },
      { meal: "Snack", description: "Greek yogurt with mixed berries and almonds", calories: 300, protein: 20, carbs: 25, fat: 10 },
      { meal: "Dinner", description: "Baked salmon with sweet potato and asparagus", calories: 585, protein: 40, carbs: 50, fat: 22 }
    ],
    TUE: [
      { meal: "Breakfast", description: "Scrambled eggs (3) with whole wheat toast and spinach", calories: 480, protein: 28, carbs: 35, fat: 20 },
      { meal: "Lunch", description: "Turkey wrap with whole wheat tortilla, avocado, and lettuce", calories: 550, protein: 35, carbs: 45, fat: 18 },
      { meal: "Snack", description: "Whey protein shake with an apple", calories: 250, protein: 26, carbs: 30, fat: 3 },
      { meal: "Dinner", description: "Lean beef stir-fry with mixed vegetables and quinoa", calories: 655, protein: 45, carbs: 60, fat: 18 }
    ],
    WED: [
      { meal: "Breakfast", description: "Oatmeal with protein powder, banana, and peanut butter", calories: 550, protein: 35, carbs: 70, fat: 15 },
      { meal: "Lunch", description: "Grilled chicken breast with brown rice and broccoli", calories: 600, protein: 45, carbs: 65, fat: 12 },
      { meal: "Snack", description: "Greek yogurt with mixed berries and almonds", calories: 300, protein: 20, carbs: 25, fat: 10 },
      { meal: "Dinner", description: "Baked salmon with sweet potato and asparagus", calories: 585, protein: 40, carbs: 50, fat: 22 }
    ],
    THU: [
      { meal: "Breakfast", description: "Scrambled eggs (3) with whole wheat toast and spinach", calories: 480, protein: 28, carbs: 35, fat: 20 },
      { meal: "Lunch", description: "Turkey wrap with whole wheat tortilla, avocado, and lettuce", calories: 550, protein: 35, carbs: 45, fat: 18 },
      { meal: "Snack", description: "Whey protein shake with an apple", calories: 250, protein: 26, carbs: 30, fat: 3 },
      { meal: "Dinner", description: "Lean beef stir-fry with mixed vegetables and quinoa", calories: 655, protein: 45, carbs: 60, fat: 18 }
    ],
    FRI: [
      { meal: "Breakfast", description: "Oatmeal with protein powder, banana, and peanut butter", calories: 550, protein: 35, carbs: 70, fat: 15 },
      { meal: "Lunch", description: "Grilled chicken breast with brown rice and broccoli", calories: 600, protein: 45, carbs: 65, fat: 12 },
      { meal: "Snack", description: "Greek yogurt with mixed berries and almonds", calories: 300, protein: 20, carbs: 25, fat: 10 },
      { meal: "Dinner", description: "Baked salmon with sweet potato and asparagus", calories: 585, protein: 40, carbs: 50, fat: 22 }
    ],
    SAT: [
      { meal: "Breakfast", description: "Scrambled eggs (3) with whole wheat toast and spinach", calories: 480, protein: 28, carbs: 35, fat: 20 },
      { meal: "Lunch", description: "Turkey wrap with whole wheat tortilla, avocado, and lettuce", calories: 550, protein: 35, carbs: 45, fat: 18 },
      { meal: "Snack", description: "Whey protein shake with an apple", calories: 250, protein: 26, carbs: 30, fat: 3 },
      { meal: "Dinner", description: "Lean beef stir-fry with mixed vegetables and quinoa", calories: 655, protein: 45, carbs: 60, fat: 18 }
    ],
    SUN: [
      { meal: "Breakfast", description: "Protein pancakes with blueberries and maple syrup", calories: 500, protein: 30, carbs: 65, fat: 10 },
      { meal: "Lunch", description: "Quinoa salad with chickpeas, cucumbers, feta, and olive oil", calories: 550, protein: 20, carbs: 60, fat: 20 },
      { meal: "Snack", description: "Cottage cheese with pineapple chunks", calories: 220, protein: 18, carbs: 20, fat: 5 },
      { meal: "Dinner", description: "Baked cod with quinoa and roasted brussels sprouts", calories: 485, protein: 38, carbs: 45, fat: 15 }
    ]
  });

  const shoppingListJson = JSON.stringify([
    { category: "Proteins", items: ["Chicken breast (1.5 kg)", "Salmon fillets (600g)", "Turkey breast slices (500g)", "Lean beef (1 kg)", "Eggs (2 dozen)", "Greek yogurt (1.5 kg)", "Whey protein powder (1 tub)"] },
    { category: "Carbs & Grains", items: ["Oatmeal (1 kg)", "Brown rice (1 kg)", "Quinoa (500g)", "Whole wheat bread (1 loaf)", "Whole wheat tortillas (1 pack)", "Sweet potatoes (2 kg)"] },
    { category: "Fats & Nuts", items: ["Peanut butter (1 jar)", "Almonds (500g)", "Avocados (4)", "Olive oil (1 bottle)"] },
    { category: "Produce", items: ["Bananas (1 bunch)", "Apples (6)", "Mixed berries (2 packs)", "Spinach (3 bags)", "Broccoli (3 heads)", "Asparagus (2 bunches)", "Brussels sprouts (1 bag)", "Stir-fry mixed vegetables (2 bags)"] }
  ]);

  const mealPlan = await prisma.mealPlan.create({
    data: {
      userId: user.id,
      weekNumber: 1,
      status: "ACTIVE",
      mealsJson,
      macroProtein: 140,
      macroCarbs: 260,
      macroFat: 70,
      macroCalories: 2230,
      shoppingListJson,
      rationale: "Slight caloric surplus calculated using BMR (~1700 kcal) x active multiplier (~1.3) + 300 kcal surplus for lean gains.",
    },
  });

  console.log("Seeding daily check-ins (simulating a full Week)...");
  
  // Seed Monday (Good Day)
  await prisma.checkIn.create({
    data: {
      userId: user.id,
      date: "2026-07-13",
      workoutCompleted: true,
      workoutPerformanceJson: JSON.stringify({
        completedExercises: [
          { name: "Barbell Bench Press", sets: [{ reps: 10, weight: 60 }, { reps: 9, weight: 60 }, { reps: 8, weight: 60 }] },
          { name: "Overhead Press", sets: [{ reps: 10, weight: 35 }, { reps: 10, weight: 35 }, { reps: 9, weight: 35 }] },
          { name: "Incline Dumbbell Flyes", sets: [{ reps: 12, weight: 14 }, { reps: 11, weight: 14 }, { reps: 10, weight: 14 }] },
          { name: "Lateral Raises", sets: [{ reps: 15, weight: 8 }, { reps: 14, weight: 8 }, { reps: 13, weight: 8 }] },
          { name: "Tricep Pushdowns", sets: [{ reps: 12, weight: 20 }, { reps: 12, weight: 20 }, { reps: 11, weight: 20 }] }
        ]
      }),
      mealsLoggedJson: JSON.stringify({ protein: 145, carbs: 265, fat: 72, calories: 2288 }),
      energyLevel: 8,
      mood: "Good",
      sleepHours: 7.5,
    },
  });

  // Seed Tuesday (Rest Day, Macro Compliant)
  await prisma.checkIn.create({
    data: {
      userId: user.id,
      date: "2026-07-14",
      workoutCompleted: false,
      mealsLoggedJson: JSON.stringify({ protein: 138, carbs: 255, fat: 68, calories: 2184 }),
      energyLevel: 7,
      mood: "Steady",
      sleepHours: 8.0,
    },
  });

  // Seed Wednesday (Good Day)
  await prisma.checkIn.create({
    data: {
      userId: user.id,
      date: "2026-07-15",
      workoutCompleted: true,
      workoutPerformanceJson: JSON.stringify({
        completedExercises: [
          { name: "Pull-ups", sets: [{ reps: 8, weight: 0 }, { reps: 7, weight: 0 }, { reps: 6, weight: 0 }] },
          { name: "Barbell Rows", sets: [{ reps: 10, weight: 50 }, { reps: 10, weight: 50 }, { reps: 8, weight: 50 }] },
          { name: "Lat Pulldowns", sets: [{ reps: 12, weight: 45 }, { reps: 11, weight: 45 }, { reps: 10, weight: 45 }] },
          { name: "Bicep Curls", sets: [{ reps: 12, weight: 12 }, { reps: 11, weight: 12 }, { reps: 10, weight: 12 }] },
          { name: "Face Pulls", sets: [{ reps: 15, weight: 15 }, { reps: 15, weight: 15 }, { reps: 14, weight: 15 }] }
        ]
      }),
      mealsLoggedJson: JSON.stringify({ protein: 142, carbs: 262, fat: 71, calories: 2240 }),
      energyLevel: 9,
      mood: "Focused",
      sleepHours: 7.8,
    },
  });

  // Seed Thursday (Rest Day)
  await prisma.checkIn.create({
    data: {
      userId: user.id,
      date: "2026-07-16",
      workoutCompleted: false,
      mealsLoggedJson: JSON.stringify({ protein: 140, carbs: 258, fat: 69, calories: 2200 }),
      energyLevel: 7,
      mood: "Normal",
      sleepHours: 7.2,
    },
  });

  // Seed Friday (Injury Scenario Seed - Squats reported pain)
  // Let's seed this as the latest check-in so that in the UI the user can immediately experience the "Injury" detection
  await prisma.checkIn.create({
    data: {
      userId: user.id,
      date: "2026-07-17",
      workoutCompleted: true,
      workoutPerformanceJson: JSON.stringify({
        completedExercises: [
          { name: "Barbell Squats", sets: [{ reps: 4, weight: 70 }] } // Stopped early due to pain
        ]
      }),
      sorenessPainLocation: "Left Knee",
      sorenessPainSeverity: 6, // 6/10 Pain
      sorenessPainDescription: "Sharp pinching pain in the left knee cap on the eccentric phase of the squat. Avoided finishing leg extensions too.",
      mealsLoggedJson: JSON.stringify({ protein: 125, carbs: 210, fat: 65, calories: 1925 }),
      energyLevel: 5,
      mood: "Frustrated",
      sleepHours: 6.5,
    },
  });

  console.log("Seeding complete! Admin user seeded as: demo@auracoach.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
