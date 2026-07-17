import prisma from "@/lib/prisma";
import { ArrowRight, PlusCircle, MinusCircle, AlertCircle } from "lucide-react";

interface ExerciseItem {
  name: string;
  sets: number;
  reps: string;
  weight: number | string;
  rest: string;
}

interface DayPlan {
  day: string;
  name: string;
  exercises: ExerciseItem[];
}

interface DiffItem {
  type: "added" | "removed" | "modified";
  day: string;
  exerciseName: string;
  detail: string;
}

// Pure function to diff exercises between two plan JSONs
function diffWorkoutPlans(pre: DayPlan[], post: DayPlan[]): DiffItem[] {
  const diffs: DiffItem[] = [];
  const postMap = new Map<string, DayPlan>();
  for (const day of post) {
    postMap.set(day.day, day);
  }

  for (const preDay of pre) {
    const postDay = postMap.get(preDay.day);
    if (!postDay) {
      diffs.push({
        type: "removed",
        day: preDay.day,
        exerciseName: preDay.name,
        detail: "Session removed from training schedule.",
      });
      continue;
    }

    const postExMap = new Map<string, ExerciseItem>();
    for (const ex of postDay.exercises) {
      postExMap.set(ex.name, ex);
    }

    for (const preEx of preDay.exercises) {
      const postEx = postExMap.get(preEx.name);
      if (!postEx) {
        diffs.push({
          type: "removed",
          day: preDay.day,
          exerciseName: preEx.name,
          detail: "Exercise removed.",
        });
      } else {
        const weightChanged = Number(preEx.weight) !== Number(postEx.weight);
        const volumeChanged = preEx.sets !== postEx.sets || preEx.reps !== postEx.reps;

        if (weightChanged || volumeChanged) {
          let detail = "";
          if (weightChanged) {
            const preW = Number(preEx.weight) === 0 ? "BW" : `${preEx.weight}kg`;
            const postW = Number(postEx.weight) === 0 ? "BW" : `${postEx.weight}kg`;
            detail += `Load: ${preW} → ${postW}. `;
          }
          if (volumeChanged) {
            detail += `Volume: ${preEx.sets}x${preEx.reps} → ${postEx.sets}x${postEx.reps}.`;
          }
          diffs.push({
            type: "modified",
            day: preDay.day,
            exerciseName: preEx.name,
            detail: detail.trim(),
          });
        }
      }
    }

    const preExMap = new Map<string, ExerciseItem>();
    for (const ex of preDay.exercises) {
      preExMap.set(ex.name, ex);
    }

    for (const postEx of postDay.exercises) {
      if (!preExMap.has(postEx.name)) {
        const postW = Number(postEx.weight) === 0 ? "BW" : `${postEx.weight}kg`;
        diffs.push({
          type: "added",
          day: preDay.day,
          exerciseName: postEx.name,
          detail: `Added (Load: ${postW}, Vol: ${postEx.sets}x${postEx.reps}).`,
        });
      }
    }
  }

  return diffs;
}

export default async function AdaptationHistory({ userId }: { userId: string }) {
  // Query adaptation events for the user
  const events = await prisma.adaptationEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (events.length === 0) {
    return null;
  }

  // Load referenced workout plans for diffing
  const eventsWithDiffs = await Promise.all(
    events.map(async (event) => {
      let diffList: DiffItem[] = [];

      if (event.prePlanId && event.postPlanId) {
        const prePlan = await prisma.workoutPlan.findUnique({ where: { id: event.prePlanId } });
        const postPlan = await prisma.workoutPlan.findUnique({ where: { id: event.postPlanId } });

        if (prePlan && postPlan) {
          try {
            const preEx = JSON.parse(prePlan.exercisesJson);
            const postEx = JSON.parse(postPlan.exercisesJson);
            diffList = diffWorkoutPlans(preEx, postEx);
          } catch (e) {
            console.error("Failed to diff plans:", e);
          }
        }
      }

      return {
        event,
        diffList,
      };
    })
  );

  return (
    <div className="space-y-6">
      <h3 className="font-sans text-xs uppercase tracking-widest text-brand-ink/80 font-bold border-b border-brand-ink/15 pb-2">
        ADAPTATION CHRONOLOGICAL TIMELINE
      </h3>

      <div className="space-y-6">
        {eventsWithDiffs.map(({ event, diffList }, idx) => {
          const isInjury = event.classification === "INJURY";
          const isGain = event.classification === "PROGRESSION";

          let borderClass = "border-brand-ink/20";
          let badgeClass = "bg-brand-load text-white";

          if (isInjury) {
            borderClass = "border-brand-strain";
            badgeClass = "bg-brand-strain text-white";
          } else if (isGain) {
            borderClass = "border-brand-gain";
            badgeClass = "bg-brand-gain text-white";
          }

          return (
            <div
              key={event.id}
              className={`border ${borderClass} bg-brand-paper p-6 shadow-sm`}
            >
              {/* Event Header */}
              <div className="flex justify-between items-center border-b border-brand-ink/10 pb-2.5 mb-4">
                <span className={`font-sans text-[9px] font-bold px-2 py-0.5 uppercase tracking-wide rounded-none ${badgeClass}`}>
                  {event.classification}
                </span>
                <span className="font-mono text-[10px] text-brand-ink/65">
                  {new Date(event.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Rationale */}
              <p className="font-sans text-xs text-brand-ink leading-relaxed mb-4">
                <strong className="font-sans">Trigger Rationale:</strong> {event.rationale}
              </p>

              {/* Diff List */}
              {diffList.length > 0 ? (
                <div className="border border-brand-ink/10 pt-3 space-y-2.5 bg-brand-paper-dark p-3.5">
                  <span className="block font-sans text-[9px] text-brand-ink/60 uppercase font-bold tracking-wider">
                    // LEDGER SHEET DELTA DIFFS:
                  </span>
                  <div className="space-y-1.5">
                    {diffList.map((diff, diffIdx) => {
                      let diffColor = "text-brand-load";
                      let DiffIcon = ArrowRight;

                      if (diff.type === "added") {
                        diffColor = "text-brand-gain font-semibold";
                        DiffIcon = PlusCircle;
                      } else if (diff.type === "removed") {
                        diffColor = "text-brand-strain";
                        DiffIcon = MinusCircle;
                      }

                      return (
                        <div key={diffIdx} className="flex items-center gap-2 font-sans text-xs">
                          <DiffIcon className={`h-3.5 w-3.5 ${diffColor} shrink-0`} />
                          <span className="text-[9px] font-sans font-bold text-brand-ink/50 uppercase tracking-wide">[{diff.day}]</span>
                          <span className="text-brand-ink font-bold">{diff.exerciseName}:</span>
                          <span className={`text-[11px] font-mono ${diffColor}`}>{diff.detail}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-[10px] font-sans text-brand-ink/60 border-t border-dashed border-brand-ink/15 pt-3">
                  // NO DIRECT EXERCISE DIFFERENCES RECORDED FOR THIS STATE STABILITY.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
