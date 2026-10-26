"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BarcodeIcon } from "@/components/icons";
import { CameraScanModal } from "@/components/ScanSearchButton";
import { ProductThumb } from "@/components/ui/ProductThumb";
import { PRODUCT_CATEGORIES, PRODUCT_UNITS } from "@/lib/constants";

const inputClass = "w-full rounded-[9px] border border-border px-3.5 py-2.5 text-sm outline-none focus:border-brand";
const labelClass = "mb-1.5 block text-[12px] font-semibold text-muted";
/** Uploaded photos are shrunk to fit this box before sending. */
const MAX_PHOTO_SIDE = 800;

type Lookup =
  | { state: "searching" }
  | { state: "owned"; id: string; name: string }
  | { state: "found"; name: string }
  | { state: "none" };

type CatalogHit = {
  name: string;
  category: string;
  unit: string;
  barcode: string | null;
  imageUrl: string | null;
  groupKey: string | null;
};

/** Fields of the add-product form: the barcode comes first and is looked up (store,
 * shared catalog, then online) to fill in the name, category, unit and photo; then the
 * name, and a button to add a photo from the camera or gallery. */
export function NewProductFields({ prefill }: { prefill: string }) {
  const prefillIsBarcode = /^\d{8,14}$/.test(prefill);
  const [barcode, setBarcode] = useState(prefillIsBarcode ? prefill : "");
  const [name, setName] = useState(prefillIsBarcode ? "" : prefill);
  const [category, setCategory] = useState(PRODUCT_CATEGORIES[0]);
  const [unit, setUnit] = useState(PRODUCT_UNITS[0]);
  const [catalogImage, setCatalogImage] = useState<string | null>(null);
  const [groupKey, setGroupKey] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [lookup, setLookup] = useState<Lookup | null>(prefillIsBarcode ? { state: "searching" } : null);
  const lookedUp = useRef<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function lookUp(code: string) {
    code = code.trim();
    if (!/^\d{8,14}$/.test(code) || lookedUp.current === code) return;
    lookedUp.current = code;
    setLookup({ state: "searching" });
    fetchLookup(code);
  }

  async function fetchLookup(code: string) {
    try {
      const own = await fetch(`/api/products/lookup?barcode=${code}`).then((r) => r.json());
      if (lookedUp.current !== code) return;
      if (own.found) {
        setLookup({ state: "owned", id: own.product.id, name: own.product.name });
        return;
      }
      const data = await fetch(`/api/catalog/search?q=${code}`).then((r) => r.json());
      if (lookedUp.current !== code) return;
      const items: CatalogHit[] = data.items ?? [];
      const hit = items.find((i) => i.barcode === code);
      if (!hit) {
        setLookup({ state: "none" });
        nameRef.current?.focus();
        return;
      }
      setName(hit.name);
      if (PRODUCT_CATEGORIES.includes(hit.category)) setCategory(hit.category);
      if (PRODUCT_UNITS.includes(hit.unit)) setUnit(hit.unit);
      setCatalogImage(hit.imageUrl);
      setGroupKey(hit.groupKey ?? "");
      setLookup({ state: "found", name: hit.name });
    } catch {
      if (lookedUp.current === code) setLookup({ state: "none" });
    }
  }

  // Arriving with a barcode already filled in (e.g. from "not found, add it").
  useEffect(() => {
    if (!prefillIsBarcode) return;
    lookedUp.current = prefill;
    fetchLookup(prefill);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function choosePhoto(file: File | undefined) {
    if (!file) return;
    setPhotoError("");
    try {
      setPhoto(await shrinkPhoto(file));
    } catch {
      setPhotoError("เปิดรูปนี้ไม่ได้ ลองเลือกรูปอื่น");
    }
  }

  const shownPhoto = photo ?? catalogImage;

  return (
    <>
      <div>
        <label className={labelClass}>บาร์โค้ด</label>
        <div className="flex gap-2">
          <input
            name="barcode"
            value={barcode}
            inputMode="numeric"
            autoFocus={!prefill}
            placeholder="สแกนหรือพิมพ์เลขบาร์โค้ด"
            onChange={(e) => {
              setBarcode(e.target.value);
              lookedUp.current = null;
              setLookup(null);
            }}
            onBlur={() => lookUp(barcode)}
            onKeyDown={(e) => {
              // Barcode guns end with Enter: look the code up instead of submitting.
              if (e.key === "Enter") {
                e.preventDefault();
                lookUp(barcode);
              }
            }}
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => setScanning(true)}
            aria-label="สแกนบาร์โค้ดด้วยกล้อง"
            className="flex shrink-0 items-center gap-1 rounded-[9px] bg-brand-light px-3 text-[12.5px] font-semibold text-brand"
          >
            <BarcodeIcon className="h-4 w-4" />
            สแกน
          </button>
        </div>
        {lookup && <LookupNote lookup={lookup} />}
      </div>

      <div>
        <label className={labelClass}>ชื่อสินค้า</label>
        <input
          ref={nameRef}
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="เช่น น้ำปลาตราปลาหมึก 700ml"
          required
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>รูปสินค้า (ถ้ามี)</label>
        <div className="flex items-center gap-3">
          {shownPhoto && <ProductThumb src={shownPhoto} />}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-[9px] border border-border px-3.5 py-2 text-[12.5px] font-semibold text-foreground/75"
          >
            {shownPhoto ? "เปลี่ยนรูป" : "+ เพิ่มรูปภาพ"}
          </button>
          {shownPhoto && (
            <button
              type="button"
              onClick={() => {
                setPhoto(null);
                setCatalogImage(null);
              }}
              className="text-[12px] text-muted underline"
            >
              ลบรูป
            </button>
          )}
        </div>
        {photoError && <div className="mt-1.5 text-[12px] text-danger">{photoError}</div>}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            choosePhoto(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <input type="hidden" name="imageData" value={photo ?? ""} />
        <input type="hidden" name="imageUrl" value={photo ? "" : (catalogImage ?? "")} />
        <input type="hidden" name="groupKey" value={groupKey} />
      </div>

      <div>
        <label className={labelClass}>หมวดหมู่</label>
        <select name="category" value={category} onChange={(e) => setCategory(e.target.value)} className={`${inputClass} bg-white`}>
          {PRODUCT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>ราคาทุน (บาท)</label>
          <input name="costPrice" type="number" placeholder="0" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>ราคาขาย (บาท)</label>
          <input name="sellPrice" type="number" placeholder="0" required className={inputClass} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>จำนวนคงเหลือ</label>
          <input name="quantity" type="number" placeholder="0" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>หน่วยนับ</label>
          <select name="unit" value={unit} onChange={(e) => setUnit(e.target.value)} className={`${inputClass} bg-white`}>
            {PRODUCT_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className={labelClass}>วันหมดอายุ (ถ้ามี)</label>
        <input name="expiresAt" type="date" className={inputClass} />
      </div>

      {scanning && (
        <CameraScanModal
          onDetect={(code) => {
            setScanning(false);
            setBarcode(code);
            lookUp(code);
          }}
          onClose={() => setScanning(false)}
        />
      )}
    </>
  );
}

function LookupNote({ lookup }: { lookup: Lookup }) {
  const base = "mt-1.5 text-[12px]";
  switch (lookup.state) {
    case "searching":
      return <div className={`${base} text-muted`}>กำลังค้นหาสินค้าจากบาร์โค้ด...</div>;
    case "owned":
      return (
        <div className={`${base} text-danger`}>
          มีในร้านแล้ว:{" "}
          <Link href={`/inventory/${lookup.id}`} className="font-semibold underline">
            {lookup.name}
          </Link>
        </div>
      );
    case "found":
      return <div className={`${base} text-brand`}>พบสินค้า — กรอกชื่อและรูปให้แล้ว ตรวจกับสินค้าจริงก่อนบันทึก</div>;
    case "none":
      return <div className={`${base} text-muted`}>ไม่พบข้อมูลสินค้านี้ — กรอกชื่อสินค้าเองได้เลย</div>;
  }
}

/** Reads a photo and shrinks it to a JPEG data URL no larger than MAX_PHOTO_SIDE. */
async function shrinkPhoto(file: File) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_PHOTO_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.82);
}
