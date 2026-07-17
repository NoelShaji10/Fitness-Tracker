"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-8 border border-brand-ink/10 animate-pulse bg-brand-paper-dark/30"></div>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="flex items-center justify-between w-full border border-brand-ink/25 px-3 py-2 font-mono text-[10px] tracking-wider text-brand-ink/80 hover:bg-brand-paper-dark transition-all rounded-none bg-transparent cursor-pointer"
    >
      <span className="font-bold">THEME: {theme?.toUpperCase()}</span>
      {theme === "dark" ? (
        <Sun className="h-3.5 w-3.5 text-brand-load" />
      ) : (
        <Moon className="h-3.5 w-3.5 text-brand-load" />
      )}
    </button>
  );
}
