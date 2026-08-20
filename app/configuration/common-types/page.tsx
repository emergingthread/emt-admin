"use client";

import { FormEvent, useEffect, useState } from "react";
import Header from "@/app/components/Header";
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

  async function loadTypes() {
    setTypes(
      await fetch("/api/common-types").then((response) => response.json()),
    );
  }
  useEffect(() => {
    fetch("/api/common-types")
      .then((response) => response.json())
      .then(setTypes);
  }, []);

  const pageCount = Math.max(1, Math.ceil(types.length / pageSize));
  const visibleTypes = types.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);

  async function saveType(event: FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch(
      editingId ? `/api/common-types/${editingId}` : "/api/common-types",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      },
    );
    const data = await response.json();
    if (!response.ok) return setError(data.message);
    setName("");
    setEditingId(null);
    void loadTypes();
  }

  async function deleteType(id: number) {
    if (!window.confirm("Delete this common type and its masters?")) return;
    const response = await fetch(`/api/common-types/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const data = await response.json();
      return setError(data.message);
    }
    void loadTypes();
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
        <button type="submit" className="primary-button">
          {editingId ? "Save type" : "Add type"}
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
      <div className="configuration-list">
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
      </div>
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
