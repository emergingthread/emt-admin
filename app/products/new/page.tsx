"use client";

import Header from "@/app/components/Header";
import Sidebar from "@/app/components/Sidebar";
import ProductForm from "@/app/products/ProductForm";

export default function NewProductPage() { return <div className="dashboard-shell"><Sidebar /><main className="dashboard-main"><Header eyebrow="Catalog" title="New product" /><div className="dashboard-content"><div className="section-heading"><div><h2>Create product</h2><p className="muted">Add a catalog item and its merchandising details.</p></div></div><ProductForm /></div></main></div>; }
