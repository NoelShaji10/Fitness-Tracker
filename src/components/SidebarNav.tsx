"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Dumbbell,
  Utensils,
  ClipboardCheck,
  TrendingUp,
  Settings,
} from "lucide-react";

interface LinkItem {
  href: string;
  index: string;
  label: string;
  icon: React.ReactNode;
}

export default function SidebarNav() {
  const pathname = usePathname();

  const links: LinkItem[] = [
    {
      href: "/dashboard/workout",
      index: "01",
      label: "WORKOUTS",
      icon: <Dumbbell className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />,
    },
    {
      href: "/dashboard/nutrition",
      index: "02",
      label: "NUTRITION",
      icon: <Utensils className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />,
    },
    {
      href: "/dashboard/checkin",
      index: "03",
      label: "CHECK-IN",
      icon: <ClipboardCheck className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />,
    },
    {
      href: "/dashboard/progress",
      index: "04",
      label: "PROGRESS",
      icon: <TrendingUp className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />,
    },
    {
      href: "/dashboard/settings",
      index: "05",
      label: "SETTINGS",
      icon: <Settings className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />,
    },
  ];

  return (
    <nav className="flex flex-col">
      {links.map((link) => {
        const isActive = pathname === link.href || pathname?.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`group flex items-center justify-between border-b border-brand-ink/10 px-4 py-3.5 transition-all duration-150 ${
              isActive
                ? "bg-brand-paper border-l-4 border-l-brand-load pl-3 text-brand-load font-bold"
                : "text-brand-ink/80 hover:bg-brand-paper/50 hover:text-brand-ink"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`transition-colors duration-150 ${isActive ? "text-brand-load" : "text-brand-ink/60"}`}>
                {link.icon}
              </span>
              <span className="font-sans text-xs font-bold tracking-wider uppercase">
                {link.label}
              </span>
            </div>
            
            <span className="font-mono text-[9px] text-brand-ink/40 tracking-wider">
              {link.index}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
