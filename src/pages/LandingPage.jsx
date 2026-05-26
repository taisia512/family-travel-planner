import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LandingPage.css';
import skyImage from '../assets/sky.png';
import logoPin from '../assets/logo-pin.png';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-logo">
          <div className="logo-top">
            <span className="logo-text">Fam</span>
            <img src={logoPin} alt="logo pin" className="logo-pin-image" />
            <span className="logo-text">ly</span>
          </div>
          <div className="logo-bottom">Travel</div>
        </div>

        <div className="header-buttons">
          <button className="header-btn" onClick={() => navigate('/login')}>
            Log in
          </button>
          <button className="header-btn" onClick={() => navigate('/signup')}>
            Sign up
          </button>
        </div>
      </header>

      <main className="landing-main">
        <h1 className="landing-title">Family Travel Planner</h1>
        <p className="landing-tagline">Plan your family trips easily</p>

        <button className="start-btn" onClick={() => navigate('/login')}>
          Start planning
        </button>

        <div className="landing-visual">
          <div className="green-back-shape left"></div>
          <div className="green-back-shape right"></div>

          <div className="device-mockup">
            <img src={skyImage} alt="Sky background" className="device-bg" />

            <div className="device-overlay">
              <div className="screen-top-text">
                <p>Organize destinations, activities and expenses</p>
                <p>for your family trips in one place.</p>
              </div>

              <div className="screen-line"></div>

              <div className="chart-labels">
                <span>May</span>
                <span>Jul</span>
                <span>Sep</span>
                <span>Nov</span>
                <span>Dec</span>
              </div>

              <div className="chart-bars">
                <div className="chart-stick h1"><span className="chart-dot"></span></div>
                <div className="chart-stick h2"><span className="chart-dot"></span></div>
                <div className="chart-stick h3"><span className="chart-dot"></span></div>
                <div className="chart-stick h4"><span className="chart-dot"></span></div>
                <div className="chart-stick h5"><span className="chart-dot"></span></div>
                <div className="chart-stick h6"><span className="chart-dot"></span></div>
                <div className="chart-stick h7"><span className="chart-dot"></span></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default LandingPage;
