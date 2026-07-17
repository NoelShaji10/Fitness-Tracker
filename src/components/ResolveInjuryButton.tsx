"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";

export default function ResolveInjuryButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResolve = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/injury/resolve", {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to resolve injury plan.");
      }

      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      {error && (
        <p className="text-xs font-mono text-brand-strain mb-2">
          [ERR]: {error}
        </p>
      )}
      <button
        onClick={handleResolve}
        disabled={loading}
        className="inline-flex items-center gap-2 border border-brand-strain bg-brand-strain hover:bg-brand-paper hover:text-brand-strain text-brand-paper px-4 py-2 font-mono text-xs uppercase tracking-widest transition-all disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>TAPER PREPARATION...</span>
          </>
        ) : (
          <>
            <CheckCircle className="h-3.5 w-3.5" />
            <span>MARK INJURY RESOLVED & START TAPER</span>
          </>
        )}
      </button>
    </div>
  );
}
