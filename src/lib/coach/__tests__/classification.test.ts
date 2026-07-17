import { describe, it, expect } from "vitest";
import { classifyCheckIn, LiteCheckIn, WeeklyPerformanceHistory } from "../classification";

describe("classifyCheckIn deterministic coach logic", () => {
  it("should classify as INJURY if any check-in reports pain severity > 3", () => {
    const checkIns: LiteCheckIn[] = [
      { workoutCompleted: true, energyLevel: 8 },
      { workoutCompleted: true, energyLevel: 5, sorenessPainLocation: "Knee", sorenessPainSeverity: 5 },
      { workoutCompleted: false }
    ];
    const result = classifyCheckIn(checkIns, 3, []);
    expect(result.classification).toBe("INJURY");
    expect(result.reason).toContain("Pain reported in Knee");
  });

  it("should classify as LOW_ADHERENCE if completed workouts / prescribed count < 60%", () => {
    const checkIns: LiteCheckIn[] = [
      { workoutCompleted: true, energyLevel: 8 }, // 1 completed
      { workoutCompleted: false },
      { workoutCompleted: false }
    ];
    const result = classifyCheckIn(checkIns, 3, []);
    expect(result.classification).toBe("LOW_ADHERENCE");
    expect(result.reason).toContain("Adherence was only 33%");
  });

  it("should classify as PLATEAU if adherence is high and max weights did not increase for 2 weeks", () => {
    const checkIns: LiteCheckIn[] = [
      {
        workoutCompleted: true,
        workoutPerformanceJson: JSON.stringify({
          completedExercises: [{ name: "Bench Press", sets: [{ weight: 100, reps: 5 }] }]
        })
      },
      { workoutCompleted: true },
      { workoutCompleted: true }
    ];
    
    // History showing that Bench Press was 100 in previous week and 100 in the week before
    const history: WeeklyPerformanceHistory[] = [
      {
        weekNumber: 2,
        exercises: [{ exerciseName: "Bench Press", maxWeight: 100 }]
      },
      {
        weekNumber: 1,
        exercises: [{ exerciseName: "Bench Press", maxWeight: 100 }]
      }
    ];

    const result = classifyCheckIn(checkIns, 3, history);
    expect(result.classification).toBe("PLATEAU");
    expect(result.reason).toContain("stalled for 2+ consecutive weeks");
  });

  it("should classify as BAD_DAY if adherence is >= 60% but there was a low energy day", () => {
    const checkIns: LiteCheckIn[] = [
      {
        workoutCompleted: true,
        energyLevel: 3, // Low energy day
        workoutPerformanceJson: JSON.stringify({
          completedExercises: [{ name: "Bench Press", sets: [{ weight: 95, reps: 5 }] }]
        })
      },
      { workoutCompleted: true, energyLevel: 7 }
    ];

    // History showing that Bench Press was 100 in previous week (a small dip, but not stalled 2 weeks)
    const history: WeeklyPerformanceHistory[] = [
      {
        weekNumber: 1,
        exercises: [{ exerciseName: "Bench Press", maxWeight: 100 }]
      }
    ];

    const result = classifyCheckIn(checkIns, 2, history);
    expect(result.classification).toBe("BAD_DAY");
    expect(result.reason).toContain("reported low energy");
  });

  it("should classify as PROGRESSION by default for positive compliance and weights", () => {
    const checkIns: LiteCheckIn[] = [
      {
        workoutCompleted: true,
        energyLevel: 8,
        workoutPerformanceJson: JSON.stringify({
          completedExercises: [{ name: "Bench Press", sets: [{ weight: 105, reps: 5 }] }]
        })
      },
      { workoutCompleted: true, energyLevel: 9 }
    ];

    const history: WeeklyPerformanceHistory[] = [
      {
        weekNumber: 1,
        exercises: [{ exerciseName: "Bench Press", maxWeight: 100 }]
      }
    ];

    const result = classifyCheckIn(checkIns, 2, history);
    expect(result.classification).toBe("PROGRESSION");
    expect(result.reason).toContain("Adherence was 100%");
  });
});
