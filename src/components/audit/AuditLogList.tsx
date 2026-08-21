"use client";

import { useMemo, useState } from "react";

type LogRow = { id: string; userName: string; action: string; summary: string; dateLabel: string; timeLabel: string };

const ACTION_LABELS: Record<string, string> = {
  "product.create": "สินค้า",
  "staff.add": "พนักงาน",
  "staff.deactivate": "พนักงาน",
  "staff.reactivate": "พนักงาน",
  "branch.create": "สาขา",
  "branch.remove": "สาขา",
  "settings.update": "ตั้งค่า",
  "bill.create_ordered": "บิลซื้อ",
  "bill.create_received": "บิลซื้อ",
  "bill.receive": "บิลซื้อ",
  "bill.mark_paid": "บิลซื้อ",
  "stock.adjust": "ตรวจนับสต๊อก",
  "notify.low_stock": "แจ้งเตือน",
  "billing.plan_change": "แพ็กเกจ",
};

export function AuditLogList({ logs }: { logs: LogRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((l) => l.summary.toLowerCase().includes(q) || l.userName.toLowerCase().includes(q));
  }, [logs, query]);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="ค้นหาชื่อพนักงานหรือรายการ..."
        className="mb-4 w-full rounded-[10px] border border-border px-3.5 py-2.5 text-sm outline-none focus:border-brand"
      />
      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        {filtered.length === 0 ? (
          <div className="px-5 py-10 text-center text-[13px] text-muted">ไม่พบรายการ</div>
        ) : (
          filtered.map((l) => (
            <div key={l.id} className="flex items-start justify-between gap-3 border-b border-border px-4 py-3.5 last:border-none">
              <div className="min-w-0">
                <div className="text-[13px] text-foreground">{l.summary}</div>
                <div className="mt-1 flex items-center gap-2 text-[11.5px] text-muted">
                  <span className="rounded bg-surface-2 px-1.5 py-0.5 font-medium">{ACTION_LABELS[l.action] ?? l.action}</span>
                  <span>{l.userName}</span>
                  <span>·</span>
                  <span>{l.dateLabel} {l.timeLabel}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
