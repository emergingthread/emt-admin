"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchJson } from "@/lib/fetch";

type Master = { id: number; name: string; commonTypeName: string };
export type Product = { id?: number; name: string; code: string; slug: string; description: string | null; categoryId: number; collectionId: number | null; genderId: number; materialId: number | null; fitId: number | null; necklineId: number | null; sleeveTypeId: number | null; occasionId: number | null; patternId: number | null; seasonId: number | null; lengthId: number | null; careInstructionsId: number | null; productStatusId: number | null; isActive: boolean; category?: Master; gender?: Master; collection?: Master | null; productStatus?: Master | null };

const fields = [
  ["categoryId", "Category", "category"], ["collectionId", "Collection", "collection"], ["genderId", "Gender / Audience", "gender"], ["materialId", "Material / Fabric", "material"], ["fitId", "Fit", "fit"], ["patternId", "Pattern", "pattern"], ["seasonId", "Season", "season"], ["occasionId", "Occasion", "occasion"], ["necklineId", "Neckline", "neckline"], ["sleeveTypeId", "Sleeve Type", "sleeve"], ["lengthId", "Length", "length"], ["careInstructionsId", "Care Instructions", "care"], ["productStatusId", "Product Status", "status"],
] as const;

type FormState = Omit<Product, "id">;
const empty: FormState = { name: "", code: "", slug: "", description: "", categoryId: 0, collectionId: null, genderId: 0, materialId: null, fitId: null, necklineId: null, sleeveTypeId: null, occasionId: null, patternId: null, seasonId: null, lengthId: null, careInstructionsId: null, productStatusId: null, isActive: true };

export default function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(product ? { ...product } : empty);
  const [masters, setMasters] = useState<Master[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchJson<Master[]>("/api/common-masters").then(setMasters).catch((e) => setError(e.message)); }, []);
  const grouped = (key: string) => masters.filter((master) => master.commonTypeName.toLowerCase().replace(/[\s_-]/g, "").includes(key.replace(/[\s_-]/g, "")));
  const setValue = (key: keyof FormState, value: string | boolean) => setForm((current) => ({ ...current, [key]: typeof value === "boolean" ? value : value === "" ? null : Number(value) }));

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setSaving(true);
    try {
      await fetchJson(`/api/products${product?.id ? `/${product.id}` : ""}`, { method: product?.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      router.push("/products"); router.refresh();
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Unable to save product"); }
    finally { setSaving(false); }
  }

  return <form className="product-form" onSubmit={submit}>
    {error && <p className="form-error" role="alert">{error}</p>}
    <section className="product-form-section"><h2>Basic Information</h2><div className="product-grid"><label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label><label>Code<input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required /></label><label>Slug<input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required /></label><label className="wide-field">Description<textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} /></label></div></section>
    <section className="product-form-section"><h2>Product Classification</h2><div className="product-grid">{fields.slice(0, 8).map(([key, label, group]) => <MasterSelect key={key} field={key} label={label} values={grouped(group)} value={form[key] as number | null} required={key === "categoryId" || key === "genderId"} onChange={setValue} />)}</div></section>
    <section className="product-form-section"><h2>Clothing Details</h2><div className="product-grid">{fields.slice(8, 12).map(([key, label, group]) => <MasterSelect key={key} field={key} label={label} values={grouped(group)} value={form[key] as number | null} onChange={setValue} />)}</div></section>
    <section className="product-form-section"><h2>Product Status</h2><div className="product-grid"><MasterSelect field="productStatusId" label="Product Status" values={grouped("status")} value={form.productStatusId} onChange={setValue} /><label className="checkbox-field"><input type="checkbox" checked={form.isActive} onChange={(e) => setValue("isActive", e.target.checked)} /> Active product</label></div></section>
    <div className="product-form-actions"><button type="button" className="outline-button" onClick={() => router.push("/products")}>Cancel</button><button type="submit" className="primary-button" disabled={saving}>{saving ? "Saving..." : product ? "Save product" : "Create product"}</button></div>
  </form>;
}

function MasterSelect({ field, label, values, value, required, onChange }: { field: keyof FormState; label: string; values: Master[]; value: number | null; required?: boolean; onChange: (key: keyof FormState, value: string) => void }) { return <label>{label}<select value={value || ""} required={required} onChange={(e) => onChange(field, e.target.value)}><option value="">Select {label.toLowerCase()}</option>{values.map((master) => <option value={master.id} key={master.id}>{master.name}</option>)}</select></label>; }
