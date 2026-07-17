"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, RefreshCw, Save } from "lucide-react";

interface SettingsFormProps {
  initialProfile: {
    goal: string;
    fitnessLevel: string;
    dietaryRestrictions: string;
    injuryHistory: string;
    availableEquipment: string;
    weeklySchedule: string; // JSON string
    weight: number | null;
    height: number | null;
    age: number | null;
    gender: string | null;
    activityLevel: string | null;
  };
}

export default function SettingsForm({ initialProfile }: SettingsFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states loaded with initial profile
  const [age, setAge] = useState<number>(initialProfile.age || 28);
  const [gender, setGender] = useState(initialProfile.gender || "Male");
  const [weight, setWeight] = useState<number>(initialProfile.weight || 75);
  const [height, setHeight] = useState<number>(initialProfile.height || 180);
  const [activityLevel, setActivityLevel] = useState(initialProfile.activityLevel || "Moderate");
  const [goal, setGoal] = useState(initialProfile.goal || "Build Muscle");
  const [fitnessLevel, setFitnessLevel] = useState(initialProfile.fitnessLevel || "Intermediate");
  const [equipment, setEquipment] = useState(initialProfile.availableEquipment || "");
  const [diet, setDiet] = useState(initialProfile.dietaryRestrictions || "None");
  const [injuries, setInjuries] = useState(initialProfile.injuryHistory || "None");

  let parsedSchedule: string[] = ["MON", "WED", "FRI"];
  try {
    parsedSchedule = JSON.parse(initialProfile.weeklySchedule);
  } catch (e) {}
  
  const [schedule, setSchedule] = useState<string[]>(parsedSchedule);

  const handleScheduleChange = (day: string) => {
    if (schedule.includes(day)) {
      setSchedule(schedule.filter((d) => d !== day));
    } else {
      setSchedule([...schedule, day]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/profile", {
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

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update profile.");
      }

      setSuccess("LEDGER PROFILE SYSTEM UPDATED SUCCESSFULLY.");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegeneratePlans = async () => {
    if (!confirm("Are you sure you want to regenerate your workout and meal plans? This will archive your current plans and build new ones with the AI coach using your updated settings.")) {
      return;
    }

    setRegenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/plan/generate", {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to regenerate plans.");
      }

      setSuccess("NEW AI WORKOUT & NUTRITION LEDGERS REGENERATED.");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Plan regeneration failed.");
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="border border-brand-strain bg-brand-strain/10 p-3 text-xs font-sans text-brand-strain font-bold">
          [ERROR]: {error}
        </div>
      )}

      {success && (
        <div className="border border-brand-gain bg-brand-gain/10 p-3 text-xs font-sans text-brand-gain font-bold">
          [SUCCESS]: {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form panel */}
        <div className="lg:col-span-2 border border-brand-ink/15 bg-brand-paper p-8 shadow-sm">
          <form onSubmit={handleSave} className="space-y-6">
            <h3 className="font-sans text-xs uppercase font-bold text-brand-load border-b border-brand-ink/10 pb-2">
              {"// PHYSICAL & BIOMETRIC METRICS"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block font-sans text-[10px] font-bold uppercase tracking-wider text-brand-ink/75 mb-2">
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
                <label className="block font-sans text-[10px] font-bold uppercase tracking-wider text-brand-ink/75 mb-2">
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
                <label className="block font-sans text-[10px] font-bold uppercase tracking-wider text-brand-ink/75 mb-2">
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
                <label className="block font-sans text-[10px] font-bold uppercase tracking-wider text-brand-ink/75 mb-2">
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
              <label className="block font-sans text-[10px] font-bold uppercase tracking-wider text-brand-ink/75 mb-2">
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

            <h3 className="font-sans text-xs uppercase font-bold text-brand-load border-b border-brand-ink/10 pb-2 pt-4">
              {"// TRAINING PARAMETERS & RESTRICTIONS"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block font-sans text-[10px] font-bold uppercase tracking-wider text-brand-ink/75 mb-2">
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
                <label className="block font-sans text-[10px] font-bold uppercase tracking-wider text-brand-ink/75 mb-2">
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

            <div>
              <label className="block font-sans text-[10px] font-bold uppercase tracking-wider text-brand-ink/75 mb-2">
                AVAILABLE EQUIPMENT INVENTORY
              </label>
              <input
                type="text"
                required
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                className="w-full border border-brand-ink/20 bg-brand-paper-dark px-4 py-2.5 font-sans text-sm text-brand-ink focus:outline-none focus:border-brand-load transition-all rounded-none"
              />
            </div>

            <div>
              <label className="block font-sans text-[10px] font-bold uppercase tracking-wider text-brand-ink/75 mb-4">
                WEEKLY WORKOUT SCHEDULE DAYS
              </label>
              <div className="grid grid-cols-7 gap-2">
                {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => {
                  const active = schedule.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleScheduleChange(day)}
                      className={`border py-2 font-sans text-xs font-bold transition-all duration-150 cursor-pointer ${
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block font-sans text-[10px] font-bold uppercase tracking-wider text-brand-ink/75 mb-2">
                  DIETARY RESTRICTIONS
                </label>
                <input
                  type="text"
                  required
                  value={diet}
                  onChange={(e) => setDiet(e.target.value)}
                  className="w-full border border-brand-ink/20 bg-brand-paper-dark px-4 py-2.5 font-sans text-sm text-brand-ink focus:outline-none focus:border-brand-load transition-all rounded-none"
                />
              </div>

              <div>
                <label className="block font-sans text-[10px] font-bold uppercase tracking-wider text-brand-ink/75 mb-2">
                  INJURIES / PAIN HISTORY
                </label>
                <input
                  type="text"
                  required
                  value={injuries}
                  onChange={(e) => setInjuries(e.target.value)}
                  className="w-full border border-brand-ink/20 bg-brand-paper-dark px-4 py-2.5 font-sans text-sm text-brand-ink focus:outline-none focus:border-brand-load transition-all rounded-none"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-brand-ink/10">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 border border-brand-ink bg-brand-ink py-3 font-sans text-xs font-bold uppercase tracking-widest text-brand-paper hover:bg-brand-load hover:text-white hover:border-brand-load disabled:opacity-50 transition-all duration-150 cursor-pointer shadow-sm"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{loading ? "SAVING CHANGES..." : "SAVE PROFILE CHANGES"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Action Sidebar Panel */}
        <div className="space-y-6">
          <div className="border border-brand-ink/15 bg-brand-paper p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <RefreshCw className={`h-4 w-4 text-brand-load ${regenerating ? "animate-spin" : ""}`} />
              <h3 className="font-sans text-xs uppercase tracking-wider font-bold text-brand-ink">
                PROGRAM REGENERATION
              </h3>
            </div>
            <p className="text-xs font-sans text-brand-ink/75 leading-relaxed">
              If you have significantly modified your goals, equipment, or injuries, you can tell the AI coach to regenerate your active workout and meal plans from scratch.
            </p>
            <p className="text-xs font-sans text-brand-strain font-bold leading-relaxed border-l-2 border-brand-strain/45 pl-3">
              WARNING: This will replace your active Week sheets. This action is irreversible.
            </p>
            <div className="pt-2">
              <button
                onClick={handleRegeneratePlans}
                disabled={regenerating}
                className="w-full border border-brand-strain bg-transparent hover:bg-brand-strain hover:text-white text-brand-strain py-2.5 font-sans text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer shadow-sm"
              >
                {regenerating ? "COMPILING SYSTEM PLANS..." : "REGENERATE PLANS"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
