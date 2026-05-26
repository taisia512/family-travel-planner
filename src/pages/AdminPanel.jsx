import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Sidebar from '../components/Sidebar';
import '../styles/Form.css';
import { API_BASE_URL } from '../config/api';
import { apiFetch } from '../utils/api';

function AdminPanel() {
  const navigate = useNavigate();
  const savedUser = JSON.parse(localStorage.getItem('user'));
  const isAdmin = savedUser?.role === 'admin';

  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [observationList, setObservationList] = useState([]);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }

    const fetchLogs = async () => {
      try {
        const logsRes = await apiFetch(`${API_BASE_URL}/api/admin/activity`);

        if (!logsRes.ok) {
          console.error('Failed to fetch activity logs. Status:', logsRes.status);
          setLogs([]);
          return;
        }

        const logsData = await logsRes.json();
        setLogs(Array.isArray(logsData) ? logsData : []);
      } catch (err) {
        console.error('Failed to fetch activity logs:', err);
        setLogs([]);
      }
    };

    const fetchObservationList = async () => {
      try {
        const obsRes = await apiFetch(`${API_BASE_URL}/api/admin/observation-list`);

        if (!obsRes.ok) {
          console.error('Failed to fetch observation list. Status:', obsRes.status);
          setObservationList([]);
          return;
        }

        const obsData = await obsRes.json();
        setObservationList(Array.isArray(obsData) ? obsData : []);
      } catch (err) {
        console.error('Failed to fetch observation list:', err);
        setObservationList([]);
      }
    };

    const fetchData = async () => {
      try {
        const usersRes = await apiFetch(`${API_BASE_URL}/api/admin/users`);

        if (!usersRes.ok) {
          console.error('Failed to fetch admin users. Status:', usersRes.status);
          setUsers([]);
          return;
        }

        const usersData = await usersRes.json();
        setUsers(Array.isArray(usersData) ? usersData : []);

        await fetchLogs();
        await fetchObservationList();
      } catch (err) {
        console.error('Failed to fetch admin data:', err);
        setUsers([]);
      }
    };

    fetchData();

    const socket = io(API_BASE_URL);

    socket.on('activityLogged', () => {
      fetchLogs();
      fetchObservationList();
    });

    return () => socket.disconnect();
  }, [isAdmin, navigate]);

  if (!isAdmin) return null;

  return (
    <div className="form-layout">
      <Sidebar />
      <main className="form-main">
        <div className="form-container" style={{ maxWidth: '1100px', width: '90%' }}>
          <h1 className="form-title">Admin Management Panel</h1>

          <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', flexWrap: 'wrap' }}>
            <button
              className={`btn ${activeTab === 'users' ? 'confirm-btn' : 'cancel-btn'}`}
              onClick={() => setActiveTab('users')}
            >
              Users & Permissions
            </button>

            <button
              className={`btn ${activeTab === 'logs' ? 'confirm-btn' : 'cancel-btn'}`}
              onClick={() => setActiveTab('logs')}
            >
              Activity Logs
            </button>

            <button
              className={`btn ${activeTab === 'observation' ? 'confirm-btn' : 'cancel-btn'}`}
              onClick={() => setActiveTab('observation')}
            >
              Observation List
            </button>
          </div>

          {activeTab === 'users' && (
            <div>
              <h2 className="trip-extra-title">All Platform Users</h2>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#212529', color: '#fff', textAlign: 'left' }}>
                    <th style={{ padding: '12px' }}>ID</th>
                    <th style={{ padding: '12px' }}>Name</th>
                    <th style={{ padding: '12px' }}>Email</th>
                    <th style={{ padding: '12px' }}>Role</th>
                    <th style={{ padding: '12px' }}>Permissions</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '12px' }}>{u.id}</td>
                      <td style={{ padding: '12px' }}>{u.fullName}</td>
                      <td style={{ padding: '12px' }}>{u.email}</td>
                      <td
                        style={{
                          padding: '12px',
                          fontWeight: 'bold',
                          color: u.Role?.name === 'admin' ? '#0d6efd' : '#212529'
                        }}
                      >
                        {u.Role?.name?.toUpperCase()}
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                          {u.Role?.Permissions?.map((p) => (
                            <span
                              key={p.id}
                              style={{
                                backgroundColor: '#e9ecef',
                                padding: '3px 8px',
                                borderRadius: '4px'
                              }}
                            >
                              {p.name}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'logs' && (
            <div>
              <h2 className="trip-extra-title">System Activity Logs</h2>

              <div
                style={{
                  maxHeight: '600px',
                  overflowY: 'auto',
                  marginTop: '20px',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  padding: '10px'
                }}
              >
                {logs.length === 0 ? (
                  <p style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
                    No activity recorded yet.
                  </p>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      style={{
                        padding: '15px',
                        borderBottom: '1px solid #f8f9fa',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '5px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', color: '#0d6efd' }}>{log.action}</span>
                        <span style={{ fontSize: '12px', color: '#6c757d' }}>
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <div style={{ color: '#212529' }}>{log.details}</div>

                      <div style={{ fontSize: '12px', color: '#adb5bd' }}>
                        User: {log.userEmail || log.User?.email || 'Unknown'} | Role:{' '}
                        {log.userRole || 'unknown'} | ID: {log.userId}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'observation' && (
            <div>
              <h2 className="trip-extra-title">Observation List</h2>

              <p style={{ color: '#6c757d', marginBottom: '20px' }}>
                Users appear here when suspicious behavior is detected, such as many delete actions or many CRUD
                actions in a short time.
              </p>

              {observationList.length === 0 ? (
                <div
                  style={{
                    border: '1px dashed #cfcfcf',
                    borderRadius: '16px',
                    padding: '20px',
                    color: '#777',
                    background: '#fafafa',
                    textAlign: 'center'
                  }}
                >
                  No suspicious users detected yet.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#7f1d1d', color: '#fff', textAlign: 'left' }}>
                      <th style={{ padding: '12px' }}>User</th>
                      <th style={{ padding: '12px' }}>Role</th>
                      <th style={{ padding: '12px' }}>Reason</th>
                      <th style={{ padding: '12px' }}>Count</th>
                      <th style={{ padding: '12px' }}>Status</th>
                      <th style={{ padding: '12px' }}>Last Detected</th>
                    </tr>
                  </thead>

                  <tbody>
                    {observationList.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                        <td style={{ padding: '12px' }}>{item.userEmail || item.User?.email}</td>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.userRole}</td>
                        <td style={{ padding: '12px' }}>{item.reason}</td>
                        <td style={{ padding: '12px' }}>{item.suspiciousActionCount}</td>
                        <td style={{ padding: '12px', color: '#b91c1c', fontWeight: 'bold' }}>
                          {item.status}
                        </td>
                        <td style={{ padding: '12px' }}>{new Date(item.updatedAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminPanel;