// Barcode reading for the camera scanners. Uses the browser's built-in BarcodeDetector
// where it exists (Chrome on Android) and otherwise falls back to the `barcode-detector`
// ponyfill (ZXing compiled to WebAssembly), so iPhone Safari and desktop browsers can
// scan too. The ponyfill is loaded on demand, only when a scanner is opened.

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats: string[] }) => BarcodeReader;
  }
}

export type BarcodeReader = {
  detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]>;
};

const FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code"] as const;

/** Whether this browser can open the camera at all (needs HTTPS or localhost). */
export function canUseCamera(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.mediaDevices?.getUserMedia === "function";
}

export async function createBarcodeReader(): Promise<BarcodeReader> {
  if (window.BarcodeDetector) return new window.BarcodeDetector({ formats: [...FORMATS] });
  const { BarcodeDetector } = await import("barcode-detector/ponyfill");
  return new BarcodeDetector({ formats: [...FORMATS] });
}
