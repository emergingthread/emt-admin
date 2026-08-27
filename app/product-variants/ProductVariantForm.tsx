"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchJson } from "@/lib/fetch";

type Product = { id: number; name: string; code: string };
type Master = { id: number; name: string; commonTypeName: string };
type Image = { imageUrl: string; publicId: string; altText?: string | null; isPrimary: boolean; displayOrder: number };
export type Variant = { id?: number; productId: number; colorId: number; sizeId?: number; sizeIds?: number[]; sku: string; price: number | string; images?: Image[]; product?: Product; color?: Master; size?: Master };

export default function ProductVariantForm({ variant }: { variant?: Variant }) {
  const router = useRouter();
  const [form, setForm] = useState({
    productId: variant?.productId || 0,
    colorId: variant?.colorId || 0,
    sizeIds: variant?.sizeIds?.length ? variant.sizeIds : variant?.sizeId ? [variant.sizeId] : [] as number[],
    sku: variant?.sku || "",
    price: variant?.price || "",
    images: variant?.images || [] as Image[],
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([fetchJson<{ items: Product[] }>("/api/products?page=1&pageSize=50"), fetchJson<Master[]>("/api/common-masters")])
      .then(([productData, masterData]) => { setProducts(productData.items); setMasters(masterData); })
      .catch((e) => setError(e.message));
  }, []);

  const colors = masters.filter((master) => master.commonTypeName.toLowerCase().includes("color"));
  const sizes = masters.filter((master) => master.commonTypeName.toLowerCase().includes("size"));

  function update(key: "productId" | "colorId" | "sku" | "price", value: string) {
    setForm((current) => ({ ...current, [key]: key === "sku" || key === "price" ? value : Number(value) }));
  }

  function toggleSize(sizeId: number) {
    setForm((current) => ({
      ...current,
      sizeIds: current.sizeIds.includes(sizeId) ? current.sizeIds.filter((id) => id !== sizeId) : [...current.sizeIds, sizeId],
    }));
  }

  async function uploadFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files || [])];
    setError("");
    try {
      const uploaded = await Promise.all(files.map(async (file) => {
        if (!file.type.match(/^image\/(jpeg|png|webp|gif)$/) || file.size > 5 * 1024 * 1024) throw new Error("Use JPG, PNG, WEBP, or GIF images under 5 MB");
        const dataUri = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error("Unable to read image"));
          reader.readAsDataURL(file);
        });
        return fetchJson<Image>("/api/products/images", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataUri }) });
      }));
      setForm((current) => ({ ...current, images: [...current.images, ...uploaded.map((image, index) => ({ ...image, isPrimary: current.images.length === 0 && index === 0, displayOrder: current.images.length + index }))] }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to upload image");
    } finally {
      event.target.value = "";
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!form.sizeIds.length) { setError("Select at least one size"); return; }
    setSaving(true);
    try {
      await fetchJson(`/api/product-variants${variant?.id ? `/${variant.id}` : ""}`, {
        method: variant?.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      router.push("/product-variants");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save product variant");
    } finally {
      setSaving(false);
    }
  }

  return <form className="product-form variant-form" onSubmit={submit}>
    {error && <p className="form-error" role="alert">{error}</p>}
    <section className="product-form-section">
      <h2>Variant Information</h2>
      <div className="product-grid">
        <label>Product<select value={form.productId || ""} required onChange={(e) => update("productId", e.target.value)}><option value="">Select product</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} ({product.code})</option>)}</select></label>
        <label>Color<select value={form.colorId || ""} required onChange={(e) => update("colorId", e.target.value)}><option value="">Select color</option>{colors.map((master) => <option key={master.id} value={master.id}>{master.name}</option>)}</select></label>
        <fieldset className="wide-field size-fieldset">
          <legend>Sizes</legend>
          <div className="size-checkboxes">
            {sizes.map((master) => (
              <label className="size-checkbox" key={master.id}>
                <input type="checkbox" checked={form.sizeIds.includes(master.id)} onChange={() => toggleSize(master.id)} />
                {master.name}
              </label>
            ))}
          </div>
        </fieldset>
        <label>SKU<input value={form.sku} required onChange={(e) => update("sku", e.target.value)} /><span className="field-hint">Multiple sizes create one variant each, with SKU-SIZE.</span></label>
        <label>Price<input type="number" min="0.01" step="0.01" value={form.price} required onChange={(e) => update("price", e.target.value)} /></label>
      </div>
    </section>
    <section className="product-form-section">
      <h2>Color Images</h2>
      <label className="upload-box">Choose images for this color<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={uploadFiles} /></label>
      <div className="product-image-list">{form.images.map((image, index) => (
        <div className="product-image-item" key={`${image.publicId}-${index}`}>
          <img src={image.imageUrl} alt={image.altText || "Color preview"} />
          <div>
            <input placeholder="Alt text" value={image.altText || ""} onChange={(e) => setForm({ ...form, images: form.images.map((current, i) => i === index ? { ...current, altText: e.target.value } : current) })} />
            <button type="button" onClick={() => setForm({ ...form, images: form.images.map((current, i) => ({ ...current, isPrimary: i === index })) })}>{image.isPrimary ? "Primary" : "Set primary"}</button>
            <button type="button" className="danger-button" onClick={() => setForm({ ...form, images: form.images.filter((_, i) => i !== index) })}>Remove</button>
          </div>
        </div>
      ))}</div>
    </section>
    <div className="product-form-actions">
      <button type="button" className="outline-button" onClick={() => router.push("/product-variants")}>Cancel</button>
      <button type="submit" className="primary-button" disabled={saving}>{saving ? "Saving..." : variant ? "Save variant" : "Create variant"}</button>
    </div>
  </form>;
}
