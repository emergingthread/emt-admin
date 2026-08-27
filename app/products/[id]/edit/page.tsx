"use client";

import { useEffect, useState } from "react";
import Header from "@/app/components/Header";
import LoadingIndicator from "@/app/components/LoadingIndicator";
import Sidebar from "@/app/components/Sidebar";
import ProductForm, { type Product } from "@/app/products/ProductForm";
import { fetchJson } from "@/lib/fetch";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) { const [product, setProduct] = useState<Product | null>(null); const [error, setError] = useState(""); useEffect(() => { params.then(({ id }) => fetchJson<Product>(`/api/products/${id}`).then(setProduct).catch((e) => setError(e.message))); }, [params]); return <div className="dashboard-shell"><Sidebar /><main className="dashboard-main"><Header eyebrow="Catalog" title="Edit product" /><div className="dashboard-content">{error ? <p className="form-error">{error}</p> : product ? <ProductForm product={product} /> : <LoadingIndicator label="Loading product" />}</div></main></div>; }
