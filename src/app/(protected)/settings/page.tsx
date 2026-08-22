import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { SettingsForm } from "@/components/SettingsForm";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "OWNER") redirect("/dashboard");

  return (
    <div className="mx-auto max-w-[520px] pb-10">
      <PageHeader title="ข้อมูลร้านค้า" subtitle="ตั้งค่าชื่อร้านและช่องทางรับเงิน QR พร้อมเพย์" />
      <div className="px-5 pt-4 sm:px-8">
        <SettingsForm
          storeName={user.store.name}
          promptPayId={user.store.promptPayId ?? ""}
          notifyWebhookUrl={user.store.notifyWebhookUrl ?? ""}
          vatRegistered={user.store.vatRegistered}
          taxId={user.store.taxId ?? ""}
        />
      </div>
    </div>
  );
}
