export interface LiteCheckIn {
  workoutCompleted: boolean;
  sorenessPainSeverity?: number | null;
  sorenessPainLocation?: string | null;
  energyLevel?: number | null;
  workoutPerformanceJson?: string | null;
}

export interface ExercisePerformance {
  exerciseName: string;
  maxWeight: number;
}

export interface WeeklyPerformanceHistory {
  weekNumber: number;
  exercises: ExercisePerformance[];
}

export interface ClassificationResult {
  classification: "INJURY" | "LOW_ADHERENCE" | "PLATEAU" | "BAD_DAY" | "PROGRESSION";
  reason: string;
}

/**
 * Deterministically classifies a week of check-ins into an adaptation category.
 * Pure function: easy to unit test and auditable.
 */
export function classifyCheckIn(
  currentWeekCheckIns: LiteCheckIn[],
  prescribedWorkoutsCount: number,
  history: WeeklyPerformanceHistory[]
): ClassificationResult {
  // 1. INJURY check: Any check-in reporting pain severity > 3
  const injuryCheckIn = currentWeekCheckIns.find(
    (c) =>
      c.sorenessPainSeverity !== undefined &&
      c.sorenessPainSeverity !== null &&
      c.sorenessPainSeverity > 3
  );
  if (injuryCheckIn) {
    return {
      classification: "INJURY",
      reason: `Pain reported in ${injuryCheckIn.sorenessPainLocation || "body"} with severity ${injuryCheckIn.sorenessPainSeverity}/10.`,
    };
  }

  // 2. LOW ADHERENCE check: Completed workouts / prescribed workouts < 60%
  const completedCount = currentWeekCheckIns.filter((c) => c.workoutCompleted).length;
  const adherence = prescribedWorkoutsCount > 0 ? completedCount / prescribedWorkoutsCount : 0;
  if (adherence < 0.60) {
    return {
      classification: "LOW_ADHERENCE",
      reason: `Adherence was only ${(adherence * 100).toFixed(0)}% (completed ${completedCount} of ${prescribedWorkoutsCount} workouts).`,
    };
  }

  // Extract max weights for the current week's completed exercises
  const currentWeekMaxWeights: Record<string, number> = {};
  for (const checkIn of currentWeekCheckIns) {
    if (checkIn.workoutCompleted && checkIn.workoutPerformanceJson) {
      try {
        const perf = JSON.parse(checkIn.workoutPerformanceJson);
        const completed = perf.completedExercises || [];
        for (const ex of completed) {
          const name = ex.name;
          const maxW = Math.max(
            ...(ex.sets || []).map((s: any) => s.weight || 0),
            0
          );
          if (maxW > 0) {
            currentWeekMaxWeights[name] = Math.max(
              currentWeekMaxWeights[name] || 0,
              maxW
            );
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }

  // 3. PLATEAU check: Adherence >= 80% AND max weights on all tracked exercises did not increase for 2 consecutive weeks.
  // We need at least 2 weeks of history to determine a plateau.
  const sortedHistory = [...history].sort((a, b) => b.weekNumber - a.weekNumber);

  if (adherence >= 0.80 && sortedHistory.length >= 2) {
    const latestHistoryWeek = sortedHistory[0]; // e.g. Week N-1
    const secondLatestHistoryWeek = sortedHistory[1]; // e.g. Week N-2

    let checkedExercisesCount = 0;
    let stalledExercisesCount = 0;

    for (const [exName, currentWeight] of Object.entries(currentWeekMaxWeights)) {
      const prevWeight = latestHistoryWeek.exercises.find(
        (e) => e.exerciseName === exName
      )?.maxWeight;
      const prevPrevWeight = secondLatestHistoryWeek.exercises.find(
        (e) => e.exerciseName === exName
      )?.maxWeight;

      if (prevWeight !== undefined && prevPrevWeight !== undefined) {
        checkedExercisesCount++;
        // Stalled means current <= prev week AND prev week <= week before (no progress for 2 weeks)
        if (currentWeight <= prevWeight && prevWeight <= prevPrevWeight) {
          stalledExercisesCount++;
        }
      }
    }

    if (checkedExercisesCount > 0 && stalledExercisesCount === checkedExercisesCount) {
      return {
        classification: "PLATEAU",
        reason: `Performance stalled for 2+ consecutive weeks on tracked exercises: ${Object.keys(currentWeekMaxWeights).join(", ")}.`,
      };
    }
  }

  // 4. BAD DAY check: Adherence >= 60%, energy levels were low (<= 4/10) in at least one check-in
  const lowEnergyCheckIn = currentWeekCheckIns.find(
    (c) =>
      c.workoutCompleted &&
      c.energyLevel !== undefined &&
      c.energyLevel !== null &&
      c.energyLevel <= 4
  );
  if (lowEnergyCheckIn) {
    return {
      classification: "BAD_DAY",
      reason: `Completed workouts successfully, but reported low energy (${lowEnergyCheckIn.energyLevel}/10) on some sessions.`,
    };
  }

  // 5. PROGRESSION check: Default successful progression
  return {
    classification: "PROGRESSION",
    reason: `Adherence was ${(adherence * 100).toFixed(0)}% with consistent performance and no reported pain.`,
  };
}
