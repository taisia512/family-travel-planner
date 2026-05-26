import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import '../styles/Form.css';
import '../styles/LandingPage.css';
import logoPin from '../assets/logo-pin.png';
import { API_BASE_URL } from '../config/api';

function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const resetTokenId = location.state?.resetTokenId;
  const email = location.state?.email;
  const demoCode = location.state?.demoCode;

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [codeError, setCodeError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    setCodeError('');
    setPasswordError('');
    setServerError('');
    setSuccess('');

    if (!resetTokenId) {
      setServerError('Missing reset session. Please request a new recovery code.');
      return;
    }

    if (!code.trim()) {
      setCodeError('Recovery code is required');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    if (!/[a-zA-Z]/.test(newPassword)) {
      setPasswordError('Password must contain at least one letter');
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      setPasswordError('Password must contain at least one number');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetTokenId, code, newPassword })
      });

      if (!res.ok) {
        setServerError('Invalid or expired recovery code');
        return;
      }

      setSuccess('Password reset successfully. Redirecting to login...');

      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      console.error(err);
      setServerError('Server error');
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
          <h1 className="login-title">Reset password</h1>
          <p className="login-subtitle">
            Enter the recovery code generated for {email || 'your account'}.
          </p>

          {demoCode && (
            <p className="reset-message">
              Demo recovery code: <strong>{demoCode}</strong>
            </p>
          )}

          <form onSubmit={handleSubmit} className="login-form" autoComplete="off">
            <div className="login-group">
              <label>Recovery code</label>
              <input
                id="reset-code"
                type="text"
                placeholder="Enter recovery code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              {codeError && <p className="login-error">{codeError}</p>}
            </div>

            <div className="login-group">
              <label>New password</label>
              <input
                id="reset-password"
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="login-group">
              <label>Confirm new password</label>
              <input
                id="reset-confirm-password"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {passwordError && <p className="login-error">{passwordError}</p>}
              {serverError && <p className="login-error">{serverError}</p>}
              {success && <p className="reset-message">{success}</p>}
            </div>

            <button type="submit" className="login-submit-btn">
              Reset password
            </button>
          </form>

          <p className="login-footer-text">
            Back to{' '}
            <Link to="/login" className="login-link">
              login
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default ResetPassword;