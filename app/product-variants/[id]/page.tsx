"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Header from "@/app/components/Header";
import LoadingIndicator from "@/app/components/LoadingIndicator";
import Sidebar from "@/app/components/Sidebar";
import ProductVariantForm, { type Variant } from "@/app/product-variants/ProductVariantForm";
import { fetchJson } from "@/lib/fetch";

export default function ProductVariantDetailPage({ params }: { params: Promise<{ id: string }> }) { const [variant, setVariant] = useState<Variant | null>(null); const [error, setError] = useState(""); useEffect(() => { params.then(({ id }) => fetchJson<Variant>(`/api/product-variants/${id}`).then(setVariant).catch((e) => setError(e.message))); }, [params]); return <div className="dashboard-shell"><Sidebar /><main className="dashboard-main"><Header eyebrow="Catalog" title="Variant details" actions={variant ? <Link className="outline-button" href={`/product-variants/${variant.id}/edit`}>Edit variant</Link> : undefined} /><div className="dashboard-content">{error ? <p className="form-error">{error}</p> : !variant ? <LoadingIndicator label="Loading variant" /> : <section className="panel product-detail"><div className="detail-heading"><div><p className="eyebrow">{variant.sku}</p><h2>{variant.product?.name}</h2><p className="muted">{variant.product?.code}</p></div></div><div className="detail-grid variant-detail-grid"><Detail label="Color" value={variant.color?.name} /><Detail label="Size" value={variant.size?.name} /><Detail label="SKU" value={variant.sku} /><Detail label="Price" value={Number(variant.price).toFixed(2)} /></div></section>}</div></main></div>; }
function Detail({ label, value }: { label: string; value?: string }) { return <div><span>{label}</span><strong>{value || "-"}</strong></div>; }
