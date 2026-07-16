import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useSearchParams } from "react-router-dom";
import { KeyRound, ShieldCheck } from "lucide-react";
import { apiFetch } from "../api";
import { clearSession } from "../store/authSlice";

export default function AccountSetup() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useDispatch();
  const token = searchParams.get("token") || "";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!token) {
      setError("The account setup token is missing.");
      return;
    }
    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }
    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiFetch("/api/account/setup-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
        sessionAware: false,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Unable to set up account");
      localStorage.removeItem("vekanSessionExpiresAt");
      dispatch(clearSession());
      setComplete(true);
    } catch (setupError) {
      setError(setupError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="account-action-page">
      <section className="account-action-card">
        <span className="account-action-icon"><KeyRound size={25} /></span>
        <span className="eyebrow">Secure account setup</span>
        <h1>{complete ? "Account ready" : "Create your password"}</h1>
        {complete ? (
          <>
            <p>Your email is verified and your Vekan account is active.</p>
            <Link className="btn-primary account-action-link" to="/">Continue to login</Link>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <p>Choose a password to verify your email and activate your account.</p>
            <label>
              <span>New password</span>
              <input className="input-field" type="password" minLength="8" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </label>
            <label>
              <span>Confirm password</span>
              <input className="input-field" type="password" minLength="8" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
            </label>
            {error && <div className="notice notice-error">{error}</div>}
            <button className="btn-primary" type="submit" disabled={isSubmitting}>
              <ShieldCheck size={17} /> {isSubmitting ? "Activating..." : "Activate account"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
