"use client";

import { FormEvent, useEffect, useState } from "react";
import Header from "@/app/components/Header";
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

  async function loadData() {
    const [masterData, typeData] = await Promise.all([
      fetch("/api/common-masters").then((response) => response.json()),
      fetch("/api/common-types").then((response) => response.json()),
    ]);
    setMasters(masterData);
    setTypes(typeData);
  }
  useEffect(() => {
    Promise.all([
      fetch("/api/common-masters").then((response) => response.json()),
      fetch("/api/common-types").then((response) => response.json()),
    ]).then(([masterData, typeData]) => {
      setMasters(masterData);
      setTypes(typeData);
    });
  }, []);

  const pageCount = Math.max(1, Math.ceil(masters.length / pageSize));
  const visibleMasters = masters.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  async function saveMaster(event: FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch(
      editingId ? `/api/common-masters/${editingId}` : "/api/common-masters",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, commonTypeId: Number(commonTypeId) }),
      },
    );
    const data = await response.json();
    if (!response.ok) return setError(data.message);
    setName("");
    setCommonTypeId("");
    setEditingId(null);
    void loadData();
  }

  async function deleteMaster(id: number) {
    if (!window.confirm("Delete this common master?")) return;
    const response = await fetch(`/api/common-masters/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const data = await response.json();
      return setError(data.message);
    }
    void loadData();
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
              <button type="submit" className="primary-button">
                {editingId ? "Save master" : "Add master"}
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
            <div className="configuration-list">
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
            </div>
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
