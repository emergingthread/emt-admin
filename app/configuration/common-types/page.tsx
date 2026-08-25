"use client";

import { FormEvent, useEffect, useState } from "react";
import Header from "@/app/components/Header";
import LoadingIndicator from "@/app/components/LoadingIndicator";
import Pagination from "@/app/components/Pagination";
import Sidebar from "@/app/components/Sidebar";

type CommonType = { id: number; name: string };

export default function CommonTypesPage() {
  const pageSize = 10;
  const [types, setTypes] = useState<CommonType[]>([]);
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  async function loadTypes() {
    setIsLoading(true);
    try { setTypes(await fetch("/api/common-types").then((response) => response.json())); } finally { setIsLoading(false); }
  }
  useEffect(() => {
    fetch("/api/common-types")
      .then((response) => response.json())
      .then(setTypes)
      .finally(() => setIsLoading(false));
  }, []);

  const pageCount = Math.max(1, Math.ceil(types.length / pageSize));
  const visibleTypes = types.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);

  async function saveType(event: FormEvent) {
    event.preventDefault();
    setError("");
    setIsSaving(true);
    const response = await fetch(
      editingId ? `/api/common-types/${editingId}` : "/api/common-types",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      },
    );
    const data = await response.json();
    if (!response.ok) { setError(data.message); setIsSaving(false); return; }
    setName("");
    setEditingId(null);
    void loadTypes();
    setIsSaving(false);
  }

  async function deleteType(id: number) {
    if (!window.confirm("Delete this common type and its masters?")) return;
    setIsSaving(true);
    const response = await fetch(`/api/common-types/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.message); setIsSaving(false); return;
    }
    void loadTypes();
    setIsSaving(false);
  }

  return (
    <ConfigurationPage
      title="Common types"
      description="Define the categories used by common masters."
    >
      <form className="configuration-form" onSubmit={saveType}>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Type name"
          aria-label="Type name"
          required
        />
        <button type="submit" className="primary-button" disabled={isSaving}>
          {isSaving ? "Saving..." : editingId ? "Save type" : "Add type"}
        </button>
        {editingId && (
          <button
            type="button"
            className="outline-button"
            onClick={() => {
              setEditingId(null);
              setName("");
            }}
          >
            Cancel
          </button>
        )}
      </form>
      {error && <p className="form-error">{error}</p>}
      <div className="configuration-list">{isLoading ? <LoadingIndicator label="Loading common types" /> : <>
        {visibleTypes.map((type) => (
          <div className="configuration-row" key={type.id}>
            <span className="row-number">{type.id}</span>
            <strong>{type.name}</strong>
            <div className="row-actions">
              <button
                type="button"
                onClick={() => {
                  setEditingId(type.id);
                  setName(type.name);
                }}
              >
                Edit
              </button>
              <button
                type="button"
                className="danger-button"
                onClick={() => deleteType(type.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {types.length === 0 && <p className="muted">No common types yet.</p>}
      </>}</div>
      <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
    </ConfigurationPage>
  );
}

function ConfigurationPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-shell">
      <Sidebar />
      <main className="dashboard-main">
        <Header eyebrow="Configuration" title={title} />
        <div className="dashboard-content">
          <div className="section-heading">
            <div>
              <h2>{title}</h2>
              <p className="muted">{description}</p>
            </div>
          </div>
          <section className="panel configuration-panel">{children}</section>
        </div>
      </main>
    </div>
  );
}
