import type { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import { BottomNav } from "@/components/BottomNav";

export function AppShell({
  storeName,
  plan,
  ownerName,
  isOwner,
  children,
}: {
  storeName: string;
  plan: string;
  ownerName: string;
  isOwner: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar storeName={storeName} plan={plan} ownerName={ownerName} isOwner={isOwner} />
      <main className="min-w-0 flex-grow pb-20 md:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}
