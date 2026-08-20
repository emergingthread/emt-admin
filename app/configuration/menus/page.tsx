"use client";

import { FormEvent, useEffect, useState } from "react";
import Header from "@/app/components/Header";
import Pagination from "@/app/components/Pagination";
import Sidebar from "@/app/components/Sidebar";

type Menu = {
  id: number;
  name: string;
  route: string | null;
  path: string;
  icon: string;
  displayOrder: number;
  sortOrder: number;
  parentId: number | null;
  isActive: boolean;
};

export default function MenusPage() {
  const pageSize = 10;
  const [menus, setMenus] = useState<Menu[]>([]);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({
    name: "",
    path: "",
    icon: "◇",
    sortOrder: "0",
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function loadMenus() {
    setMenus(await fetch("/api/menus").then((response) => response.json()));
  }
  useEffect(() => {
    fetch("/api/menus")
      .then((response) => response.json())
      .then(setMenus);
  }, []);

  const pageCount = Math.max(1, Math.ceil(menus.length / pageSize));
  const visibleMenus = menus.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);
  async function saveMenu(event: FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch(
      editingId ? `/api/menus/${editingId}` : "/api/menus",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          route: form.path || null,
          displayOrder: Number(form.sortOrder),
          parentId: null,
        }),
      },
    );
    const data = await response.json();
    if (!response.ok) return setError(data.message);
    setForm({ name: "", path: "", icon: "◇", sortOrder: "0" });
    setEditingId(null);
    void loadMenus();
  }

  async function deleteMenu(id: number) {
    if (!window.confirm("Remove this menu from the sidebar?")) return;
    const response = await fetch(`/api/menus/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = await response.json();
      return setError(data.message);
    }
    void loadMenus();
  }

  return (
    <div className="dashboard-shell">
      <Sidebar />
      <main className="dashboard-main">
        <Header eyebrow="Configuration" title="Menus" />
        <div className="dashboard-content">
          <div className="section-heading">
            <div>
              <h2>Sidebar menus</h2>
              <p className="muted">
                Add navigation options that appear under Configuration.
              </p>
            </div>
          </div>
          <section className="panel configuration-panel">
            <form className="configuration-form menu-form" onSubmit={saveMenu}>
                <input
                  id="menu-name"
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder="Products"
                  required
                />
              
                <input
                  id="menu-route"
                  value={form.path}
                  onChange={(event) =>
                    setForm({ ...form, path: event.target.value })
                  }
                  placeholder="/route"
                  required
                />
                <input
                  id="menu-icon"
                  className="icon-input"
                  value={form.icon}
                  onChange={(event) =>
                    setForm({ ...form, icon: event.target.value })
                  }
                  placeholder="Icon Name"
                />
              
                <input
                  id="menu-order"
                  className="order-input"
                  type="number"
                  value={form.sortOrder}
                  onChange={(event) =>
                    setForm({ ...form, sortOrder: event.target.value })
                  }
                />
              <button type="submit" className="primary-button">
                {editingId ? "Save menu" : "Add menu"}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="outline-button"
                  onClick={() => {
                    setEditingId(null);
                    setForm({ name: "", path: "", icon: "◇", sortOrder: "0" });
                  }}
                >
                  Cancel
                </button>
              )}
            </form>
            {error && <p className="form-error">{error}</p>}
            <div className="configuration-list menu-table">
              <div className="menu-table-header" aria-hidden="true">
                <span>Icon</span>
                <span>Menu name</span>
                <span>Route</span>
                <span>Order</span>
                <span>Actions</span>
              </div>
              {visibleMenus.map((menu) => (
                <div className="configuration-row menu-table-row" key={menu.id}>
                  <span className="menu-table-icon">{menu.icon}</span>
                  <span className="menu-table-name">{menu.name}</span>
                  <span className="menu-table-route">{menu.path}</span>
                  <span className="menu-table-order">{menu.sortOrder}</span>
                  <div className="row-actions">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(menu.id);
                        setForm({
                          name: menu.name,
                          path: menu.path,
                          icon: menu.icon,
                          sortOrder: String(menu.sortOrder),
                        });
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => deleteMenu(menu.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {menus.length === 0 && (
                <p className="muted">No custom menus yet.</p>
              )}
            </div>
            <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
          </section>
        </div>
      </main>
    </div>
  );
}
