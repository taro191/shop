"use client";

import { useState, useTransition } from "react";
import { addFromCatalogAction, type AddedProduct, type CatalogAddState } from "@/app/(protected)/catalog/actions";
import { PlusIcon } from "@/components/icons";

/** "เพิ่มเข้าร้าน" button for one catalog row — expands into a small price/stock form.
 * `onAdded` receives the new store product once it's saved. */
export function CatalogAddButton({
  catalogId,
  unit,
  defaultOpen = false,
  onAdded,
}: {
  catalogId: string;
  unit: string;
  defaultOpen?: boolean;
  onAdded?: (product: AddedProduct) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [state, setState] = useState<CatalogAddState>(null);
  const [pending, startTransition] = useTransition();

  // Called directly rather than through useActionState: the action revalidates the
  // current page, which can unmount this button (e.g. the empty-search prompt it sits in
  // disappears once the product exists) before an effect would get to run onAdded.
  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await addFromCatalogAction(null, formData);
      setState(result);
      if (result?.product) onAdded?.(result.product);
    });
  }

  if (state?.ok) {
    return <span className="rounded-md bg-brand-light px-2.5 py-1 text-[11.5px] font-semibold text-brand">เพิ่มแล้ว</span>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-fit items-center gap-1.5 rounded-[9px] border border-brand px-3 py-1.5 text-[12px] font-semibold text-brand"
      >
        <PlusIcon className="h-3.5 w-3.5" strokeWidth={2.3} />
        เพิ่มเข้าร้าน
      </button>
    );
  }

  const input = "w-full rounded-[8px] border border-border px-2.5 py-1.5 text-[13px] outline-none focus:border-brand";
  return (
    <form action={submit} className="flex w-full flex-col gap-2 sm:w-[300px]">
      <input type="hidden" name="catalogId" value={catalogId} />
      <div className="grid grid-cols-3 gap-2">
        <label className="text-[11px] text-muted">
          ราคาทุน
          <input name="costPrice" type="number" step="0.01" min="0" placeholder="0" className={input} />
        </label>
        <label className="text-[11px] text-muted">
          ราคาขาย *
          <input name="sellPrice" type="number" step="0.01" min="0" required autoFocus className={input} />
        </label>
        <label className="text-[11px] text-muted">
          คงเหลือ ({unit})
          <input name="quantity" type="number" step="1" min="0" placeholder="0" className={input} />
        </label>
      </div>
      {state?.error && <div className="rounded-md bg-danger-light px-2.5 py-1.5 text-[12px] text-danger">{state.error}</div>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-1 rounded-[8px] border border-border py-1.5 text-[12px] font-semibold text-foreground/70"
        >
          ยกเลิก
        </button>
        <button type="submit" disabled={pending} className="flex-1 rounded-[8px] bg-brand py-1.5 text-[12px] font-semibold text-white disabled:opacity-60">
          {pending ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>
    </form>
  );
}
