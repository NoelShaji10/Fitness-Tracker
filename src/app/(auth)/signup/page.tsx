"use client";

import { useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUpAction } from "@/lib/actions/auth";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    startTransition(async () => {
      const res = await signUpAction(null, formData);
      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      }
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-paper px-4 py-12 dark:bg-brand-paper">
      <div className="w-full max-w-md border-2 border-brand-ink bg-brand-paper p-8 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] dark:border-brand-ink dark:bg-brand-paper-dark dark:shadow-[4px_4px_0px_0px_rgba(234,234,234,0.15)]">
        <div className="mb-8 text-center">
          <h1 className="font-mono text-3xl font-bold tracking-tight text-brand-ink">
            AURA//COACH
          </h1>
          <p className="mt-2 text-sm text-brand-ink/75 font-sans">
            Register New Personal Fitness Ledger
          </p>
        </div>

        <div className="border-t border-brand-ink/20 my-6"></div>

        {error && (
          <div className="mb-6 border-2 border-brand-strain bg-brand-strain/10 p-3 text-sm font-mono text-brand-strain">
            [ERROR]: {error}
          </div>
        )}

        {success && (
          <div className="mb-6 border-2 border-brand-gain bg-brand-gain/10 p-3 text-sm font-mono text-brand-gain">
            [SUCCESS]: Account registered! Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block font-mono text-xs uppercase tracking-wider text-brand-ink/80 mb-2"
            >
              01 // EMAIL ADDRESS
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-2 border-brand-ink bg-transparent px-4 py-2 font-mono text-sm text-brand-ink placeholder-brand-ink/40 focus:outline-none focus:ring-2 focus:ring-brand-load"
              placeholder="e.g. user@domain.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block font-mono text-xs uppercase tracking-wider text-brand-ink/80 mb-2"
            >
              02 // CHOOSE PASSWORD
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-2 border-brand-ink bg-transparent px-4 py-2 font-mono text-sm text-brand-ink placeholder-brand-ink/40 focus:outline-none focus:ring-2 focus:ring-brand-load"
              placeholder="Min. 6 characters"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block font-mono text-xs uppercase tracking-wider text-brand-ink/80 mb-2"
            >
              03 // CONFIRM PASSWORD
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border-2 border-brand-ink bg-transparent px-4 py-2 font-mono text-sm text-brand-ink placeholder-brand-ink/40 focus:outline-none focus:ring-2 focus:ring-brand-load"
              placeholder="Repeat password"
            />
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full border-2 border-brand-ink bg-brand-ink py-3 font-mono text-sm uppercase tracking-widest text-brand-paper transition-all hover:bg-brand-load hover:text-brand-paper hover:border-brand-load disabled:opacity-50"
          >
            {loading ? "REGISTERING..." : "CREATE ACCOUNT"}
          </button>
        </form>

        <div className="mt-8 text-center text-xs font-mono text-brand-ink/65">
          ALREADY REGISTERED?{" "}
          <Link
            href="/login"
            className="underline text-brand-load font-bold hover:text-brand-ink"
          >
            SIGN IN HERE
          </Link>
        </div>
      </div>
    </div>
  );
}
