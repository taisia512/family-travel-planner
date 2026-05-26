import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Form.css';
import '../styles/LandingPage.css';
import logoPin from '../assets/logo-pin.png';
import { API_BASE_URL } from '../config/api';

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [serverError, setServerError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    setEmailError('');
    setServerError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }

    if (!emailRegex.test(email)) {
      setEmailError('Invalid email format');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!res.ok) {
        setServerError('Could not generate password recovery code');
        return;
      }

      const data = await res.json();

      navigate('/reset-password', {
        state: {
          resetTokenId: data.resetTokenId,
          email: data.email || email,
          demoCode: data.demoCode
        }
      });
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
          <h1 className="login-title">Forgot password</h1>
          <p className="login-subtitle">Enter your email to generate a recovery code.</p>

          <form onSubmit={handleSubmit} className="login-form" autoComplete="off">
            <div className="login-group">
              <label>Email</label>
              <input
                id="forgot-email"
                type="text"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {emailError && <p className="login-error">{emailError}</p>}
              {serverError && <p className="login-error">{serverError}</p>}
            </div>

            <button type="submit" className="login-submit-btn">
              Generate recovery code
            </button>
          </form>

          <p className="login-footer-text">
            Remembered your password?{' '}
            <Link to="/login" className="login-link">
              Back to login
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default ForgotPassword;