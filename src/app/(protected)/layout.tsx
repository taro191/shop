import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { planLabel } from "@/lib/format";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AppShell storeName={user.store.name} plan={planLabel(user.store.plan)} ownerName={user.name} isOwner={user.role === "OWNER"}>
      {children}
    </AppShell>
  );
}
