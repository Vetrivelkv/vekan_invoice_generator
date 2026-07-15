export default function SessionExpiredModal({ onConfirm }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(0, 0, 0, 0.65)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div role="dialog" aria-modal="true" aria-labelledby="session-expired-title" style={{
        width: '100%',
        maxWidth: '380px',
        borderRadius: '12px',
        background: '#ffffff',
        color: '#111827',
        padding: '28px',
        textAlign: 'center',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
      }}>
        <h2 id="session-expired-title" style={{ margin: '0 0 12px' }}>Session expired</h2>
        <p style={{ margin: '0 0 24px', color: '#4b5563', lineHeight: 1.5 }}>
          Your one-hour session has expired. Please sign in again to continue.
        </p>
        <button className="btn-primary" type="button" onClick={onConfirm}>Okay</button>
      </div>
    </div>
  );
}
