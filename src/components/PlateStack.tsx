"use client";

interface PlateStackProps {
  value: number; // Current filled plates count
  max?: number; // Total plates in the stack
  variant?: "load" | "strain" | "gain" | "neutral";
  size?: "sm" | "md" | "lg";
}

export default function PlateStack({
  value,
  max = 5,
  variant = "load",
  size = "md",
}: PlateStackProps) {
  // Ensure value doesn't exceed max or drop below 0
  const filledCount = Math.min(Math.max(0, value), max);

  // Variant classes mapping
  const colorMap = {
    load: "bg-brand-load border-brand-load", // Steel-blue
    strain: "bg-brand-strain border-brand-strain", // Brick-red
    gain: "bg-brand-gain border-brand-gain", // Olive
    neutral: "bg-brand-ink border-brand-ink", // Graphite
  };

  const activeColor = colorMap[variant];

  // Size mapping for the plate rectangles
  const sizeMap = {
    sm: "h-4 w-1.5",
    md: "h-6 w-2.5",
    lg: "h-8 w-3.5",
  };

  const plateSize = sizeMap[size];

  return (
    <div className="inline-flex items-center gap-1 font-mono text-xs">
      {/* Visual Plate Blocks */}
      <div className="flex items-center gap-0.5" role="progressbar" aria-valuenow={value} aria-valuemax={max}>
        {Array.from({ length: max }).map((_, idx) => {
          const isFilled = idx < filledCount;
          return (
            <div
              key={idx}
              className={`transition-all duration-300 border ${
                isFilled
                  ? `${activeColor}`
                  : "bg-transparent border-brand-ink/15 dark:border-brand-ink/30"
              } ${plateSize}`}
            />
          );
        })}
      </div>
      
      {/* Tabular Number label next to it */}
      <span className="ml-2 text-[10px] text-brand-ink/70 dark:text-brand-ink/80 font-mono">
        ({filledCount}/{max})
      </span>
    </div>
  );
}
