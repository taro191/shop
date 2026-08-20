/** Thai PromptPay QR payload builder — the "Thai QR Payment" standard (EMVCo-based
 * TLV format used by every Thai bank app's QR scanner). No gateway/account needed:
 * this is a static, unverified QR — the cashier confirms payment manually after the
 * customer scans and pays, same as showing a bank account number today. Structurally
 * correct per the published spec, but not verified against a real bank app scan in
 * this environment — test with an actual banking app before relying on it. */

function tlv(id: string, value: string): string {
  return `${id}${value.length.toString().padStart(2, "0")}${value}`;
}

function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export type PromptPayTargetKind = "mobile" | "national_id";

export function detectPromptPayTargetKind(raw: string): PromptPayTargetKind | null {
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.length === 10 && digits.startsWith("0")) return "mobile";
  if (digits.length === 13) return "national_id";
  return null;
}

/** Builds the QR payload string. `amount` in THB with up to 2 decimal places;
 * omit for a static "any amount" QR. Throws if `promptPayId` isn't a recognizable
 * 10-digit mobile number or 13-digit national/tax ID. */
export function buildPromptPayPayload(promptPayId: string, amount?: number): string {
  const digits = promptPayId.replace(/[^0-9]/g, "");
  const kind = detectPromptPayTargetKind(digits);
  if (!kind) throw new Error("รูปแบบพร้อมเพย์ไม่ถูกต้อง ต้องเป็นเบอร์โทร 10 หลัก หรือเลขบัตรประชาชน 13 หลัก");

  const proxyType = kind === "mobile" ? "01" : "02";
  const proxyValue = kind === "mobile" ? `0066${digits.substring(1)}` : digits;

  const merchantInfo = tlv("00", "A000000677010111") + tlv(proxyType, proxyValue);

  let payload =
    tlv("00", "01") +
    tlv("01", amount ? "12" : "11") +
    tlv("29", merchantInfo) +
    tlv("53", "764") +
    (amount ? tlv("54", amount.toFixed(2)) : "") +
    tlv("58", "TH");

  payload += "6304";
  return payload + crc16(payload);
}
