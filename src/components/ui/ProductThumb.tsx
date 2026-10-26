/** Product photo (from the shared catalog's online source), or an empty tile so rows
 * with and without photos line up. Plain <img>: the photos come from Open Food Facts'
 * image server, and next/image would need its host allow-listed and proxied. */
export function ProductThumb({ src, size = "sm" }: { src: string | null; size?: "sm" | "lg" }) {
  const box = size === "lg" ? "h-32 w-32 rounded-2xl" : "h-10 w-10 rounded-lg";
  if (!src) return <span className={`${box} shrink-0 border border-border bg-background`} aria-hidden />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      className={`${box} shrink-0 border border-border bg-white object-contain`}
    />
  );
}
