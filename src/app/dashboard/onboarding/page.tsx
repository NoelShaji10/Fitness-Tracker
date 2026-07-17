"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STEPS = [
  "01 // PHYSICAL METRICS",
  "02 // GOALS & LEVEL",
  "03 // SCHEDULE & EQUIPMENT",
  "04 // DIET & INJURIES",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [age, setAge] = useState<number>(28);
  const [gender, setGender] = useState("Male");
  const [weight, setWeight] = useState<number>(75);
  const [height, setHeight] = useState<number>(180);
  const [activityLevel, setActivityLevel] = useState("Moderate");

  const [goal, setGoal] = useState("Build Muscle");
  const [fitnessLevel, setFitnessLevel] = useState("Intermediate");

  const [equipment, setEquipment] = useState("Barbell, Dumbbells, Bench");
  const [schedule, setSchedule] = useState<string[]>(["MON", "WED", "FRI"]);

  const [diet, setDiet] = useState("None");
  const [injuries, setInjuries] = useState("None");

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleScheduleChange = (day: string) => {
    if (schedule.includes(day)) {
      setSchedule(schedule.filter((d) => d !== day));
    } else {
      setSchedule([...schedule, day]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setLoadingMessage("SAVING LEDGER PROFILE...");

    try {
      // 1. Save profile
      const profileRes = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal,
          fitnessLevel,
          dietaryRestrictions: diet,
          injuryHistory: injuries,
          availableEquipment: equipment,
          weeklySchedule: schedule,
          weight: Number(weight),
          height: Number(height),
          age: Number(age),
          gender,
          activityLevel,
        }),
      });

      if (!profileRes.ok) {
        const errData = await profileRes.json();
        throw new Error(errData.error || "Failed to save profile.");
      }

      // 2. Generate initial plan
      setLoadingMessage("COMPILING AI WORKOUT & NUTRITION LEDGER (GEMINI API)...");
      const planRes = await fetch("/api/plan/generate", {
        method: "POST",
      });

      if (!planRes.ok) {
        const errData = await planRes.json();
        throw new Error(errData.error || "Failed to generate initial plan.");
      }

      setLoadingMessage("SYNCING PLANS TO LOCAL DATABASE...");
      setTimeout(() => {
        router.refresh();
        router.push("/dashboard/workout");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-brand-paper-dark p-6 dark:bg-brand-paper-dark">
      {/* Header */}
      <header className="mb-8 border-b border-brand-ink/15 pb-4 flex justify-between items-center max-w-2xl mx-auto w-full">
        <div>
          <span className="font-sans text-[10px] uppercase tracking-widest text-brand-load font-bold">
            AURACOACH V2.0 // ONBOARDING
          </span>
          <h1 className="font-sans text-2xl font-black tracking-tight text-brand-ink uppercase">
            INITIAL SETUP LEDGER
          </h1>
        </div>
        <div className="font-mono text-xs border border-brand-ink/20 px-3 py-1.5 bg-brand-paper text-brand-ink font-bold shadow-sm">
          STEP {currentStep + 1} / 4
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-2xl mx-auto w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 border border-brand-load bg-brand-paper p-8 shadow-sm">
            {/* Minimal Stepped Stack Loading Animation */}
            <div className="flex gap-1.5 mb-6">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-4 h-12 border border-brand-load bg-brand-load/75 animate-pulse"
                  style={{ animationDelay: `${i * 150}ms` }}
                ></div>
              ))}
            </div>
            <p className="font-sans text-xs text-brand-load font-bold animate-pulse uppercase tracking-wider">
              [SYSTEM] {loadingMessage}
            </p>
          </div>
        ) : (
          <div className="border border-brand-ink/15 bg-brand-paper p-8 shadow-sm">
            {/* Step Indicators */}
            <div className="mb-8 grid grid-cols-4 gap-2">
              {STEPS.map((step, idx) => (
                <div key={idx} className="space-y-2">
                  <div
                    className={`h-1.5 border transition-colors duration-200 ${
                      idx <= currentStep
                        ? "bg-brand-load border-brand-load"
                        : "bg-transparent border-brand-ink/10"
                    }`}
                  ></div>
                  <span className="hidden sm:block font-sans text-[8px] uppercase font-bold text-brand-ink/50 leading-none tracking-wider">
                    {step}
                  </span>
                </div>
              ))}
            </div>

            {error && (
              <div className="mb-6 border border-brand-strain bg-brand-strain/10 p-3 text-xs font-sans text-brand-strain font-bold">
                [ERROR]: {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* STEP 1: PHYSICAL METRICS */}
              {currentStep === 0 && (
                <div className="space-y-6">
                  <h2 className="font-sans text-xs uppercase tracking-wider border-b border-brand-ink/10 pb-2 text-brand-ink font-bold">
                    01 // PHYSICAL CONSTRAINTS & METRICS
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block font-sans text-[10px] font-bold uppercase tracking-wider text-brand-ink/80 mb-2">
                        AGE (YEARS)
                      </label>
                      <input
                        type="number"
                        required
                        value={age}
                        onChange={(e) => setAge(Number(e.target.value))}
                        className="w-full border border-brand-ink/20 bg-brand-paper-dark px-4 py-2.5 font-mono text-sm text-brand-ink focus:outline-none focus:border-brand-load focus:ring-1 focus:ring-brand-load transition-all rounded-none"
                      />
                    </div>

                    <div>
                      <label className="block font-sans text-[10px] font-bold uppercase tracking-wider text-brand-ink/80 mb-2">
                        GENDER BIOLOGY
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full border border-brand-ink/20 bg-brand-paper-dark px-4 py-2.5 font-sans text-sm text-brand-ink focus:outline-none focus:border-brand-load transition-all rounded-none cursor-pointer"
                      >
                        <option value="Male">MALE</option>
                        <option value="Female">FEMALE</option>
                        <option value="Other">OTHER</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-sans text-[10px] font-bold uppercase tracking-wider text-brand-ink/80 mb-2">
                        CURRENT WEIGHT (KG)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={weight}
                        onChange={(e) => setWeight(Number(e.target.value))}
                        className="w-full border border-brand-ink/20 bg-brand-paper-dark px-4 py-2.5 font-mono text-sm text-brand-ink focus:outline-none focus:border-brand-load focus:ring-1 focus:ring-brand-load transition-all rounded-none"
                      />
                    </div>

                    <div>
                      <label className="block font-sans text-[10px] font-bold uppercase tracking-wider text-brand-ink/80 mb-2">
                        HEIGHT (CM)
                      </label>
                      <input
                        type="number"
                        required
                        value={height}
                        onChange={(e) => setHeight(Number(e.target.value))}
                        className="w-full border border-brand-ink/20 bg-brand-paper-dark px-4 py-2.5 font-mono text-sm text-brand-ink focus:outline-none focus:border-brand-load focus:ring-1 focus:ring-brand-load transition-all rounded-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-sans text-[10px] font-bold uppercase tracking-wider text-brand-ink/80 mb-2">
                      DAILY ACTIVITY COEFFICIENT
                    </label>
                    <select
                      value={activityLevel}
                      onChange={(e) => setActivityLevel(e.target.value)}
                      className="w-full border border-brand-ink/20 bg-brand-paper-dark px-4 py-2.5 font-sans text-sm text-brand-ink focus:outline-none focus:border-brand-load transition-all rounded-none cursor-pointer"
                    >
                      <option value="Sedentary">SEDENTARY (DESK JOB, NO EXERCISE)</option>
                      <option value="Light">LIGHT (1-3 DAYS LIGHT EXERCISE/WEEK)</option>
                      <option value="Moderate">MODERATE (3-5 DAYS ACTIVE EXERCISE/WEEK)</option>
                      <option value="Active">ACTIVE (6-7 DAYS HEAVY TRAINING/WEEK)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* STEP 2: GOALS & EXPERIENCES */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="font-sans text-xs uppercase tracking-wider border-b border-brand-ink/10 pb-2 text-brand-ink font-bold">
                    02 // TARGET GOALS & EXPERIENCE PROFILE
                  </h2>

                  <div>
                    <label className="block font-sans text-[10px] font-bold uppercase tracking-wider text-brand-ink/80 mb-2">
                      PRIMARY FITNESS PATH
                    </label>
                    <select
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      className="w-full border border-brand-ink/20 bg-brand-paper-dark px-4 py-2.5 font-sans text-sm text-brand-ink focus:outline-none focus:border-brand-load transition-all rounded-none cursor-pointer"
                    >
                      <option value="Build Muscle">BUILD MUSCLE (LEAN SURPLUS)</option>
                      <option value="Fat Loss">FAT LOSS (CALORIC DEFICIT)</option>
                      <option value="Athletic Performance">ATHLETIC CONDITIONING</option>
                      <option value="General Health">GENERAL WELLNESS & FITNESS</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-sans text-[10px] font-bold uppercase tracking-wider text-brand-ink/80 mb-2">
                      TRAINING EXPERIENCE CLASS
                    </label>
                    <select
                      value={fitnessLevel}
                      onChange={(e) => setFitnessLevel(e.target.value)}
                      className="w-full border border-brand-ink/20 bg-brand-paper-dark px-4 py-2.5 font-sans text-sm text-brand-ink focus:outline-none focus:border-brand-load transition-all rounded-none cursor-pointer"
                    >
                      <option value="Beginner">BEGINNER (0-1 YEARS STRUCTURED LIFTING)</option>
                      <option value="Intermediate">INTERMEDIATE (1-3 YEARS LIFTING)</option>
                      <option value="Advanced">ADVANCED (3+ YEARS HEAVY COMPOUND LIFTING)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* STEP 3: SCHEDULE & EQUIPMENT */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="font-sans text-xs uppercase tracking-wider border-b border-brand-ink/10 pb-2 text-brand-ink font-bold">
                    03 // AVAILABILITIES & EQUIPMENT LEDGER
                  </h2>

                  <div>
                    <label className="block font-sans text-[10px] font-bold uppercase tracking-wider text-brand-ink/80 mb-2">
                      AVAILABLE EQUIPMENT INVENTORY
                    </label>
                    <input
                      type="text"
                      required
                      value={equipment}
                      onChange={(e) => setEquipment(e.target.value)}
                      className="w-full border border-brand-ink/20 bg-brand-paper-dark px-4 py-2.5 font-sans text-sm text-brand-ink focus:outline-none focus:border-brand-load transition-all rounded-none"
                      placeholder="e.g. Barbell, Dumbbells, Bench, Pull-up Bar"
                    />
                    <p className="mt-1.5 text-xs text-brand-ink/65 font-sans">
                      Separate items with commas. We only prescribe movements fitting this inventory.
                    </p>
                  </div>

                  <div>
                    <label className="block font-sans text-[10px] font-bold uppercase tracking-wider text-brand-ink/80 mb-4">
                      WEEKLY WORKOUT SCHEDULE CONSTRAINTS (CHOOSE DAYS)
                    </label>
                    <div className="grid grid-cols-7 gap-2">
                      {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => {
                        const active = schedule.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => handleScheduleChange(day)}
                            className={`border py-2.5 font-sans text-xs font-bold transition-all duration-150 cursor-pointer ${
                              active
                                ? "bg-brand-load border-brand-load text-white"
                                : "border-brand-ink/20 text-brand-ink/80 bg-brand-paper-dark hover:bg-brand-paper hover:border-brand-ink"
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: DIET & INJURY HISTORY */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="font-sans text-xs uppercase tracking-wider border-b border-brand-ink/10 pb-2 text-brand-ink font-bold">
                    04 // DIET PREFERENCES & MEDICAL HISTORY
                  </h2>

                  <div>
                    <label className="block font-sans text-[10px] font-bold uppercase tracking-wider text-brand-ink/80 mb-2">
                      DIETARY PREFERENCES / RESTRICTIONS
                    </label>
                    <input
                      type="text"
                      required
                      value={diet}
                      onChange={(e) => setDiet(e.target.value)}
                      className="w-full border border-brand-ink/20 bg-brand-paper-dark px-4 py-2.5 font-sans text-sm text-brand-ink focus:outline-none focus:border-brand-load transition-all rounded-none"
                      placeholder="e.g. Vegetarian, Gluten-Free, Dairy-Free, or None"
                    />
                  </div>

                  <div>
                    <label className="block font-sans text-[10px] font-bold uppercase tracking-wider text-brand-ink/80 mb-2">
                      INJURIES / PHYSICAL PAIN CONSTRAINTS
                    </label>
                    <input
                      type="text"
                      required
                      value={injuries}
                      onChange={(e) => setInjuries(e.target.value)}
                      className="w-full border border-brand-ink/20 bg-brand-paper-dark px-4 py-2.5 font-sans text-sm text-brand-ink focus:outline-none focus:border-brand-load transition-all rounded-none"
                      placeholder="e.g. Lower back pain occasionally, or None"
                    />
                    <p className="mt-1.5 text-xs text-brand-ink/65 font-sans">
                      AuraCoach will avoid exercises that trigger pain in these areas.
                    </p>
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="flex justify-between pt-6 border-t border-brand-ink/10">
                {currentStep > 0 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="border border-brand-ink/20 px-6 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-brand-ink/80 bg-brand-paper-dark hover:bg-brand-paper hover:text-brand-ink hover:border-brand-ink transition-all duration-150 cursor-pointer"
                  >
                    BACK
                  </button>
                ) : (
                  <div></div>
                )}

                {currentStep < STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="border border-brand-ink bg-brand-ink px-6 py-2.5 font-sans text-xs font-bold uppercase tracking-widest text-brand-paper hover:bg-brand-load hover:border-brand-load transition-all duration-150 cursor-pointer shadow-sm"
                  >
                    CONTINUE
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="border border-brand-ink bg-brand-ink px-6 py-2.5 font-sans text-xs font-bold uppercase tracking-widest text-brand-paper hover:bg-brand-load hover:border-brand-load transition-all duration-150 font-black cursor-pointer shadow-sm animate-pulse"
                  >
                    GENERATE SYSTEM PLAN
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
