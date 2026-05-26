import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export function AuthProvider({ children }) {
  const navigate = useNavigate();

  // Initialize state from localStorage so it survives page refreshes
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const inactivityTimer = useRef(null);

  // -------------------------------------------------------------------------
  // logout – clears state, storage, and redirects to /login
  // -------------------------------------------------------------------------
  const logout = useCallback(() => {
  setToken(null);
  setUser(null);

  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('unreadCounts');
  localStorage.removeItem('family_travel_pending_actions');

  sessionStorage.clear();

  if (inactivityTimer.current) {
    clearTimeout(inactivityTimer.current);
  }

  navigate('/login');
}, [navigate]);

  // -------------------------------------------------------------------------
  // login – persists token + user, resets inactivity timer
  // -------------------------------------------------------------------------
  const login = useCallback((userData, jwtToken) => {
    setToken(jwtToken);
    setUser(userData);
    localStorage.setItem('token', jwtToken);
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  // -------------------------------------------------------------------------
  // Inactivity timer – resets on any user activity
  // -------------------------------------------------------------------------
  const resetInactivityTimer = useCallback(() => {
    if (!token) return; // only track when logged in
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      console.warn('Session expired due to inactivity. Logging out.');
      logout();
    }, INACTIVITY_TIMEOUT_MS);
  }, [token, logout]);

  useEffect(() => {
    if (!token) return;

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, resetInactivityTimer));
    resetInactivityTimer(); // start the timer immediately on mount / login

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetInactivityTimer));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [token, resetInactivityTimer]);

  const value = { token, user, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Convenience hook */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
