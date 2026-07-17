import Link from "next/link";
import { Dumbbell, ShieldAlert, Utensils, TrendingUp } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-paper px-6 py-12 dark:bg-brand-paper">
      <div className="w-full max-w-4xl border-2 border-brand-ink bg-brand-paper p-8 sm:p-12 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] dark:border-brand-ink dark:bg-brand-paper-dark dark:shadow-[6px_6px_0px_0px_rgba(234,234,234,0.15)] space-y-8">
        
        {/* Title */}
        <div className="text-center sm:text-left space-y-2">
          <span className="font-mono text-xs uppercase tracking-widest text-brand-load font-bold">
            HEALTH & WELLNESS SYSTEM // V2.0
          </span>
          <h1 className="font-mono text-4xl sm:text-5xl font-bold tracking-tight text-brand-ink">
            AURA//COACH
          </h1>
          <p className="text-sm sm:text-base text-brand-ink/75 font-sans">
            Adaptive Personal Training & Sports Nutrition Logbook.
          </p>
        </div>

        <div className="border-t border-brand-ink/20 my-6"></div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="border border-brand-ink/15 p-5 bg-brand-paper-dark/30 hover:bg-brand-paper-dark/60 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell className="h-4 w-4 text-brand-load" />
              <h3 className="font-mono text-xs uppercase font-bold text-brand-ink">
                01 // ADAPTIVE LIFTING
              </h3>
            </div>
            <p className="text-xs text-brand-ink/75 font-sans leading-relaxed">
              NSCA-certified exercise scheduling. Adapts weekly based on performance stalls, consistency trends, or local load fatigue.
            </p>
          </div>

          <div className="border border-brand-ink/15 p-5 bg-brand-paper-dark/30 hover:bg-brand-paper-dark/60 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Utensils className="h-4 w-4 text-brand-load" />
              <h3 className="font-mono text-xs uppercase font-bold text-brand-ink">
                02 // MACRO DIETARY PLANS
              </h3>
            </div>
            <p className="text-xs text-brand-ink/75 font-sans leading-relaxed">
              Mifflin-St Jeor metabolic tracking. Provides daily meal guides and organized grocery shopping check-sheets.
            </p>
          </div>

          <div className="border border-brand-ink/15 p-5 bg-brand-paper-dark/30 hover:bg-brand-paper-dark/60 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="h-4 w-4 text-brand-strain" />
              <h3 className="font-mono text-xs uppercase font-bold text-brand-ink">
                03 // INJURY RE-PLANS
              </h3>
            </div>
            <p className="text-xs text-brand-ink/75 font-sans leading-relaxed">
              Immediate biomechanical unloading. Any check-in reporting joint pain immediately modifies the workout to route around injuries.
            </p>
          </div>

          <div className="border border-brand-ink/15 p-5 bg-brand-paper-dark/30 hover:bg-brand-paper-dark/60 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-brand-load" />
              <h3 className="font-mono text-xs uppercase font-bold text-brand-ink">
                04 // METRICS TIMELINE
              </h3>
            </div>
            <p className="text-xs text-brand-ink/75 font-sans leading-relaxed">
              Logbook ledger curves. View consistency streaks, macro compliance trends, and a 12-week bodyweight projection.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center sm:justify-start">
          <Link
            href="/dashboard"
            className="border-2 border-brand-ink bg-brand-ink text-brand-paper text-center py-3 px-8 font-mono text-xs uppercase tracking-widest hover:bg-brand-load hover:border-brand-load hover:text-brand-paper transition-all font-bold"
          >
            ENTER ATHLETIC LEDGER
          </Link>
          <Link
            href="/login"
            className="border-2 border-brand-ink bg-transparent text-brand-ink text-center py-3 px-8 font-mono text-xs uppercase tracking-widest hover:bg-brand-paper-dark transition-all font-bold"
          >
            SIGN IN
          </Link>
        </div>
      </div>
    </div>
  );
}
