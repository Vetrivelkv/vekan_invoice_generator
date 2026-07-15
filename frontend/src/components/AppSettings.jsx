import { useEffect, useState } from "react";
import { Hash, Save, Settings2 } from "lucide-react";
import { apiFetch } from "../api";

export default function AppSettings() {
  const [currentBillNumber, setCurrentBillNumber] = useState("");
  const [savedBillNumber, setSavedBillNumber] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await apiFetch("/api/settings/billing");
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Unable to load app settings");
        const value = data.settings.current_bill_number;
        setCurrentBillNumber(String(value));
        setSavedBillNumber(value);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  const numericValue = Number(currentBillNumber);
  const isValid = Number.isInteger(numericValue) && numericValue >= 0;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!isValid) {
      setError("Enter a whole number of zero or greater");
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiFetch("/api/settings/billing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_bill_number: numericValue }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Unable to update app settings");
      const value = data.settings.current_bill_number;
      setCurrentBillNumber(String(value));
      setSavedBillNumber(value);
      setMessage(`Bill numbering updated. The next invoice will be #${data.settings.next_bill_number}.`);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="glass-panel settings-panel">
      <div className="settings-heading">
        <span className="settings-icon"><Settings2 size={22} /></span>
        <div>
          <span className="eyebrow">Application controls</span>
          <h2>App settings</h2>
          <p>Manage the invoice sequence used across Vekan.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="settings-loading">Loading settings...</div>
      ) : (
        <form className="settings-form" onSubmit={handleSubmit}>
          <label htmlFor="current-bill-number">Current bill number</label>
          <p className="settings-help">
            Enter the most recently issued bill number. New invoices will start from the following number.
          </p>
          <div className="settings-number-field">
            <Hash size={20} />
            <input
              id="current-bill-number"
              type="number"
              min="0"
              step="1"
              value={currentBillNumber}
              onChange={(event) => setCurrentBillNumber(event.target.value)}
              required
            />
          </div>

          <div className="bill-number-preview">
            <span>Next invoice number</span>
            <strong>#{isValid ? numericValue + 1 : "—"}</strong>
          </div>

          {error && <div className="notice notice-error">{error}</div>}
          {message && <div className="notice notice-success">{message}</div>}

          <button
            className="btn-primary"
            type="submit"
            disabled={isSaving || !isValid || numericValue === savedBillNumber}
          >
            <Save size={17} />
            {isSaving ? "Saving..." : "Save bill number"}
          </button>
        </form>
      )}
    </div>
  );
}
