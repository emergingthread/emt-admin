"use client";

import Header from "@/app/components/Header";
import Sidebar from "@/app/components/Sidebar";
import ProductVariantForm from "@/app/product-variants/ProductVariantForm";

export default function CreateProductVariantPage() { return <div className="dashboard-shell"><Sidebar /><main className="dashboard-main"><Header eyebrow="Catalog" title="New product variant" /><div className="dashboard-content"><div className="section-heading"><div><h2>Create product variant</h2><p className="muted">Add a color and one or more sizes to an existing product.</p></div></div><ProductVariantForm /></div></main></div>; }
