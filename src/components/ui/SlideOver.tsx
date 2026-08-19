"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { PlusIcon } from "@/components/icons";

type ActionState = { error?: string } | null;
type Action = (prevState: ActionState, formData: FormData) => Promise<ActionState>;

export function SlideOver({
  triggerLabel,
  title,
  action,
  children,
}: {
  triggerLabel: string;
  title: string;
  action: Action;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-[10px] bg-brand px-4 py-2.5 text-[13px] font-semibold text-white"
      >
        <PlusIcon className="h-4 w-4" strokeWidth={2.3} />
        {triggerLabel}
      </button>

      {open && (
        <SlideOverPanel
          key={formKey}
          title={title}
          action={action}
          onClose={() => {
            setOpen(false);
            setFormKey((k) => k + 1);
          }}
        >
          {children}
        </SlideOverPanel>
      )}
    </>
  );
}

function SlideOverPanel({
  title,
  action,
  onClose,
  children,
}: {
  title: string;
  action: Action;
  onClose: () => void;
  children: ReactNode;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (!pending && submittedRef.current) {
      submittedRef.current = false;
      if (!state?.error) onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, state]);

  return (
    <div className="fixed inset-0 z-30 flex justify-end">
      <div className="absolute inset-0 bg-black/35" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-[380px] flex-col bg-white shadow-[-8px_0_24px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <span className="font-display text-[17px] font-semibold text-foreground">{title}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground/60 hover:bg-background"
          >
            ✕
          </button>
        </div>

        <form
          action={formAction}
          onSubmit={() => {
            submittedRef.current = true;
          }}
          className="flex flex-grow flex-col overflow-y-auto"
        >
          <div className="flex flex-grow flex-col gap-4 px-6 py-5">
            {state?.error && (
              <div className="rounded-lg bg-danger-light px-3.5 py-2.5 text-[12.5px] text-danger">{state.error}</div>
            )}
            {children}
          </div>
          <div className="flex gap-2.5 border-t border-border px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-[10px] border border-border py-2.5 text-[13px] font-semibold text-foreground/70"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 rounded-[10px] bg-brand py-2.5 text-[13px] font-semibold text-white disabled:opacity-60"
            >
              {pending ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Field({
  label,
  name,
  type = "text",
  placeholder,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-semibold text-muted">{label}</label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        className="w-full rounded-[9px] border border-border px-3.5 py-2.5 text-sm outline-none focus:border-brand"
      />
    </div>
  );
}

type SelectOption = string | { value: string; label: string };

export function SelectField({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: SelectOption[];
  defaultValue?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-semibold text-muted">{label}</label>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-[9px] border border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand"
      >
        {options.map((o) => {
          const value = typeof o === "string" ? o : o.value;
          const label = typeof o === "string" ? o : o.label;
          return (
            <option key={value} value={value}>
              {label}
            </option>
          );
        })}
      </select>
    </div>
  );
}
