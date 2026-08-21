"use server";

import { getSession } from "@/lib/auth";
import { getReportRows, getAverageMarginRatio, type ReportPeriod } from "@/lib/queries";

const PERIOD_COL: Record<ReportPeriod, string> = { daily: "วันที่", monthly: "เดือน", quarterly: "ไตรมาส" };

function csvEscape(value: string | number) {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function exportReportCsv(period: ReportPeriod, branchId?: string): Promise<{ csv: string } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "กรุณาเข้าสู่ระบบ" };

  const [rows, marginRatio] = await Promise.all([
    getReportRows(session.storeId, period, branchId),
    getAverageMarginRatio(session.storeId),
  ]);

  const withProfit = rows.map((r) => {
    const estimatedSales = Math.max(r.sales - r.salesWithRealCost, 0);
    const cost = Math.round(r.realCost + estimatedSales * (1 - marginRatio));
    return { ...r, cost, profit: r.sales - cost };
  });

  const header = [PERIOD_COL[period], "ยอดขาย", "ต้นทุน", "กำไร", "จำนวนบิล"];
  const lines = [header.map(csvEscape).join(",")];
  for (const r of withProfit) {
    lines.push([r.label, r.sales, r.cost, r.profit, r.bills].map(csvEscape).join(","));
  }

  // Prepend a UTF-8 BOM so Excel opens Thai text correctly instead of mangling it.
  return { csv: "﻿" + lines.join("\n") };
}
