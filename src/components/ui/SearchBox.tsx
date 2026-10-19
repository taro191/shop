import { ScanSearchButton } from "@/components/ScanSearchButton";

export function SearchBox({
  action,
  placeholder,
  defaultValue,
  hiddenParams,
  scan,
}: {
  action: string;
  placeholder: string;
  defaultValue?: string;
  hiddenParams?: Record<string, string | undefined>;
  /** Adds a camera button that scans a barcode into `q`. */
  scan?: boolean;
}) {
  return (
    <form action={action} className="flex items-center gap-2 rounded-[10px] border border-border bg-white px-3.5 py-2.5 sm:w-[260px]">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
      {Object.entries(hiddenParams ?? {}).map(([k, v]) =>
        v ? <input key={k} type="hidden" name={k} value={v} /> : null
      )}
      <input
        type="text"
        name="q"
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full min-w-0 bg-transparent text-[13px] outline-none"
      />
      {scan && <ScanSearchButton action={action} params={hiddenParams} />}
    </form>
  );
}
