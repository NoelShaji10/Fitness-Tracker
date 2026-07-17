import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import PlateStack from "@/components/PlateStack";
import Link from "next/link";
import { ShoppingBag, ChevronRight, Apple } from "lucide-react";

export default async function NutritionPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const activePlan = await prisma.mealPlan.findFirst({
    where: { userId: session.user.id, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });

  if (!activePlan) {
    return (
      <div className="border border-brand-ink/20 p-12 text-center bg-brand-paper">
        <h2 className="font-sans text-lg font-bold mb-4">// NO ACTIVE MEAL PLAN DETECTED</h2>
        <p className="text-sm font-sans mb-6 text-brand-ink/75">
          Please complete onboarding to generate your customized macro meal plan.
        </p>
        <Link
          href="/dashboard/onboarding"
          className="inline-block border border-brand-ink bg-brand-ink px-6 py-2.5 font-sans text-xs font-bold uppercase tracking-widest text-brand-paper hover:bg-brand-load hover:border-brand-load transition-all"
        >
          START INITIAL SETUP
        </Link>
      </div>
    );
  }

  let meals: Record<string, any[]> = {};
  let shoppingList: { category: string; items: string[] }[] = [];

  try {
    meals = JSON.parse(activePlan.mealsJson);
    shoppingList = JSON.parse(activePlan.shoppingListJson);
  } catch (e) {
    console.error("Failed to parse meal plan JSON:", e);
  }

  // Calculate relative plates for macro ratio visual check
  const getMacroRatioPlates = (macro: string) => {
    if (macro === "protein") return 3;
    if (macro === "carbs") return 4;
    return 2;
  };

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="border-b border-brand-ink/20 pb-4 flex justify-between items-end">
        <div>
          <span className="font-sans text-[10px] uppercase tracking-widest text-brand-load font-bold">
            DIETARY PROGRAM
          </span>
          <h1 className="font-sans text-2xl font-black tracking-tight text-brand-ink uppercase">
            NUTRITIONAL LEDGER LOGS
          </h1>
        </div>
      </div>

      {/* Target Macros Overview Ledger - Card Surface Contrast */}
      <div className="border border-brand-ink/15 bg-brand-paper shadow-sm p-6">
        <h3 className="font-sans text-xs uppercase tracking-widest text-brand-ink/75 mb-5 font-bold border-b border-brand-ink/10 pb-2">
          DAILY MACRONUTRIENT BALANCE SHEET
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div className="border-r border-brand-ink/10 last:border-none pr-4">
            <span className="block font-sans text-[9px] text-brand-ink/50 uppercase font-bold tracking-wider">
              TOTAL ENERGY
            </span>
            <span className="block font-mono text-3xl font-black text-brand-ink mt-1.5 leading-none">
              {Math.round(activePlan.macroCalories)}{" "}
              <span className="text-[10px] font-sans font-bold text-brand-ink/65 uppercase tracking-wide">Kcal</span>
            </span>
            <div className="mt-2.5">
              <PlateStack value={5} max={5} variant="load" size="sm" />
            </div>
          </div>

          <div className="border-r border-brand-ink/10 last:border-none pr-4">
            <span className="block font-sans text-[9px] text-brand-ink/50 uppercase font-bold tracking-wider">
              01 // PROTEIN
            </span>
            <span className="block font-mono text-3xl font-black text-brand-ink mt-1.5 leading-none">
              {Math.round(activePlan.macroProtein)}{" "}
              <span className="text-[10px] font-sans font-bold text-brand-ink/65 uppercase tracking-wide">G</span>
            </span>
            <div className="mt-2.5">
              <PlateStack value={getMacroRatioPlates("protein")} max={5} variant="gain" size="sm" />
            </div>
          </div>

          <div className="border-r border-brand-ink/10 last:border-none pr-4">
            <span className="block font-sans text-[9px] text-brand-ink/50 uppercase font-bold tracking-wider">
              02 // CARBOHYDRATES
            </span>
            <span className="block font-mono text-3xl font-black text-brand-ink mt-1.5 leading-none">
              {Math.round(activePlan.macroCarbs)}{" "}
              <span className="text-[10px] font-sans font-bold text-brand-ink/65 uppercase tracking-wide">G</span>
            </span>
            <div className="mt-2.5">
              <PlateStack value={getMacroRatioPlates("carbs")} max={5} variant="load" size="sm" />
            </div>
          </div>

          <div>
            <span className="block font-sans text-[9px] text-brand-ink/50 uppercase font-bold tracking-wider">
              03 // DIETARY FAT
            </span>
            <span className="block font-mono text-3xl font-black text-brand-ink mt-1.5 leading-none">
              {Math.round(activePlan.macroFat)}{" "}
              <span className="text-[10px] font-sans font-bold text-brand-ink/65 uppercase tracking-wide">G</span>
            </span>
            <div className="mt-2.5">
              <PlateStack value={getMacroRatioPlates("fat")} max={5} variant="neutral" size="sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Rationale */}
      <div className="border border-brand-ink/15 bg-brand-paper-dark p-6">
        <h3 className="font-sans text-xs uppercase tracking-widest text-brand-ink/75 mb-2 font-bold">
          DIETITIAN NOTES & TARGET EXPLANATIONS
        </h3>
        <p className="font-sans text-sm text-brand-ink/90 leading-relaxed whitespace-pre-line">
          {activePlan.rationale}
        </p>
      </div>

      {/* Row-Based Dense 7-Day Meal Rotation Ledger */}
      <div className="space-y-4">
        <h3 className="font-sans text-xs uppercase tracking-widest text-brand-ink/75 font-bold border-b border-brand-ink/15 pb-2">
          7-DAY MEAL ROTATION
        </h3>
        
        <div className="border border-brand-ink/15 bg-brand-paper divide-y divide-brand-ink/10 shadow-sm">
          {Object.entries(meals).map(([day, dayMeals], idx) => (
            <div
              key={day}
              className="p-6 flex flex-col md:flex-row md:items-center gap-6 hover:bg-brand-paper-dark/30 transition-colors duration-150"
            >
              {/* Day info column */}
              <div className="w-28 shrink-0">
                <span className="block font-mono text-[9px] text-brand-load font-bold uppercase tracking-wider">
                  DAY 0{idx + 1}
                </span>
                <h4 className="font-sans text-sm font-bold text-brand-ink uppercase">{day}</h4>
              </div>

              {/* Meals sub-grid */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {dayMeals.map((mealItem: any, mealIdx: number) => (
                  <div key={mealIdx} className="space-y-1 bg-brand-paper-dark/30 p-3 rounded-none border border-brand-ink/[0.04]">
                    <div className="flex justify-between font-sans text-[9px] uppercase font-black text-brand-ink/70">
                      <span>{mealItem.meal}</span>
                      <span className="font-mono text-brand-load">{mealItem.calories} KCAL</span>
                    </div>
                    <p className="text-brand-ink/90 font-sans text-[11px] leading-snug line-clamp-2" title={mealItem.description}>
                      {mealItem.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shopping List Segment - Consolidating list elements */}
      <div className="border border-brand-ink/15 bg-brand-paper shadow-sm p-8">
        <div className="flex items-center gap-3 border-b border-brand-ink/15 pb-4 mb-6">
          <ShoppingBag className="h-4 w-4 text-brand-load" />
          <h3 className="font-sans text-xs uppercase tracking-widest text-brand-ink font-bold">
            GROCERY PROCUREMENT LIST
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {shoppingList.map((cat: any, catIdx: number) => (
            <div key={catIdx} className="space-y-3">
              <h4 className="font-sans text-xs uppercase font-bold text-brand-load border-b border-brand-ink/10 pb-1">
                // {cat.category}
              </h4>
              <ul className="divide-y divide-brand-ink/5">
                {cat.items.map((item: string, itemIdx: number) => (
                  <li
                    key={itemIdx}
                    className="flex items-center gap-3 font-sans text-xs text-brand-ink py-2 hover:bg-brand-paper-dark/30 transition-colors px-1"
                  >
                    <input
                      type="checkbox"
                      id={`shop-${catIdx}-${itemIdx}`}
                      className="border border-brand-ink/40 bg-transparent focus:ring-0 text-brand-load rounded-none h-3.5 w-3.5 cursor-pointer accent-brand-load transition-all"
                    />
                    <label
                      htmlFor={`shop-${catIdx}-${itemIdx}`}
                      className="cursor-pointer select-none leading-none pt-0.5 hover:text-brand-load flex-1"
                    >
                      {item}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
