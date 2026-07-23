import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  Pencil,
  Plus,
  Save,
  UserRound,
  X,
} from "lucide-react";
import { apiFetch } from "../api";

const roles = ["super_admin", "admin", "user"];
const emptyForm = {
  id: null,
  full_name: "",
  email: "",
  role: "user",
  active: true,
  password: "",
};

const roleLabel = (role) => role
  .split("_")
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(" ");

export default function Users() {
  const { user: currentUser, isSuperAdmin } = useSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadUsers = async () => {
    const response = await apiFetch("/api/users");
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Unable to load users");
    setUsers(data.users || []);
  };

  useEffect(() => {
    loadUsers()
      .catch((loadError) => setError(loadError.message))
      .finally(() => setIsLoading(false));
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setError("");
  };

  const editUser = (user) => {
    setForm({
      id: user.id,
      full_name: user.full_name || "",
      email: user.email,
      role: user.role,
      active: user.active,
      password: "",
    });
    setError("");
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSaving(true);
    try {
      const isEditing = Boolean(form.id);
      const response = await apiFetch(
        isEditing ? `/api/users/${form.id}` : "/api/users",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Unable to save user");
      await loadUsers();
      resetForm();
      setMessage(isEditing ? "User updated successfully." : "User created successfully.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const editingSelf = form.id === currentUser.id;

  return (
    <div className="glass-panel users-panel">
      <div className="users-heading">
        <div>
          <span className="eyebrow">Access management</span>
          <h2>Users</h2>
          <p>
            {isSuperAdmin
              ? "Create users, manage identities and control application roles."
              : "View users registered in Vekan and their current access."}
          </p>
        </div>
        {isSuperAdmin && !form.id && (
          <button className="btn-primary" type="button" onClick={() => setForm({ ...emptyForm })}>
            <Plus size={17} /> Add user
          </button>
        )}
      </div>

      {isSuperAdmin && (form.id || form !== emptyForm) && (
        <form className="user-editor" onSubmit={handleSubmit}>
          <div className="user-editor-title">
            <div>
              <strong>{form.id ? "Edit user" : "Create user"}</strong>
              <span>{form.id ? "Update account details or set a new password." : "Set the user's initial login password."}</span>
            </div>
            <button className="user-editor-close" type="button" onClick={resetForm} aria-label="Close user editor">
              <X size={18} />
            </button>
          </div>

          <div className="user-form-grid">
            <label>
              <span>Full name</span>
              <input
                className="input-field"
                value={form.full_name}
                onChange={(event) => setForm({ ...form, full_name: event.target.value })}
                required
              />
            </label>
            <label>
              <span>Email address</span>
              <input
                className="input-field"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                required
              />
            </label>
            <label>
              <span>Role</span>
              <select
                className="input-field"
                value={form.role}
                onChange={(event) => setForm({ ...form, role: event.target.value })}
                disabled={editingSelf}
              >
                {roles.map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}
              </select>
              {editingSelf && <small>Your own role can only be changed by another super admin.</small>}
            </label>
            <label>
              <span>{form.id ? "New password (optional)" : "Initial password"}</span>
              <input
                className="input-field"
                type="password"
                minLength="8"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required={!form.id}
                autoComplete="new-password"
              />
              <small>
                {form.id
                  ? "Leave blank to keep the current password."
                  : "Use at least 8 characters and share it securely with the user."}
              </small>
            </label>
            <label className="active-control">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) => setForm({ ...form, active: event.target.checked })}
                disabled={editingSelf}
              />
              <span>Account active</span>
            </label>
          </div>

          <button className="btn-primary" type="submit" disabled={isSaving}>
            <Save size={17} /> {isSaving ? "Saving..." : "Save user"}
          </button>
        </form>
      )}

      {error && <div className="notice notice-error users-notice">{error}</div>}
      {message && <div className="notice notice-success users-notice">{message}</div>}
      {isLoading && <div className="settings-loading">Loading users...</div>}

      {!isLoading && (
        <div className="user-list">
          {users.map((user) => (
            <article className="user-card" key={user.id}>
              <span className="user-card-avatar"><UserRound size={20} /></span>
              <div className="user-card-identity">
                <strong>{user.full_name}</strong>
                <span>{user.email}</span>
                {!user.has_password && <small>Password not set</small>}
              </div>
              <div className="user-card-badges">
                <span className="role-badge">{roleLabel(user.role)}</span>
                {!user.active && <span className="status-badge status-disabled">Inactive</span>}
              </div>
              {isSuperAdmin && (
                <div className="user-card-actions">
                  <button className="action-button" type="button" onClick={() => editUser(user)}>
                    <Pencil size={14} /> Edit
                  </button>
                </div>
              )}
            </article>
          ))}
          {!users.length && <div className="empty-state">No users found.</div>}
        </div>
      )}
    </div>
  );
}
