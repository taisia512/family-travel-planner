import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import '../styles/Sidebar.css';
import '../styles/LandingPage.css';
import logoPin from '../assets/logo-pin.png';

import { LuLayoutDashboard } from 'react-icons/lu';
import { HiOutlineChartBar } from 'react-icons/hi';
import {
  FiUser,
  FiSettings,
  FiLogOut,
  FiMessageCircle,
  FiShield
} from 'react-icons/fi';

import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';

function Sidebar() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const savedUser = JSON.parse(localStorage.getItem('user'));
  const isAdmin = savedUser?.role === 'admin';

  const chatContext = useChat();
  const totalUnread = chatContext ? chatContext.totalUnread : 0;

  const handleLogout = () => {
    logout();
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-inner">

        <div className="landing-logo sidebar-logo-fix">
          <div className="logo-top">
            <span className="logo-text">Fam</span>

            <img
              src={logoPin}
              alt="logo pin"
              className="logo-pin-image"
            />

            <span className="logo-text">ly</span>
          </div>

          <div className="logo-bottom">
            Travel
          </div>
        </div>

        <nav className="sidebar-nav">

          {/* DASHBOARD */}
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : 'inactive'}`
            }
          >
            <span className="nav-icon">
              <LuLayoutDashboard />
            </span>

            <span className="nav-label">
              Dashboard
            </span>
          </NavLink>

          {/* EXPLORE */}
          <NavLink
            to="/explore"
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : 'inactive'}`
            }
          >
            <span className="nav-icon">
              <HiOutlineChartBar />
            </span>

            <span className="nav-label">
              Explore
            </span>
          </NavLink>

          {/* CHAT */}
          <NavLink
            to="/chat"
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : 'inactive'}`
            }
          >
            <span
              className="nav-icon"
              style={{ position: 'relative' }}
            >
              <FiMessageCircle />

              {totalUnread > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    fontSize: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold'
                  }}
                >
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              )}
            </span>

            <span className="nav-label">
              Chat
            </span>
          </NavLink>

          {/* PROFILE */}
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : 'inactive'}`
            }
          >
            <span className="nav-icon">
              <FiUser />
            </span>

            <span className="nav-label">
              Profile
            </span>
          </NavLink>

          {/* SETTINGS */}
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : 'inactive'}`
            }
          >
            <span className="nav-icon">
              <FiSettings />
            </span>

            <span className="nav-label">
              Settings
            </span>
          </NavLink>

          {/* ADMIN */}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : 'inactive'}`
              }
            >
              <span className="nav-icon">
                <FiShield />
              </span>

              <span className="nav-label">
                Admin Panel
              </span>
            </NavLink>
          )}

        </nav>

        {/* LOGOUT */}
        <button
          className="logout-btn"
          onClick={handleLogout}
        >
          <span className="logout-icon">
            <FiLogOut />
          </span>

          <span className="logout-label">
            Log out
          </span>
        </button>

      </div>
    </aside>
  );
}

export default Sidebar;