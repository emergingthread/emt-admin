"use client";

import { FormEvent, useEffect, useState } from "react";
import Header from "@/app/components/Header";
import LoadingIndicator from "@/app/components/LoadingIndicator";
import Pagination from "@/app/components/Pagination";
import Sidebar from "@/app/components/Sidebar";
import { fetchJson } from "@/lib/fetch";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

const defaultForm = {
  name: "",
  email: "",
  password: "",
  role: "Administrator",
};

export default function UsersPage() {
  const pageSize = 10;
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  async function loadUsers() {
    setIsLoading(true);
    try {
      const data = await fetchJson<User[]>("/api/users");
      setUsers(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load users");
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  const pageCount = Math.max(1, Math.ceil(users.length / pageSize));
  const visibleUsers = users.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  async function saveUser(event: FormEvent) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      await fetchJson(editingId ? `/api/users/${editingId}` : "/api/users", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          ...(editingId ? {} : { password: form.password }),
        }),
      });

      setForm(defaultForm);
      setEditingId(null);
      await loadUsers();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save user");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteUser(id: number) {
    if (!window.confirm("Delete this user?")) return;
    setIsSaving(true);

    try {
      await fetchJson(`/api/users/${id}`, { method: "DELETE" });
      await loadUsers();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete user");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="dashboard-shell">
      <Sidebar />
      <main className="dashboard-main">
        <Header eyebrow="Administration" title="Users" />
        <div className="dashboard-content">
          <div className="section-heading">
            <div>
              <h2>Users</h2>
              <p className="muted">Manage staff accounts and access roles.</p>
            </div>
          </div>
          <section className="panel configuration-panel">
            <form className="configuration-form user-form" onSubmit={saveUser}>
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Full name"
                aria-label="Full name"
                required
              />
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="Email address"
                aria-label="Email address"
                required
              />
              {!editingId && (
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  placeholder="Password"
                  aria-label="Password"
                  minLength={8}
                  required
                />
              )}
              <select
                value={form.role}
                onChange={(event) => setForm({ ...form, role: event.target.value })}
                aria-label="Role"
              >
                <option value="Administrator">Administrator</option>
                <option value="Manager">Manager</option>
                <option value="Staff">Staff</option>
              </select>
              <button type="submit" className="primary-button" disabled={isSaving}>
                {isSaving ? "Saving..." : editingId ? "Save user" : "Add user"}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="outline-button"
                  onClick={() => {
                    setEditingId(null);
                    setForm(defaultForm);
                  }}
                >
                  Cancel
                </button>
              )}
            </form>
            {error && <p className="form-error">{error}</p>}
            <div className="configuration-list user-table">
              {isLoading ? (
                <LoadingIndicator label="Loading users" />
              ) : (
                <>
                  <div className="user-table-header" aria-hidden="true">
                    <span>ID</span>
                    <span>Name</span>
                    <span>Email</span>
                    <span>Role</span>
                    <span>Actions</span>
                  </div>
                  {visibleUsers.map((user) => (
                    <div className="configuration-row user-table-row" key={user.id}>
                      <span className="row-number">{user.id}</span>
                      <strong>{user.name}</strong>
                      <span className="user-table-email">{user.email}</span>
                      <span className="user-table-role">{user.role}</span>
                      <div className="row-actions">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(user.id);
                            setForm({
                              name: user.name,
                              email: user.email,
                              password: "",
                              role: user.role,
                            });
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="danger-button"
                          onClick={() => deleteUser(user.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {users.length === 0 && <p className="muted">No users yet.</p>}
                </>
              )}
            </div>
            <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
          </section>
        </div>
      </main>
    </div>
  );
}
