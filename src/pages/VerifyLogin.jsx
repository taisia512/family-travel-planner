import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import '../styles/Form.css';
import '../styles/LandingPage.css';
import logoPin from '../assets/logo-pin.png';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';

function VerifyLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const loginCodeId = location.state?.loginCodeId;
  const email = location.state?.email;
  const demoCode = location.state?.demoCode;

  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');

    if (!loginCodeId) {
      setError('Missing login verification session. Please login again.');
      return;
    }

    if (!code.trim()) {
      setError('Verification code is required');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginCodeId, code })
      });

      if (!res.ok) {
        setError('Invalid or expired verification code');
        return;
      }

      const { token, user } = await res.json();
      login(user, token);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Server error');
    }
  };

  return (
    <div className="login-page">
      <header className="login-header">
        <div className="landing-logo">
          <div className="logo-top">
            <span className="logo-text">Fam</span>
            <img src={logoPin} alt="logo pin" className="logo-pin-image" />
            <span className="logo-text">ly</span>
          </div>
          <div className="logo-bottom">Travel</div>
        </div>
      </header>

      <main className="login-main">
        <div className="login-card">
          <h1 className="login-title">Verify login</h1>
          <p className="login-subtitle">
            Enter the verification code generated for {email || 'your account'}.
          </p>

          {demoCode && (
            <p className="reset-message">
              Demo verification code: <strong>{demoCode}</strong>
            </p>
          )}

          <form onSubmit={handleVerify} className="login-form" autoComplete="off">
            <div className="login-group">
              <label>Verification code</label>
              <input
                id="login-code"
                type="text"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              {error && <p className="login-error">{error}</p>}
            </div>

            <button type="submit" className="login-submit-btn">
              Verify and sign in
            </button>
          </form>

          <p className="login-footer-text">
            Wrong account?{' '}
            <Link to="/login" className="login-link">
              Back to login
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default VerifyLogin;