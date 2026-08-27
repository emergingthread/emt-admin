"use client";

import { useEffect, useState } from "react";
import Header from "@/app/components/Header";
import LoadingIndicator from "@/app/components/LoadingIndicator";
import Sidebar from "@/app/components/Sidebar";
import ProductVariantForm, { type Variant } from "@/app/product-variants/ProductVariantForm";
import { fetchJson } from "@/lib/fetch";

export default function EditProductVariantPage({ params }: { params: Promise<{ id: string }> }) { const [variant, setVariant] = useState<Variant | null>(null); const [error, setError] = useState(""); useEffect(() => { params.then(({ id }) => fetchJson<Variant>(`/api/product-variants/${id}`).then(setVariant).catch((e) => setError(e.message))); }, [params]); return <div className="dashboard-shell"><Sidebar /><main className="dashboard-main"><Header eyebrow="Catalog" title="Edit product variant" /><div className="dashboard-content">{error ? <p className="form-error">{error}</p> : variant ? <ProductVariantForm variant={variant} /> : <LoadingIndicator label="Loading variant" />}</div></main></div>; }
