import { auth, signOut } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import SidebarNav from "@/components/SidebarNav";
import { LogOut } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const handleSignOut = async () => {
    "use server";
    await signOut({ redirectTo: "/login" });
  };

  return (
    <div className="flex min-h-screen bg-brand-paper-dark dark:bg-brand-paper-dark">
      {/* Sidebar - Logbook Binder spine style */}
      <aside className="w-64 border-r border-brand-ink/20 flex flex-col justify-between bg-brand-paper dark:bg-brand-paper shrink-0">
        <div>
          {/* Logo Header */}
          <div className="p-6 border-b border-brand-ink/20">
            <Link href="/dashboard" className="block group">
              <h2 className="font-sans text-lg font-black tracking-tight text-brand-ink group-hover:text-brand-load transition-colors">
                AURA//COACH
              </h2>
              <span className="text-[9px] font-mono text-brand-ink/50 uppercase tracking-widest block mt-0.5">
                LEDGER SYSTEM v2.0
              </span>
            </Link>
          </div>

          {/* Navigation Links (Client Component) */}
          <SidebarNav />
        </div>

        {/* Footer Area */}
        <div className="p-4 border-t border-brand-ink/20 bg-brand-paper-dark/30 flex flex-col gap-3">
          <div className="font-sans text-[10px] text-brand-ink/70">
            USER: <span className="font-mono font-bold text-brand-ink">{session.user.email}</span>
          </div>
          <ThemeToggle />
          <form action={handleSignOut}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 border border-brand-ink/35 py-2 font-sans text-xs font-bold uppercase tracking-wider text-brand-ink bg-transparent hover:bg-brand-strain hover:text-white hover:border-brand-strain transition-all duration-150 cursor-pointer"
            >
              <LogOut className="h-3 w-3" />
              <span>LOGOUT</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main content grid */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <main className="flex-1 p-8 max-w-5xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
