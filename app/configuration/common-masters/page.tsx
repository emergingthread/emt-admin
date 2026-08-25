"use client";

import { FormEvent, useEffect, useState } from "react";
import Header from "@/app/components/Header";
import LoadingIndicator from "@/app/components/LoadingIndicator";
import Pagination from "@/app/components/Pagination";
import Sidebar from "@/app/components/Sidebar";

type CommonType = { id: number; name: string };
type CommonMaster = {
  id: number;
  name: string;
  commonTypeId: number;
  commonTypeName: string;
};

export default function CommonMastersPage() {
  const pageSize = 10;
  const [masters, setMasters] = useState<CommonMaster[]>([]);
  const [page, setPage] = useState(1);
  const [types, setTypes] = useState<CommonType[]>([]);
  const [name, setName] = useState("");
  const [commonTypeId, setCommonTypeId] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  async function loadData() {
    const [masterData, typeData] = await Promise.all([
      fetch("/api/common-masters").then((response) => response.json()),
      fetch("/api/common-types").then((response) => response.json()),
    ]);
    setMasters(masterData); setTypes(typeData); setIsLoading(false);
  }
  useEffect(() => {
    Promise.all([
      fetch("/api/common-masters").then((response) => response.json()),
      fetch("/api/common-types").then((response) => response.json()),
    ]).then(([masterData, typeData]) => {
      setMasters(masterData);
      setTypes(typeData);
    }).finally(() => setIsLoading(false));
  }, []);

  const pageCount = Math.max(1, Math.ceil(masters.length / pageSize));
  const visibleMasters = masters.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  async function saveMaster(event: FormEvent) {
    event.preventDefault();
    setError("");
    setIsSaving(true);
    const response = await fetch(
      editingId ? `/api/common-masters/${editingId}` : "/api/common-masters",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, commonTypeId: Number(commonTypeId) }),
      },
    );
    const data = await response.json();
    if (!response.ok) { setError(data.message); setIsSaving(false); return; }
    setName("");
    setCommonTypeId("");
    setEditingId(null);
    void loadData();
    setIsSaving(false);
  }

  async function deleteMaster(id: number) {
    if (!window.confirm("Delete this common master?")) return;
    setIsSaving(true);
    const response = await fetch(`/api/common-masters/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.message); setIsSaving(false); return;
    }
    void loadData();
    setIsSaving(false);
  }

  return (
    <div className="dashboard-shell">
      <Sidebar />
      <main className="dashboard-main">
        <Header eyebrow="Configuration" title="Common masters" />
        <div className="dashboard-content">
          <div className="section-heading">
            <div>
              <h2>Common masters</h2>
              <p className="muted">
                Manage values assigned to each common type.
              </p>
            </div>
          </div>
          <section className="panel configuration-panel">
            <form className="configuration-form common-master-form" onSubmit={saveMaster}>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Master name"
                aria-label="Master name"
                required
              />
              <select
                value={commonTypeId}
                onChange={(event) => setCommonTypeId(event.target.value)}
                required
                aria-label="Common type"
              >
                <option value="">Select type</option>
                {types.map((type) => (
                  <option value={type.id} key={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              <button type="submit" className="primary-button" disabled={isSaving}>
                {isSaving ? "Saving..." : editingId ? "Save master" : "Add master"}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="outline-button"
                  onClick={() => {
                    setEditingId(null);
                    setName("");
                    setCommonTypeId("");
                  }}
                >
                  Cancel
                </button>
              )}
            </form>
            {error && <p className="form-error">{error}</p>}
            <div className="configuration-list">{isLoading ? <LoadingIndicator label="Loading common masters" /> : <>
              {visibleMasters.map((master) => (
                <div className="configuration-row" key={master.id}>
                  <span className="row-number">{master.id}</span>
                  <strong>{master.name}</strong>
                  <span className="type-pill">{master.commonTypeName}</span>
                  <div className="row-actions">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(master.id);
                        setName(master.name);
                        setCommonTypeId(String(master.commonTypeId));
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => deleteMaster(master.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {masters.length === 0 && (
                <p className="muted">No common masters yet.</p>
              )}
            </>}</div>
            <Pagination
              page={page}
              pageCount={pageCount}
              onPageChange={setPage}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
