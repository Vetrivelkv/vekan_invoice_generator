import { useEffect, useState } from "react";
import { apiFetch } from "../api";

const roleLabel = (role) => role
  .split("_")
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(" ");

export default function Users() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await apiFetch("/api/users");
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Unable to load users");
        setUsers(data.users || []);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadUsers();
  }, []);

  return (
    <div className="glass-panel" style={{ width: "100%", maxWidth: "900px", margin: "0 auto" }}>
      <h2 style={{ color: "var(--accent)", marginTop: 0 }}>Users</h2>
      <p style={{ color: "var(--text-muted)" }}>Users registered in Vekan and their assigned roles.</p>

      {error && <div style={{ color: "var(--error)" }}>{error}</div>}
      {isLoading && <div style={{ color: "var(--text-muted)" }}>Loading users...</div>}

      {!isLoading && !error && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                <th style={{ padding: "12px" }}>Email</th>
                <th style={{ padding: "12px" }}>Role</th>
                <th style={{ padding: "12px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px" }}>{user.email}</td>
                  <td style={{ padding: "12px" }}>{roleLabel(user.role)}</td>
                  <td style={{ padding: "12px", color: user.active ? "#22c55e" : "var(--error)" }}>
                    {user.active ? "Active" : "Inactive"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!users.length && <div style={{ color: "var(--text-muted)", padding: "16px 12px" }}>No users found.</div>}
        </div>
      )}
    </div>
  );
}
