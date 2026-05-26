import React, { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Form.css';
import '../styles/LandingPage.css';
import logoPin from '../assets/logo-pin.png';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const rememberedUsers = useMemo(() => {
    return JSON.parse(localStorage.getItem('rememberedUsers') || '[]');
  }, []);

  const saveRememberedUser = () => {
    if (!rememberMe) return;

    const trimmedEmail = email.trim();

    if (!trimmedEmail) return;

    const existingUsers = JSON.parse(
      localStorage.getItem('rememberedUsers') || '[]'
    );

    if (!existingUsers.includes(trimmedEmail)) {
      localStorage.setItem(
        'rememberedUsers',
        JSON.stringify([...existingUsers, trimmedEmail])
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let valid = true;

    setEmailError('');
    setPasswordError('');

    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
      setEmailError('Invalid email format (example: ana@gmail.com)');
      valid = false;
    }

    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      valid = false;
    }

    if (!valid) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password })
      });

      if (!res.ok) {
        setPasswordError('Invalid email or password');
        return;
      }

      const data = await res.json();

      if (data.requiresVerification) {
        saveRememberedUser();

        navigate('/verify-login', {
          state: {
            loginCodeId: data.loginCodeId,
            email: data.email,
            demoCode: data.demoCode
          }
        });

        return;
      }

      saveRememberedUser();

      login(data.user, data.token);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setPasswordError('Server error');
    }
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
    <div className="login-page">
      <header className="login-header">
        <div className="landing-logo">
          <div className="logo-top">
            <span className="logo-text">Fam</span>

            <img
              src={logoPin}
              alt="logo pin"
              className="logo-pin-image"
            />

            <span className="logo-text">ly</span>
          </div>

          <div className="logo-bottom">Travel</div>
        </div>
      </header>

      <main className="login-main">
        <div className="login-card">
          <h1 className="login-title">Welcome back</h1>

          <p className="login-subtitle">
            Please enter your details
          </p>

          <form
            onSubmit={handleSubmit}
            className="login-form"
            autoComplete="off"
          >
            <div className="login-group">
              <label htmlFor="login-email">Email</label>

              <input
                id="login-email"
                type="email"
                list="remembered-users"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <datalist id="remembered-users">
                {rememberedUsers.map((savedEmail) => (
                  <option
                    key={savedEmail}
                    value={savedEmail}
                  />
                ))}
              </datalist>

              {emailError && (
                <p className="login-error">{emailError}</p>
              )}
            </div>

            <div className="login-group">
              <label htmlFor="login-password">Password</label>

              <input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {passwordError && (
                <p className="login-error">{passwordError}</p>
              )}
            </div>

            <div className="login-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />

                <span>Remember me</span>
              </label>

              <button
                type="button"
                className="forgot-password-btn"
                onClick={handleForgotPassword}
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              className="login-submit-btn"
            >
              Sign in
            </button>
          </form>

          <p className="login-footer-text">
            Don't have an account?{' '}
            <Link to="/signup" className="login-link">
              Sign up
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default Login;