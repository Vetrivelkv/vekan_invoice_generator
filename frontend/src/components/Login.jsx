import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { ArrowRight, Droplets, Flame, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { setSession } from '../store/authSlice';
import { apiFetch } from '../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useDispatch();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        sessionAware: false,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Unable to sign in');
      localStorage.setItem('vekanSessionExpiresAt', String(data.expiresAt));
      dispatch(setSession({ ...data.user, expiresAt: data.expiresAt }));
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-hero">
        <div className="hero-orbit hero-orbit-one"></div>
        <div className="hero-orbit hero-orbit-two"></div>
        <div className="brand-lockup brand-lockup-light">
          <span className="brand-mark"><Flame size={22} strokeWidth={2.4} /></span>
          <span><strong>Vekan Tech</strong><small>Fire & Safety Services</small></span>
        </div>

        <div className="login-hero-copy">
          <span className="hero-kicker"><ShieldCheck size={16} /> Protection operations</span>
          <h1>Safety work.<br /><em>Clearly documented.</em></h1>
          <p>Manage service invoices for fire sprinklers, hydrants and hose systems from one secure workspace.</p>
          <div className="hero-services">
            <span><Droplets size={16} /> Sprinkler systems</span>
            <span><ShieldCheck size={16} /> Hydrant service</span>
            <span><Flame size={16} /> Fire hose safety</span>
          </div>
        </div>

        <div className="hero-proof"><strong>Always ready.</strong><span>Built for teams that protect people and property.</span></div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <span className="eyebrow">Secure workspace</span>
          <h2>Welcome back</h2>
          <p className="login-intro">Sign in to continue to the Vekan operations dashboard.</p>
          <form onSubmit={handleSubmit} className="login-form">
            <label htmlFor="login-email">Email address</label>
            <div className="field-with-icon"><Mail size={18} /><input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="name@company.com" required /></div>
            <label htmlFor="login-password">Password</label>
            <div className="field-with-icon"><LockKeyhole size={18} /><input id="login-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="Enter your password" required /></div>
            {error && <div className="notice notice-error">{error}</div>}
            <button type="submit" className="login-submit" disabled={isSubmitting}>
              <span>{isSubmitting ? 'Signing in...' : 'Enter workspace'}</span><ArrowRight size={19} />
            </button>
          </form>
          <div className="login-security"><ShieldCheck size={17} /><span>Your session is protected with secure, HttpOnly authentication cookies.</span></div>
        </div>
      </section>
    </main>
  );
}
