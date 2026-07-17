import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import PlateStack from "@/components/PlateStack";
import Link from "next/link";
import { AlertCircle, Calendar } from "lucide-react";
import AdaptationHistory from "@/components/AdaptationHistory";
import ResolveInjuryButton from "@/components/ResolveInjuryButton";

export default async function WorkoutPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const activePlan = await prisma.workoutPlan.findFirst({
    where: { userId: session.user.id, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });

  if (!activePlan) {
    return (
      <div className="border border-brand-ink/20 p-12 text-center bg-brand-paper">
        <h2 className="font-sans text-lg font-bold mb-4">// NO ACTIVE PLAN DETECTED</h2>
        <p className="text-sm font-sans mb-6 text-brand-ink/75">
          Please complete the onboarding questionnaire to generate your baseline Week 1 plan.
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

  let workouts = [];
  try {
    workouts = JSON.parse(activePlan.exercisesJson);
  } catch (e) {
    console.error("Failed to parse exercisesJson:", e);
  }

  // Check if this plan was generated as an injury adjustment
  const isInjuryPlan = activePlan.rationale?.includes("[INJURY MODIFICATION]");

  // Calculate visual plate count (1-5 stack) for load representations
  const getWeightPlates = (weight: number | string) => {
    const num = Number(weight);
    if (isNaN(num) || num <= 0) return 1;
    if (num < 15) return 1;
    if (num < 30) return 2;
    if (num < 50) return 3;
    if (num < 80) return 4;
    return 5;
  };

  // Find the top programmed lift weight in the plan for high-contrast hierarchy
  const allWeights = workouts.flatMap((w: any) =>
    (w.exercises || []).map((e: any) => Number(e.weight) || 0)
  );
  const maxWeight = allWeights.length > 0 ? Math.max(...allWeights) : 0;

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-brand-ink/20 pb-4">
        <div>
          <span className="font-sans text-[10px] uppercase tracking-widest text-brand-load font-bold">
            SCHEDULED PROGRAM
          </span>
          <h1 className="font-sans text-2xl font-black tracking-tight text-brand-ink uppercase">
            TRAINING LEDGER SHEET
          </h1>
        </div>
        <div className="mt-3 sm:mt-0">
          <Link
            href="/dashboard/checkin"
            className="inline-flex items-center gap-2 border border-brand-ink/40 bg-brand-paper px-5 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-brand-ink hover:bg-brand-ink hover:text-brand-paper transition-all cursor-pointer shadow-sm"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>RECORD DAILY LOG</span>
          </Link>
        </div>
      </div>

      {/* Injury Notice Banner */}
      {isInjuryPlan && (
        <div className="border border-brand-strain bg-brand-strain/10 p-4 flex gap-3 text-brand-strain">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-sans text-xs uppercase tracking-wider font-bold">
              [ACTIVE TRIGGER]: INJURY MODIFICATION SHEET APPLIED
            </h4>
            <p className="text-xs font-sans mt-1 opacity-90 leading-relaxed">
              Exercises have been immediately adapted to exclude load on the reported painful joints or muscles. Maintain careful movements and follow safety guidelines.
            </p>
            <ResolveInjuryButton />
          </div>
        </div>
      )}

      {/* High Hierarchy Top Summary Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="border border-brand-ink/15 bg-brand-paper p-5 shadow-sm">
          <span className="block font-sans text-[10px] text-brand-ink/50 uppercase font-bold tracking-wider">
            Active Week Target
          </span>
          <span className="block font-mono text-4xl font-black text-brand-load mt-1.5">
            {activePlan.weekNumber}
          </span>
        </div>
        <div className="border border-brand-ink/15 bg-brand-paper p-5 shadow-sm">
          <span className="block font-sans text-[10px] text-brand-ink/50 uppercase font-bold tracking-wider">
            Top Scheduled Load
          </span>
          <span className="block font-mono text-4xl font-black text-brand-ink mt-1.5">
            {maxWeight > 0 ? `${maxWeight} ` : "BW "}
            <span className="text-xs font-sans font-normal text-brand-ink/65 uppercase tracking-wide">
              {maxWeight > 0 ? "KG Target" : "Bodyweight"}
            </span>
          </span>
        </div>
      </div>

      {/* Rationale Ledger Card */}
      <div className="border border-brand-ink/15 bg-brand-paper-dark p-6">
        <h3 className="font-sans text-xs uppercase tracking-widest text-brand-ink/75 mb-2.5 font-bold">
          COACH RATIO & PROGRAMMING LOGS
        </h3>
        <p className="font-sans text-sm text-brand-ink/90 leading-relaxed whitespace-pre-line">
          {activePlan.rationale?.replace("[INJURY MODIFICATION]", "").trim()}
        </p>
      </div>

      {/* Workouts Ledger List */}
      <div className="space-y-8">
        {workouts.map((dayPlan: any, idx: number) => (
          <div
            key={idx}
            className="border border-brand-ink/15 bg-brand-paper shadow-sm overflow-hidden"
          >
            {/* Day Header */}
            <div className="bg-brand-paper-dark border-b border-brand-ink/15 px-6 py-3.5 flex justify-between items-center">
              <span className="font-sans text-xs font-bold text-brand-load uppercase tracking-wider">
                SESSION {idx + 1} // {dayPlan.day}
              </span>
              <h2 className="font-sans text-xs font-bold uppercase tracking-wider text-brand-ink/70">
                {dayPlan.name}
              </h2>
            </div>

            {/* Exercises Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-brand-ink/15 font-sans text-[10px] font-bold text-brand-ink/60 uppercase tracking-wider bg-brand-paper-dark/30">
                    <th className="px-6 py-3">EXERCISE</th>
                    <th className="px-6 py-3">SETS × REPS</th>
                    <th className="px-6 py-3">REST</th>
                    <th className="px-6 py-3 text-right">TARGET LOAD</th>
                    <th className="px-6 py-3 text-center">INTENSITY INDEX</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-ink/10 font-sans text-sm">
                  {dayPlan.exercises.map((ex: any, exIdx: number) => {
                    const weightVal = Number(ex.weight);
                    const isBodyweight = isNaN(weightVal) || weightVal === 0;

                    // Semantic progress mapping:
                    // - injury plan: strain (brick red)
                    // - heavy lifting set (reps <= 5 or weight >= 75kg): strain (brick red) representing near-failure
                    // - bodyweight: gain (olive) representing mobility
                    // - standard: load (steel-blue)
                    let plateVariant: "load" | "strain" | "gain" = "load";
                    if (isInjuryPlan) {
                      plateVariant = "strain";
                    } else if (isBodyweight) {
                      plateVariant = "gain";
                    } else if (weightVal >= 75 || ex.reps.includes("5") || ex.reps.includes("4") || ex.reps.includes("3")) {
                      plateVariant = "strain";
                    }

                    return (
                      <tr key={exIdx} className="hover:bg-brand-paper-dark/50 transition-colors duration-150">
                        <td className="px-6 py-4 font-sans font-semibold text-sm text-brand-ink">
                          {ex.name}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-brand-ink">
                          {ex.sets} × {ex.reps}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-brand-ink/70">
                          {ex.rest}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-xs font-semibold text-brand-ink">
                          {isBodyweight ? "BODYWEIGHT" : `${ex.weight} kg`}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <PlateStack
                            value={getWeightPlates(ex.weight)}
                            max={5}
                            variant={plateVariant}
                            size="sm"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Adaptation Log Timeline */}
      <div className="pt-6 border-t border-brand-ink/15">
        <AdaptationHistory userId={session.user.id} />
      </div>
    </div>
  );
}
