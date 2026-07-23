import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import SessionExpiredModal from './components/SessionExpiredModal';
import { clearSession, finishSessionCheck, setSession } from './store/authSlice';
import { apiFetch, SESSION_EXPIRED_EVENT } from './api';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, isChecking, expiresAt } = useSelector((state) => state.auth);
  const [showExpired, setShowExpired] = useState(false);

  useEffect(() => {
    const restoreSession = async () => {
      const storedExpiry = Number(localStorage.getItem('vekanSessionExpiresAt'));
      if (storedExpiry && storedExpiry <= Date.now()) {
        setShowExpired(true);
        dispatch(finishSessionCheck());
        return;
      }

      try {
        const response = await apiFetch('/api/auth/session', { sessionAware: false });
        if (!response.ok) {
          if (storedExpiry) setShowExpired(true);
          dispatch(finishSessionCheck());
          return;
        }
        const data = await response.json();
        localStorage.setItem('vekanSessionExpiresAt', String(data.expiresAt));
        dispatch(setSession({ ...data.user, expiresAt: data.expiresAt }));
      } catch {
        dispatch(finishSessionCheck());
      }
    };
    restoreSession();
  }, [dispatch]);

  useEffect(() => {
    const handleExpired = () => setShowExpired(true);
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
  }, []);

  useEffect(() => {
    if (!expiresAt) return undefined;
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) {
      setShowExpired(true);
      return undefined;
    }
    const timer = window.setTimeout(() => setShowExpired(true), remaining);
    return () => window.clearTimeout(timer);
  }, [expiresAt]);

  const confirmExpiry = async () => {
    await apiFetch('/api/auth/logout', { method: 'POST', sessionAware: false }).catch(() => {});
    localStorage.removeItem('vekanSessionExpiresAt');
    dispatch(clearSession());
    setShowExpired(false);
  };

  if (isChecking) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} 
        />
        <Route 
          path="/dashboard/*" 
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />} 
        />
      </Routes>
      {showExpired && <SessionExpiredModal onConfirm={confirmExpiry} />}
    </BrowserRouter>
  );
}

export default App;
