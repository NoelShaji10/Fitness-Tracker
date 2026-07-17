"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck, ShieldAlert, Award, RefreshCw } from "lucide-react";
import Link from "next/link";

// Helper to get today's date in local YYYY-MM-DD
const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function CheckInPage() {
  const router = useRouter();
  const [date, setDate] = useState(getTodayString());
  const [workoutCompleted, setWorkoutCompleted] = useState(true);

  // Pain / Soreness
  const [painLocation, setPainLocation] = useState("None");
  const [painSeverity, setPainSeverity] = useState(0);
  const [painDescription, setPainDescription] = useState("");

  // Nutrition
  const [protein, setProtein] = useState<number>(140);
  const [carbs, setCarbs] = useState<number>(260);
  const [fat, setFat] = useState<number>(70);
  const [calories, setCalories] = useState<number>(2230);

  // Vitals
  const [energyLevel, setEnergyLevel] = useState<number>(7);
  const [mood, setMood] = useState("Steady");
  const [sleepHours, setSleepHours] = useState<number>(7.5);

  // Status
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [injuryAlert, setInjuryAlert] = useState<{
    location: string;
    rationale: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Adaptation Demo State
  const [adapting, setAdapting] = useState(false);
  const [adaptationResult, setAdaptationResult] = useState<{
    classification: string;
    reason: string;
    rationale: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setInjuryAlert(null);
    setLoading(true);

    const mealsLoggedJson = JSON.stringify({
      protein: Number(protein),
      carbs: Number(carbs),
      fat: Number(fat),
      calories: Number(calories),
    });

    const checkInPayload = {
      date,
      workoutCompleted,
      workoutPerformanceJson: workoutCompleted
        ? JSON.stringify({
            completedExercises: [
              // Dummy completed exercise data representing target performance
              { name: "Barbell Bench Press", sets: [{ weight: 60, reps: 10 }, { reps: 9, weight: 60 }] },
              { name: "Pull-ups", sets: [{ weight: 0, reps: 8 }] },
              { name: "Barbell Squats", sets: [{ weight: 70, reps: 8 }] },
            ],
          })
        : null,
      mealsLoggedJson,
      sorenessPainLocation: painLocation === "None" ? null : painLocation,
      sorenessPainSeverity: painLocation === "None" ? 0 : Number(painSeverity),
      sorenessPainDescription: painLocation === "None" ? null : painDescription,
      energyLevel: Number(energyLevel),
      mood,
      sleepHours: Number(sleepHours),
    };

    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkInPayload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to submit check-in.");
      }

      const data = await res.json();
      setSuccessMsg("DAILY LOG SHEET COMMITTED TO LEDGER.");

      // Check if immediate injury modification was triggered
      if (data.injuryModified && data.updatedWorkoutPlan) {
        setInjuryAlert({
          location: data.checkIn.sorenessPainLocation,
          rationale: data.updatedWorkoutPlan.rationale,
        });
      }

      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const triggerAdaptation = async () => {
    setError(null);
    setAdaptationResult(null);
    setAdapting(true);

    try {
      const res = await fetch("/api/plan/adapt", {
        method: "POST",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Adaptation request failed.");
      }

      const data = await res.json();
      setAdaptationResult({
        classification: data.classification,
        reason: data.reason,
        rationale: data.workoutPlan.rationale || "",
      });
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to run weekly adaptation.");
    } finally {
      setAdapting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="border-b border-brand-ink/20 pb-4">
        <span className="font-sans text-[10px] uppercase tracking-widest text-brand-load font-bold">
          DAILY DIARY & WEEKLY LOOPS
        </span>
        <h1 className="font-sans text-2xl font-black tracking-tight text-brand-ink uppercase">
          DAILY LEDGER ENTRY
        </h1>
      </div>

      {error && (
        <div className="border border-brand-strain bg-brand-strain/10 p-3 text-xs font-sans text-brand-strain font-bold">
          [ERROR]: {error}
        </div>
      )}

      {successMsg && (
        <div className="border border-brand-gain bg-brand-gain/10 p-3 text-xs font-sans text-brand-gain font-bold">
          [SUCCESS]: {successMsg}
        </div>
      )}

      {/* Injury Triggered Warning Overlay */}
      {injuryAlert && (
        <div className="border border-brand-strain bg-brand-strain/10 p-6 space-y-3 text-brand-strain">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <h3 className="font-sans text-xs uppercase tracking-wider font-bold">
              [CRITICAL ALERT]: PHYSICAL INJURY MODIFICATION TRIGGERED
            </h3>
          </div>
          <p className="text-xs font-sans text-brand-ink/80 leading-relaxed">
            We detected a severe pain report for the <strong>{injuryAlert.location}</strong>. Your training plan has been immediately re-routed to avoid this joint and prevent further irritation.
          </p>
          <div className="border border-brand-strain/25 bg-brand-paper p-4 text-xs font-mono text-brand-ink/90 whitespace-pre-line leading-relaxed">
            {injuryAlert.rationale}
          </div>
          <div className="pt-2">
            <Link
              href="/dashboard/workout"
              className="inline-block border border-brand-strain bg-brand-strain hover:bg-brand-paper hover:text-brand-strain text-brand-paper px-4 py-2.5 font-sans text-xs font-bold uppercase tracking-widest transition-all duration-150 cursor-pointer"
            >
              VIEW MODIFIED WORKOUT
            </Link>
          </div>
        </div>
      )}

      {/* Adaptation Modal Result */}
      {adaptationResult && (
        <div className="border border-brand-gain bg-brand-gain/10 p-6 space-y-3 text-brand-gain">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 shrink-0" />
            <h3 className="font-sans text-xs uppercase tracking-wider font-bold">
              [LOOP RUN]: WEEKLY ADAPTATION COMPLETE
            </h3>
          </div>
          <p className="text-xs font-sans text-brand-ink/80 leading-relaxed">
            Classifier outcome: <strong>{adaptationResult.classification}</strong> (Reason: {adaptationResult.reason})
          </p>
          <div className="border border-brand-gain/25 bg-brand-paper p-4 text-xs font-mono text-brand-ink/90 whitespace-pre-line leading-relaxed">
            {adaptationResult.rationale}
          </div>
          <div className="pt-2">
            <Link
              href="/dashboard/workout"
              className="inline-block border border-brand-gain bg-brand-gain text-brand-paper px-4 py-2.5 font-sans text-xs font-bold uppercase tracking-widest hover:bg-brand-paper hover:text-brand-gain transition-all duration-150 cursor-pointer"
            >
              VIEW NEXT WEEK PLAN
            </Link>
          </div>
        </div>
      )}

      {/* Entry Forms Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 border border-brand-ink/15 bg-brand-paper p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block font-sans text-[10px] font-bold uppercase tracking-wider text-brand-ink/75 mb-2">
                  LOG DATE
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-brand-ink/20 bg-brand-paper-dark px-4 py-2.5 font-mono text-sm text-brand-ink focus:outline-none focus:border-brand-load focus:ring-1 focus:ring-brand-load transition-all rounded-none"
                />
              </div>

              <div>
                <label className="block font-sans text-[10px] font-bold uppercase tracking-wider text-brand-ink/75 mb-2">
                  WORKOUT STATUS
                </label>
                <button
                  type="button"
                  onClick={() => setWorkoutCompleted(!workoutCompleted)}
                  className={`w-full border py-2.5 font-sans text-xs font-bold transition-all duration-150 cursor-pointer ${
                    workoutCompleted
                      ? "bg-brand-load border-brand-load text-white"
                      : "border-brand-ink/20 text-brand-ink/80 bg-brand-paper-dark hover:bg-brand-paper hover:border-brand-ink"
                  }`}
                >
                  {workoutCompleted ? "WORKOUT COMPLETED // YES" : "WORKOUT SKIPPED // NO"}
                </button>
              </div>
            </div>

            {/* Pain / Soreness Block */}
            <div className="border-t border-brand-ink/10 pt-5 space-y-4">
              <h3 className="font-sans text-xs uppercase font-bold text-brand-load">
                // PHYSICAL PAIN & SORENESS MONITOR
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block font-sans text-[10px] font-bold uppercase tracking-wider text-brand-ink/75 mb-2">
                    PAIN / STRAIN LOCATION
                  </label>
                  <select
                    value={painLocation}
                    onChange={(e) => setPainLocation(e.target.value)}
                    className="w-full border border-brand-ink/20 bg-brand-paper-dark px-4 py-2.5 font-sans text-sm text-brand-ink focus:outline-none focus:border-brand-load transition-all rounded-none cursor-pointer"
                  >
                    <option value="None">NONE (NORMAL SORENESS OR LESS)</option>
                    <option value="Left Knee">LEFT KNEE</option>
                    <option value="Right Knee">RIGHT KNEE</option>
                    <option value="Lower Back">LOWER BACK</option>
                    <option value="Right Shoulder">RIGHT SHOULDER</option>
                    <option value="Left Shoulder">LEFT SHOULDER</option>
                    <option value="Elbows">ELBOW / ARM JOINTS</option>
                  </select>
                </div>

                <div>
                  <label className="block font-sans text-[10px] font-bold uppercase tracking-wider text-brand-ink/75 mb-2">
                    SEVERITY INDEX (0-10)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={painSeverity}
                    disabled={painLocation === "None"}
                    onChange={(e) => setPainSeverity(Number(e.target.value))}
                    className="w-full h-2 bg-brand-paper-dark border border-brand-ink/10 rounded-lg appearance-none cursor-pointer accent-brand-strain"
                  />
                  <div className="flex justify-between text-[10px] font-sans text-brand-ink/65 mt-2">
                    <span>0 = COMFORTABLE</span>
                    <span className="font-mono font-bold text-brand-strain">{painSeverity}/10</span>
                    <span>10 = SEVERE PAIN</span>
                  </div>
                </div>
              </div>

              {painLocation !== "None" && (
                <div>
                  <label className="block font-sans text-[10px] font-bold uppercase tracking-wider text-brand-ink/75 mb-2">
                    PAIN PROGRESSION DESCRIPTION
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={painDescription}
                    onChange={(e) => setPainDescription(e.target.value)}
                    placeholder="Describe the nature of the discomfort (e.g. sharp pinch on eccentric squat, dull ache while pushing)..."
                    className="w-full border border-brand-ink/20 bg-brand-paper-dark px-4 py-2.5 font-sans text-sm text-brand-ink placeholder-brand-ink/40 focus:outline-none focus:border-brand-load transition-all rounded-none"
                  />
                </div>
              )}
            </div>

            {/* Daily Nutrition */}
            <div className="border-t border-brand-ink/10 pt-5 space-y-4">
              <h3 className="font-sans text-xs uppercase font-bold text-brand-load">
                // NUTRITION & ENERGY LOGS
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block font-sans text-[9px] font-bold uppercase tracking-wider text-brand-ink/70 mb-2">
                    PROTEIN (G)
                  </label>
                  <input
                    type="number"
                    required
                    value={protein}
                    onChange={(e) => setProtein(Number(e.target.value))}
                    className="w-full border border-brand-ink/20 bg-brand-paper-dark px-3 py-2 font-mono text-xs text-brand-ink focus:outline-none focus:border-brand-load rounded-none"
                  />
                </div>

                <div>
                  <label className="block font-sans text-[9px] font-bold uppercase tracking-wider text-brand-ink/70 mb-2">
                    CARBS (G)
                  </label>
                  <input
                    type="number"
                    required
                    value={carbs}
                    onChange={(e) => setCarbs(Number(e.target.value))}
                    className="w-full border border-brand-ink/20 bg-brand-paper-dark px-3 py-2 font-mono text-xs text-brand-ink focus:outline-none focus:border-brand-load rounded-none"
                  />
                </div>

                <div>
                  <label className="block font-sans text-[9px] font-bold uppercase tracking-wider text-brand-ink/70 mb-2">
                    FAT (G)
                  </label>
                  <input
                    type="number"
                    required
                    value={fat}
                    onChange={(e) => setFat(Number(e.target.value))}
                    className="w-full border border-brand-ink/20 bg-brand-paper-dark px-3 py-2 font-mono text-xs text-brand-ink focus:outline-none focus:border-brand-load rounded-none"
                  />
                </div>

                <div>
                  <label className="block font-sans text-[9px] font-bold uppercase tracking-wider text-brand-ink/70 mb-2">
                    CALORIES (KCAL)
                  </label>
                  <input
                    type="number"
                    required
                    value={calories}
                    onChange={(e) => setCalories(Number(e.target.value))}
                    className="w-full border border-brand-ink/20 bg-brand-paper-dark px-3 py-2 font-mono text-xs text-brand-ink focus:outline-none focus:border-brand-load rounded-none"
                  />
                </div>
              </div>
            </div>

            {/* Daily Vitals */}
            <div className="border-t border-brand-ink/10 pt-5 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block font-sans text-[10px] font-bold uppercase tracking-wider text-brand-ink/75 mb-2">
                  ENERGY INDEX (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  required
                  value={energyLevel}
                  onChange={(e) => setEnergyLevel(Number(e.target.value))}
                  className="w-full border border-brand-ink/20 bg-brand-paper-dark px-4 py-2.5 font-mono text-sm text-brand-ink focus:outline-none focus:border-brand-load rounded-none"
                />
              </div>

              <div>
                <label className="block font-sans text-[10px] font-bold uppercase tracking-wider text-brand-ink/75 mb-2">
                  PREVAILING MOOD
                </label>
                <select
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  className="w-full border border-brand-ink/20 bg-brand-paper-dark px-4 py-2.5 font-sans text-sm text-brand-ink focus:outline-none focus:border-brand-load transition-all rounded-none cursor-pointer"
                >
                  <option value="Steady">STEADY</option>
                  <option value="Good">GOOD</option>
                  <option value="Tired">TIRED</option>
                  <option value="Stressed">STRESSED</option>
                </select>
              </div>

              <div>
                <label className="block font-sans text-[10px] font-bold uppercase tracking-wider text-brand-ink/75 mb-2">
                  SLEEP QUALITY (HOURS)
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={sleepHours}
                  onChange={(e) => setSleepHours(Number(e.target.value))}
                  className="w-full border border-brand-ink/20 bg-brand-paper-dark px-4 py-2.5 font-mono text-sm text-brand-ink focus:outline-none focus:border-brand-load rounded-none"
                />
              </div>
            </div>

            <div className="border-t border-brand-ink/10 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full border border-brand-ink bg-brand-ink py-3 font-sans text-xs font-bold uppercase tracking-widest text-brand-paper hover:bg-brand-load hover:text-white hover:border-brand-load disabled:opacity-50 transition-all duration-150 cursor-pointer shadow-sm"
              >
                {loading ? "COMMITTING TO LEDGER..." : "LOG DAILY ENTRIES"}
              </button>
            </div>
          </form>
        </div>

        {/* Weekly adaptation loop panel */}
        <div className="space-y-6">
          <div className="border border-brand-ink/15 bg-brand-paper p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <RefreshCw className={`h-4 w-4 text-brand-load ${adapting ? "animate-spin" : ""}`} />
              <h3 className="font-sans text-xs uppercase tracking-wider font-bold text-brand-ink">
                WEEKLY ADAPTIVE LOOP
              </h3>
            </div>
            <p className="text-xs font-sans text-brand-ink/75 leading-relaxed">
              At the end of each training cycle (Week), the coach evaluates all logged entries to determine if plan changes are needed.
            </p>
            <p className="text-xs font-sans text-brand-ink/70 leading-relaxed border-l-2 border-brand-load/40 pl-3">
              <strong>Demo Instructions:</strong> Submit check-ins demonstrating a scenario (e.g. low-adherence or reported pain), then click below to trigger the weekly adaptation run manually.
            </p>
            <div className="pt-2">
              <button
                onClick={triggerAdaptation}
                disabled={adapting}
                className="w-full border border-brand-ink bg-brand-ink text-brand-paper py-2.5 font-sans text-xs font-bold uppercase tracking-wider hover:bg-brand-load hover:text-white hover:border-brand-load transition-all duration-150 cursor-pointer shadow-sm"
              >
                {adapting ? "EVALUATING LOGS..." : "RUN WEEKLY ADAPTATION"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
