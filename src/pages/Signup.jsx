import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Form.css';
import '../styles/LandingPage.css';
import logoPin from '../assets/logo-pin.png';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';

function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [fullNameError, setFullNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [serverError, setServerError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    let valid = true;

    setFullNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setServerError('');

    if (!fullName.trim()) {
      setFullNameError('Full name is required');
      valid = false;
    } else if (fullName.trim().length < 3) {
      setFullNameError('Full name must have at least 3 characters');
      valid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      setEmailError('Invalid email format (example: ana@gmail.com)');
      valid = false;
    } else {
      const domain = email.split('@')[1];
      const allowedDomains = ['gmail.com', 'yahoo.com', 'outlook.com'];

      if (!allowedDomains.includes(domain)) {
        setEmailError('Email must be gmail.com, yahoo.com or outlook.com');
        valid = false;
      }
    }

    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      valid = false;
    } else if (!/[a-zA-Z]/.test(password)) {
      setPasswordError('Password must contain at least one letter');
      valid = false;
    } else if (!/[0-9]/.test(password)) {
      setPasswordError('Password must contain at least one number');
      valid = false;
    }

    if (!confirmPassword.trim()) {
      setConfirmPasswordError('Please confirm your password');
      valid = false;
    } else if (confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match');
      valid = false;
    }

    if (!valid) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password })
      });

      if (res.status === 409) {
        setServerError('An account with this email already exists');
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setServerError(data.error || 'Registration failed. Please try again.');
        return;
      }

      // Server returns { token, user }
      const { token, user } = await res.json();

      // 🔥 persist token + user via AuthContext
      login(user, token);

      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setServerError('Server error. Please try again.');
    }
  };

  return (
    <div className="signup-page">
      <header className="signup-header">
        <div className="landing-logo">
          <div className="logo-top">
            <span className="logo-text">Fam</span>
            <img src={logoPin} alt="logo pin" className="logo-pin-image" />
            <span className="logo-text">ly</span>
          </div>
          <div className="logo-bottom">Travel</div>
        </div>
      </header>

      <main className="signup-main">
        <div className="signup-card">
          <h1 className="signup-title">Create account</h1>
          <p className="signup-subtitle">Please fill in your details</p>

          <form onSubmit={handleSubmit} className="signup-form" autoComplete="off">
            <div className="signup-group">
              <label>Full name</label>
              <input
                id="signup-fullname"
                type="text"
                name="signup-fullname"
                autoComplete="off"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              {fullNameError && <p className="login-error">{fullNameError}</p>}
            </div>

            <div className="signup-group">
              <label>Email</label>
              <input
                id="signup-email"
                type="text"
                name="signup-email"
                autoComplete="off"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {emailError && <p className="login-error">{emailError}</p>}
            </div>

            <div className="signup-group">
              <label>Password</label>
              <input
                id="signup-password"
                type="password"
                name="signup-password"
                autoComplete="new-password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {passwordError && <p className="login-error">{passwordError}</p>}
            </div>

            <div className="signup-group">
              <label>Confirm password</label>
              <input
                id="signup-confirm-password"
                type="password"
                name="signup-confirm-password"
                autoComplete="new-password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {confirmPasswordError && (
                <p className="login-error">{confirmPasswordError}</p>
              )}
            </div>

            {serverError && <p className="login-error">{serverError}</p>}

            <button type="submit" className="signup-submit-btn">
              Create account
            </button>
          </form>

          <p className="signup-footer-text">
            Already have an account?{' '}
            <Link to="/login" className="signup-link">
              Log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default Signup;
