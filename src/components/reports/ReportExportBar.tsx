"use client";

import { useState } from "react";
import { exportReportCsv } from "@/app/(protected)/reports/actions";
import type { ReportPeriod } from "@/lib/queries";

export function ReportExportBar({ period, branchId }: { period: ReportPeriod; branchId?: string }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setDownloading(true);
    setError(null);
    const res = await exportReportCsv(period, branchId);
    setDownloading(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `รายงาน-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex items-center gap-2 print:hidden">
      <button
        type="button"
        onClick={handleExport}
        disabled={downloading}
        className="rounded-lg border border-border bg-white px-3 py-2 text-[12.5px] font-semibold text-foreground/80 disabled:opacity-50"
      >
        {downloading ? "กำลังสร้าง..." : "ดาวน์โหลด CSV"}
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-lg border border-border bg-white px-3 py-2 text-[12.5px] font-semibold text-foreground/80"
      >
        พิมพ์ / บันทึก PDF
      </button>
      {error && <span className="text-[11.5px] text-danger">{error}</span>}
    </div>
  );
}
