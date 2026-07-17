"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Award, Zap, Smile } from "lucide-react";
import PlateStack from "@/components/PlateStack";

interface ProgressChartsProps {
  data: {
    macroTrends: any[];
    strengthHistory: any[];
    consistencyRate: number;
    completedWorkouts: number;
    totalLoggedDays: number;
    weightProjections: any[];
  };
}

export default function ProgressCharts({ data }: ProgressChartsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="py-20 text-center font-sans text-xs text-brand-ink/50 bg-brand-paper border border-dashed border-brand-ink/20">
        [SYSTEM] COMPILING PROGRESS LEDGER CHARTS...
      </div>
    );
  }

  // Check if we have strength data
  const hasStrengthData = data.strengthHistory.length > 0;
  
  // Format strength data for Recharts (unify lift properties across dates)
  const strengthChartData = data.strengthHistory.map((item) => ({
    date: item.date,
    ...item.lifts,
  }));

  // Identify which compound lifts exist in the logs to render lines dynamically
  const uniqueLifts = Array.from(
    new Set(data.strengthHistory.flatMap((item) => Object.keys(item.lifts)))
  );

  // Line colors for different lifts
  const lineColors = ["#2B5B84", "#3B7A57", "#B23B3B", "#1A1A1A", "#8A8A8A"];

  return (
    <div className="space-y-8">
      {/* Vitals Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="border border-brand-ink/15 bg-brand-paper p-5 flex items-center gap-4 hover:border-brand-load transition-all duration-150 shadow-sm">
          <div className="bg-brand-load/10 p-3 text-brand-load shrink-0">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <span className="block font-sans text-[9px] uppercase font-bold tracking-wider text-brand-ink/65">
              CONSISTENCY RATE
            </span>
            <span className="block font-mono text-3xl font-black text-brand-ink mt-1 leading-none">
              {data.consistencyRate}%
            </span>
            <div className="mt-2">
              <PlateStack
                value={Math.round(data.consistencyRate / 20)}
                max={5}
                variant="gain"
                size="sm"
              />
            </div>
          </div>
        </div>

        <div className="border border-brand-ink/15 bg-brand-paper p-5 flex items-center gap-4 hover:border-brand-load transition-all duration-150 shadow-sm">
          <div className="bg-brand-gain/10 p-3 text-brand-gain shrink-0">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <span className="block font-sans text-[9px] uppercase font-bold tracking-wider text-brand-ink/65">
              COMPLETED WORKOUTS
            </span>
            <span className="block font-mono text-3xl font-black text-brand-ink mt-1 leading-none">
              {data.completedWorkouts}{" "}
              <span className="text-[10px] font-sans font-bold text-brand-ink/65 uppercase tracking-wide">Sessions</span>
            </span>
            <span className="text-[10px] font-sans text-brand-ink/60 mt-1 block">
              out of {data.totalLoggedDays} logged days
            </span>
          </div>
        </div>

        <div className="border border-brand-ink/15 bg-brand-paper p-5 flex items-center gap-4 hover:border-brand-load transition-all duration-150 shadow-sm">
          <div className="bg-brand-strain/10 p-3 text-brand-strain shrink-0">
            <Smile className="h-5 w-5" />
          </div>
          <div>
            <span className="block font-sans text-[9px] uppercase font-bold tracking-wider text-brand-ink/65">
              TOTAL RECORDED JOURNAL
            </span>
            <span className="block font-mono text-3xl font-black text-brand-ink mt-1 leading-none">
              {data.totalLoggedDays}{" "}
              <span className="text-[10px] font-sans font-bold text-brand-ink/65 uppercase tracking-wide">Logs</span>
            </span>
            <span className="text-[10px] font-sans text-brand-ink/60 mt-1 block">
              ledger entries logged
            </span>
          </div>
        </div>
      </div>

      {/* Calorie Macro Chart */}
      <div className="border border-brand-ink/15 bg-brand-paper p-6 shadow-sm">
        <h3 className="font-sans text-xs uppercase font-bold text-brand-ink mb-4 pb-2 border-b border-brand-ink/15">
          {"// DIETARY ENERGY: TARGET VS. ACTUAL"}
        </h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.macroTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E2D9" className="opacity-40" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fontFamily: "monospace" }} />
              <YAxis tick={{ fontSize: 9, fontFamily: "monospace" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FDFBF7",
                  border: "1px solid #1A1A1A",
                  fontFamily: "monospace",
                  fontSize: 10,
                }}
              />
              <Legend wrapperStyle={{ fontFamily: "monospace", fontSize: 10, paddingTop: 10 }} />
              <Bar dataKey="caloriesLogged" name="Actual Calories (kcal)" fill="#2B5B84" />
              <Bar dataKey="caloriesTarget" name="Target Calories (kcal)" fill="#E2E2D9" stroke="#1A1A1A" strokeWidth={1} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lift Strength Progression Chart */}
      <div className="border border-brand-ink/15 bg-brand-paper p-6 shadow-sm">
        <h3 className="font-sans text-xs uppercase font-bold text-brand-ink mb-4 pb-2 border-b border-brand-ink/15">
          {"// COMPOUND LOAD PROGRESSION HISTORY (MAX WEIGHTS)"}
        </h3>
        {hasStrengthData ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={strengthChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E2D9" className="opacity-40" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fontFamily: "monospace" }} />
                <YAxis unit="kg" tick={{ fontSize: 9, fontFamily: "monospace" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FDFBF7",
                    border: "1px solid #1A1A1A",
                    fontFamily: "monospace",
                    fontSize: 10,
                  }}
                />
                <Legend wrapperStyle={{ fontFamily: "monospace", fontSize: 10, paddingTop: 10 }} />
                {uniqueLifts.map((liftName, idx) => (
                  <Line
                    key={liftName}
                    type="monotone"
                    dataKey={liftName}
                    name={liftName}
                    stroke={lineColors[idx % lineColors.length]}
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-20 text-center font-sans text-xs text-brand-ink/50 border border-dashed border-brand-ink/20">
            {"// NO WORKOUT PERFORMANCE LOGS DETECTED. START RECORDING LOGS TO ACCRUE PROGRESS CURVES."}
          </div>
        )}
      </div>

      {/* 12-Week Weight Projection */}
      <div className="border border-brand-ink/15 bg-brand-paper p-6 shadow-sm">
        <h3 className="font-sans text-xs uppercase font-bold text-brand-ink mb-4 pb-2 border-b border-brand-ink/15">
          {"// 12-WEEK WEIGHT METRIC PROJECTION CURVE"}
        </h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.weightProjections} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E2D9" className="opacity-40" />
              <XAxis dataKey="week" tick={{ fontSize: 9, fontFamily: "monospace" }} />
              <YAxis unit="kg" domain={["dataMin - 2", "dataMax + 2"]} tick={{ fontSize: 9, fontFamily: "monospace" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FDFBF7",
                  border: "1px solid #1A1A1A",
                  fontFamily: "monospace",
                  fontSize: 10,
                }}
              />
              <Legend wrapperStyle={{ fontFamily: "monospace", fontSize: 10, paddingTop: 10 }} />
              <Line
                type="monotone"
                dataKey="weight"
                name="Projected Weight (kg)"
                stroke="#3B7A57"
                strokeWidth={2}
                dot={{ stroke: "#3B7A57", strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
