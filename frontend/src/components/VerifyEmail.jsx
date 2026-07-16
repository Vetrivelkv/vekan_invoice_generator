import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useSearchParams } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { apiFetch } from "../api";
import { clearSession } from "../store/authSlice";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useDispatch();
  const token = searchParams.get("token") || "";

  const verifyEmail = async () => {
    setError("");
    if (!token) {
      setError("The verification token is missing.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await apiFetch("/api/account/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
        sessionAware: false,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Unable to verify email");
      localStorage.removeItem("vekanSessionExpiresAt");
      dispatch(clearSession());
      setComplete(true);
    } catch (verificationError) {
      setError(verificationError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="account-action-page">
      <section className="account-action-card">
        <span className="account-action-icon"><MailCheck size={25} /></span>
        <span className="eyebrow">Email verification</span>
        <h1>{complete ? "Email verified" : "Confirm your new email"}</h1>
        {complete ? (
          <>
            <p>Your new email address is now associated with your Vekan account. Sign in again using the new address.</p>
            <Link className="btn-primary account-action-link" to="/">Continue to login</Link>
          </>
        ) : (
          <>
            <p>Confirm this email address before it replaces the current account email.</p>
            {error && <div className="notice notice-error">{error}</div>}
            <button className="btn-primary" type="button" onClick={verifyEmail} disabled={isSubmitting}>
              <MailCheck size={17} /> {isSubmitting ? "Verifying..." : "Verify email address"}
            </button>
          </>
        )}
      </section>
    </main>
  );
}
