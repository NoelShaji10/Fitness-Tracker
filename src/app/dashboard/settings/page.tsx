import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import SettingsForm from "@/components/SettingsForm";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile) {
    redirect("/dashboard/onboarding");
  }

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="border-b border-brand-ink/20 pb-4">
        <span className="font-sans text-[10px] uppercase tracking-widest text-brand-load font-bold">
          LEDGER UTILITIES // SETTINGS
        </span>
        <h1 className="font-sans text-2xl font-black tracking-tight text-brand-ink uppercase">
          COACH & PROFILE SETTINGS
        </h1>
      </div>

      <SettingsForm initialProfile={profile} />
    </div>
  );
}
