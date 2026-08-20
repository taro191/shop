"use client";

import { useMemo, useState } from "react";
import { AddCustomerForm } from "@/components/customers/AddCustomerForm";
import { PlusIcon } from "@/components/icons";

type Customer = { id: string; name: string; phone: string; points: number; createdAt: string };

export function CustomersList({ customers: initial }: { customers: Customer[] }) {
  const [customers, setCustomers] = useState(initial);
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q));
  }, [customers, query]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ค้นหาชื่อหรือเบอร์โทร..."
          className="w-full max-w-xs rounded-[10px] border border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand sm:w-auto"
        />
        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className="flex items-center gap-2 rounded-[10px] bg-brand px-4 py-2.5 text-[13px] font-semibold text-white"
        >
          <PlusIcon className="h-4 w-4" strokeWidth={2.3} />
          เพิ่มลูกค้าใหม่
        </button>
      </div>

      {showAdd && (
        <div className="max-w-sm">
          <AddCustomerForm
            onCreated={(c) => {
              setCustomers((prev) => [{ ...c, createdAt: new Date().toISOString() }, ...prev]);
              setShowAdd(false);
            }}
            onCancel={() => setShowAdd(false)}
          />
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="hidden grid-cols-[1.6fr_1fr_1fr] gap-3 border-b border-border px-5 py-2.5 text-[11.5px] text-muted sm:grid">
          <span>ชื่อลูกค้า</span>
          <span>เบอร์โทร</span>
          <span>แต้มสะสม</span>
        </div>
        {filtered.map((c) => (
          <div key={c.id} className="flex flex-col gap-1 border-t border-border px-5 py-3 first:border-none sm:grid sm:grid-cols-[1.6fr_1fr_1fr] sm:items-center sm:gap-3">
            <span className="text-[13px] font-medium text-foreground">{c.name}</span>
            <span className="text-[13px] text-muted">{c.phone}</span>
            <span className="w-fit rounded-md bg-brand-light px-2.5 py-1 text-[12px] font-semibold text-brand">{c.points} แต้ม</span>
          </div>
        ))}
        {filtered.length === 0 && <div className="px-5 py-10 text-center text-[13px] text-muted">ยังไม่มีลูกค้าในระบบ</div>}
      </div>
    </div>
  );
}
