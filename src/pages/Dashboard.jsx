import React, { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TripCard from '../components/TripCard';
import DeleteModal from '../components/DeleteModal';
import '../styles/Dashboard.css';
import { API_BASE_URL } from '../config/api';
function Dashboard({ trips, setTrips, onDeleteTrip, isOnline }) {
  const navigate = useNavigate();

  const savedUser = JSON.parse(localStorage.getItem('user'));
  const permissions = savedUser?.permissions || [];

  const canCreateTrip = permissions.includes('CREATE_TRIP');
  const canUpdateTrip = permissions.includes('UPDATE_TRIP');
  const canDeleteTrip = permissions.includes('DELETE_TRIP');

  const [searchInput, setSearchInput] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [visibleCount, setVisibleCount] = useState(3);
  const loaderRef = useRef(null);

  const [searchHistory, setSearchHistory] = useState(() => {
    const saved = localStorage.getItem('dashboardSearchHistory');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const socket = io(API_BASE_URL);

    socket.on('newTrip', (trip) => {
      setTrips((prevTrips) => {
        const alreadyExists = prevTrips.some((existingTrip) => existingTrip.id === trip.id);
        if (alreadyExists) return prevTrips;
        return [...prevTrips, trip];
      });
    });

    return () => socket.disconnect();
  }, [setTrips]);



  const itemsPerLoad = 3;
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const monthNames = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];

  const calendarDays = useMemo(() => {
    const jsDay = new Date(currentYear, currentMonth, 1).getDay();
    const firstDayOfMonth = (jsDay + 6) % 7;
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysArray = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      daysArray.push({ type: 'empty', value: `empty-${i}` });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      daysArray.push({ type: 'day', value: day });
    }

    return daysArray;
  }, [currentMonth, currentYear]);

  const sortedTrips = [...trips].sort(
    (a, b) => new Date(a.startDate) - new Date(b.startDate)
  );

  const visibleTrips = sortedTrips.slice(0, visibleCount);
  const hasMoreTrips = visibleCount < sortedTrips.length;

  useEffect(() => {
    setVisibleCount((prev) =>
      Math.min(Math.max(prev, itemsPerLoad), sortedTrips.length || itemsPerLoad)
    );
  }, [sortedTrips.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry.isIntersecting && hasMoreTrips) {
          setVisibleCount((prev) => prev + itemsPerLoad);
        }
      },
      {
        root: null,
        rootMargin: '120px',
        threshold: 0.1
      }
    );

    const currentLoader = loaderRef.current;

    if (currentLoader) observer.observe(currentLoader);

    return () => {
      if (currentLoader) observer.unobserve(currentLoader);
    };
  }, [hasMoreTrips]);

  const handleEdit = (id) => {
    navigate(`/edit-trip/${id}`);
  };

  const handleDeleteClick = (id) => {
    setTripToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (tripToDelete) {
      onDeleteTrip(tripToDelete);
      setDeleteModalOpen(false);
      setTripToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setTripToDelete(null);
  };

  const handleAddTrip = () => {
    navigate('/add-trip');
  };

  const handleSearch = () => {
    const trimmedValue = searchInput.trim();
    if (!trimmedValue) return;

    const updatedHistory = [
      trimmedValue,
      ...searchHistory.filter(
        (item) => item.toLowerCase() !== trimmedValue.toLowerCase()
      )
    ].slice(0, 5);

    setSearchHistory(updatedHistory);
    localStorage.setItem('dashboardSearchHistory', JSON.stringify(updatedHistory));
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (value) => {
    setSearchInput(value);
    setShowSuggestions(false);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <div className="dashboard-top">
          <div className="top-left">
            <div className="planner-header">
              <h1>Plan your next trip:</h1>
            </div>

            <div className={`connection-status ${isOnline ? 'online' : 'offline'}`}>
              {isOnline ? 'Online' : 'Offline mode'}
            </div>

            <div className="date-section">
              <h3>Select date:</h3>

              <div className="calendar-card">
                <div className="calendar-header">
                  <span>{monthNames[currentMonth]} {currentYear}</span>
                  <div className="calendar-nav">
                    <button type="button">‹</button>
                    <button type="button">›</button>
                  </div>
                </div>

                <div className="calendar-weekdays">
                  <span>MON</span>
                  <span>TUE</span>
                  <span>WED</span>
                  <span>THU</span>
                  <span>FRI</span>
                  <span>SAT</span>
                  <span>SUN</span>
                </div>

                <div className="calendar-days">
                  {calendarDays.map((item) =>
                    item.type === 'empty' ? (
                      <span key={item.value} className="empty"></span>
                    ) : (
                      <span
                        key={item.value}
                        className={item.value === today.getDate() ? 'day current-day' : 'day'}
                      >
                        {item.value}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="search-section">
              <div className="search-wrapper">
                <div className="search-bar">
                  <span className="search-icon">⌕</span>
                  <input
                    type="text"
                    placeholder="Search your next destination"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                  />
                </div>

                {showSuggestions && searchHistory.length > 0 && (
                  <div className="search-suggestions">
                    {searchHistory.map((item, index) => (
                      <button
                        key={`${item}-${index}`}
                        type="button"
                        className="search-suggestion-item"
                        onClick={() => handleSuggestionClick(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button className="search-btn" type="button" onClick={handleSearch}>
                Search
              </button>

              {canCreateTrip && (
                <button className="add-trip-btn-top" onClick={handleAddTrip} type="button">
                  + Add Trip
                </button>
              )}
            </div>
          </div>
        </div>

        {false && (
          <section className="global-stats-section" style={{ padding: '20px', backgroundColor: '#eef4f1', borderRadius: '12px', margin: '20px 0', border: '1px solid #c2d6ce' }}>
            <h2 style={{ marginBottom: '15px', color: '#2d4b3b' }}>Global Platform Statistics (Admin Only)</h2>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', flex: 1, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <h4 style={{ color: '#777', marginBottom: '5px' }}>Total Trips</h4>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2d4b3b' }}>{globalStats.totalTrips}</div>
              </div>
              <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', flex: 1, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <h4 style={{ color: '#777', marginBottom: '5px' }}>Total Value</h4>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2d4b3b' }}>{globalStats.totalPrice.toLocaleString()} RON</div>
              </div>
              <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', flex: 1, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <h4 style={{ color: '#777', marginBottom: '5px' }}>Average Trip Price</h4>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2d4b3b' }}>{globalStats.averagePrice.toFixed(2)} RON</div>
              </div>
            </div>
          </section>
        )}

        <section className="trips-section">
          <div className="trips-header">
            <h2>Upcoming Trips:</h2>
          </div>

          {sortedTrips.length > 0 ? (
            <>
              <div className="trips-grid">
                {visibleTrips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                    canUpdateTrip={canUpdateTrip}
                    canDeleteTrip={canDeleteTrip}
                  />
                ))}
              </div>

              {hasMoreTrips && (
                <div ref={loaderRef} className="infinite-loader">
                  Loading more trips...
                </div>
              )}
            </>
          ) : (
            <div className="no-trips">
              <p>No trips found. Add a new trip to get started!</p>
            </div>
          )}
        </section>
      </main>

      <DeleteModal
        isOpen={deleteModalOpen}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default Dashboard;
