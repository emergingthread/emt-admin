"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Header from "@/app/components/Header";
import LoadingIndicator from "@/app/components/LoadingIndicator";
import Sidebar from "@/app/components/Sidebar";
import ProductForm, { type Product } from "@/app/products/ProductForm";
import { fetchJson } from "@/lib/fetch";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) { const [product, setProduct] = useState<Product | null>(null); const [error, setError] = useState(""); useEffect(() => { params.then(({ id }) => fetchJson<Product>(`/api/products/${id}`).then(setProduct).catch((e) => setError(e.message))); }, [params]); return <div className="dashboard-shell"><Sidebar /><main className="dashboard-main"><Header eyebrow="Catalog" title="Product details" actions={product ? <Link className="outline-button" href={`/products/${product.id}/edit`}>Edit product</Link> : undefined} /><div className="dashboard-content">{error ? <p className="form-error">{error}</p> : !product ? <LoadingIndicator label="Loading product" /> : <section className="panel product-detail"><div className="detail-heading"><div><p className="eyebrow">{product.code}</p><h2>{product.name}</h2><p className="muted">/{product.slug}</p></div><span className={`status-pill ${product.isActive ? "active" : "inactive"}`}>{product.isActive ? "Active" : "Inactive"}</span></div>{product.description && <p className="detail-description">{product.description}</p>}<div className="detail-grid"><Detail label="Category" value={product.category?.name} /><Detail label="Gender / Audience" value={product.gender?.name} /><Detail label="Collection" value={product.collection?.name} /><Detail label="Status" value={product.productStatus?.name} /></div><div className="detail-images">{product.images.map((image) => <img key={image.id || image.publicId} src={image.imageUrl} alt={image.altText || product.name} />)}</div></section>}</div></main></div>; }
function Detail({ label, value }: { label: string; value?: string | null }) { return <div><span>{label}</span><strong>{value || "-"}</strong></div>; }
