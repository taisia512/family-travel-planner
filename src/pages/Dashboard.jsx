import React, { useEffect, useRef, useState } from 'react';
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
  const searchRef = useRef(null);

  const [searchHistory, setSearchHistory] = useState(() => {
    const saved = localStorage.getItem('dashboardSearchHistory');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const socket = io(API_BASE_URL);

    socket.on('newTrip', (trip) => {
      setTrips((prevTrips) => {
        const alreadyExists = prevTrips.some(
          (existingTrip) => String(existingTrip.id) === String(trip.id)
        );

        if (alreadyExists) return prevTrips;

        return [...prevTrips, trip];
      });
    });

    return () => socket.disconnect();
  }, [setTrips]);

  const itemsPerLoad = 3;

  const filteredTrips = trips.filter((trip) => {
    const query = searchInput.trim().toLowerCase();

    if (!query) return true;

    return (
      trip.country?.toLowerCase().includes(query) ||
      trip.city?.toLowerCase().includes(query) ||
      trip.destination?.toLowerCase().includes(query)
    );
  });

  const sortedTrips = [...filteredTrips].sort(
    (a, b) => new Date(a.startDate) - new Date(b.startDate)
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingTrips = sortedTrips.filter((trip) => {
    const endDate = new Date(trip.endDate);
    endDate.setHours(0, 0, 0, 0);
    return endDate >= today;
  });

  const visibleTrips = upcomingTrips.slice(0, visibleCount);
  const hasMoreTrips = visibleCount < upcomingTrips.length;

  useEffect(() => {
    setVisibleCount((prev) =>
      Math.min(Math.max(prev, itemsPerLoad), upcomingTrips.length || itemsPerLoad)
    );
  }, [upcomingTrips.length]);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const noTripsMessage = searchInput.trim()
    ? 'No upcoming trips match your search.'
    : 'No upcoming trips found. Add a new trip to get started!';

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

            <div className="search-section">
              <div className="search-wrapper" ref={searchRef}>
                <div className="search-bar">
                  <span className="search-icon">⌕</span>

                  <input
                    type="text"
                    placeholder="Search trips by country or city"
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

        <section className="trips-section">
          <div className="trips-header">
            <h2>Upcoming Trips:</h2>

            <button
              type="button"
              className="past-trips-btn"
              onClick={() => navigate('/past-trips')}
            >
              View past trips
            </button>
          </div>

          {upcomingTrips.length > 0 ? (
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
              <p>{noTripsMessage}</p>
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