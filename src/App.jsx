import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import AddTrip from './pages/AddTrip';
import EditTrip from './pages/EditTrip';
import TripDetail from './pages/TripDetail';
import Explore from './pages/Explore';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminPanel from './pages/AdminPanel';
import mockTrips from './data/mockTrips';
import './App.css';
import Chat from './pages/Chat';
import { API_BASE_URL } from './config/api';
import { apiFetch } from './utils/api';
import ProtectedRoute from './components/ProtectedRoute';
import VerifyLogin from './pages/VerifyLogin';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PastTrips from './pages/PastTrips';
const PENDING_ACTIONS_KEY = 'family_travel_pending_actions';
const API_URL = `${API_BASE_URL}/api/trips`;
const SERVER_HEALTH_URL = `${API_BASE_URL}/`;


  const removeDuplicateTrips = (trips) => {
  const seen = new Set();

  return trips.filter((trip) => {
    const key = String(trip.id);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};
function App() {
  const [trips, setTrips] = useState([]);
  const location = useLocation();

  const [pendingActions, setPendingActions] = useState(() => {
    const savedActions = localStorage.getItem(PENDING_ACTIONS_KEY);
    return savedActions ? JSON.parse(savedActions) : [];
  });

  const [isOnline, setIsOnline] = useState(false);
  const isSyncingRef = useRef(false);

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (currentUser?.id) {
      apiFetch(`${API_URL}?page=1&pageSize=1000`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.items) {
            setTrips(removeDuplicateTrips(data.items));
          }
        })
        .catch(console.error);
    } else {
      setTrips([]);
    }
  }, [location.pathname]);

  useEffect(() => {
    localStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(pendingActions));
  }, [pendingActions]);

  useEffect(() => {
    const checkServer = async () => {
      try {
        // Use a no-auth health check so it works even when logged out
        const response = await fetch(SERVER_HEALTH_URL, {
          method: 'GET',
          cache: 'no-store'
        });
        setIsOnline(response.ok);
      } catch {
        setIsOnline(false);
      }
    };

    checkServer();
    const interval = setInterval(checkServer, 3000);
    return () => clearInterval(interval);
  }, []);

  const syncPendingActions = useCallback(async () => {
    if (!isOnline || pendingActions.length === 0 || isSyncingRef.current) {
      return;
    }

    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser?.id) return;

    isSyncingRef.current = true;
    let remainingActions = [...pendingActions];

    for (const action of pendingActions) {
      try {
        if (action.type === 'add') {
          const response = await apiFetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(action.trip)
          });

          if (!response.ok) throw new Error('Failed to sync add action');

          const createdTrip = await response.json();
          const oldId = action.trip.id;

          setTrips((prevTrips) =>
            prevTrips.map((trip) => (trip.id === oldId ? createdTrip : trip))
          );

          remainingActions = remainingActions.slice(1).map((pendingAction) => {
            if (pendingAction.type === 'update' && pendingAction.trip.id === oldId) {
              return { ...pendingAction, trip: { ...pendingAction.trip, id: createdTrip.id } };
            }
            if (pendingAction.type === 'delete' && pendingAction.id === oldId) {
              return { ...pendingAction, id: createdTrip.id };
            }
            return pendingAction;
          });

          setPendingActions(remainingActions);
          continue;
        }

        if (action.type === 'update') {
          const response = await apiFetch(`${API_URL}/${action.trip.id}`, {
            method: 'PUT',
            body: JSON.stringify(action.trip)
          });

          if (!response.ok) throw new Error('Failed to sync update action');

          const updatedTrip = await response.json();

          setTrips((prevTrips) =>
            prevTrips.map((trip) => (trip.id === updatedTrip.id ? updatedTrip : trip))
          );

          remainingActions = remainingActions.slice(1);
          setPendingActions(remainingActions);
          continue;
        }

        if (action.type === 'delete') {
          const response = await apiFetch(`${API_URL}/${action.id}`, { method: 'DELETE' });

          if (!response.ok && response.status !== 204) {
            throw new Error('Failed to sync delete action');
          }

          remainingActions = remainingActions.slice(1);
          setPendingActions(remainingActions);
        }
      } catch (error) {
        console.error('Sync paused:', error);
        break;
      }
    }

    isSyncingRef.current = false;
  }, [isOnline, pendingActions]);

  useEffect(() => {
    if (isOnline && pendingActions.length > 0) {
      syncPendingActions();
    }
  }, [isOnline, pendingActions, syncPendingActions]);

  const addTrip = async (newTrip) => {
  const currentUser = JSON.parse(localStorage.getItem('user'));

  if (!currentUser?.id) {
    alert('You are not logged in.');
    return;
  }

  try {
    const response = await apiFetch(API_URL, {
      method: 'POST',
      body: JSON.stringify(newTrip)
    });

    const text = await response.text();
    console.log('ADD TRIP STATUS:', response.status);
    console.log('ADD TRIP RESPONSE:', text);

    if (!response.ok) {
      alert(`Failed to add trip. Status: ${response.status}. Response: ${text}`);
      return;
    }

    const createdTrip = JSON.parse(text);

    setTrips((prevTrips) =>
      removeDuplicateTrips([...prevTrips, createdTrip])
    );
  } catch (error) {
    console.error('Add trip error:', error);
    alert('Add trip failed. Check Console.');
  }
};

  const updateTrip = async (updatedTrip) => {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser?.id) return;

    const hasPendingAdd = pendingActions.some(
      (action) => action.type === 'add' && action.trip.id === updatedTrip.id
    );

    setTrips((prevTrips) =>
      prevTrips.map((trip) => (trip.id === updatedTrip.id ? updatedTrip : trip))
    );

    if (hasPendingAdd || !isOnline) {
      setPendingActions((prevActions) => [
        ...prevActions.filter(
          (action) => !(action.type === 'update' && action.trip.id === updatedTrip.id)
        ),
        { type: 'update', trip: updatedTrip }
      ]);
      return;
    }

    try {
      const response = await apiFetch(`${API_URL}/${updatedTrip.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedTrip)
      });

      if (!response.ok) throw new Error('Failed to update trip on server');

      const savedTrip = await response.json();

      setTrips((prevTrips) =>
        prevTrips.map((trip) => (trip.id === savedTrip.id ? savedTrip : trip))
      );
    } catch (error) {
      console.error('Server unavailable, update queued locally:', error);

      setPendingActions((prevActions) => [
        ...prevActions.filter(
          (action) => !(action.type === 'update' && action.trip.id === updatedTrip.id)
        ),
        { type: 'update', trip: updatedTrip }
      ]);
    }
  };

  const deleteTrip = async (id) => {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser?.id) return;

    const hasPendingAdd = pendingActions.some(
      (action) => action.type === 'add' && action.trip.id === id
    );

    setTrips((prevTrips) => prevTrips.filter((trip) => trip.id !== id));

    if (hasPendingAdd) {
      setPendingActions((prevActions) =>
        prevActions.filter((action) => {
          if (action.type === 'add' && action.trip.id === id) return false;
          if (action.type === 'update' && action.trip.id === id) return false;
          if (action.type === 'delete' && action.id === id) return false;
          return true;
        })
      );
      return;
    }

    if (!isOnline) {
      setPendingActions((prevActions) => [
        ...prevActions.filter(
          (action) =>
            !((action.type === 'update' && action.trip.id === id) ||
              (action.type === 'delete' && action.id === id))
        ),
        { type: 'delete', id }
      ]);
      return;
    }

    try {
      const response = await apiFetch(`${API_URL}/${id}`, { method: 'DELETE' });

      if (!response.ok && response.status !== 204) {
        throw new Error('Failed to delete trip from server');
      }
    } catch (error) {
      console.error('Server unavailable, delete queued locally:', error);

      setPendingActions((prevActions) => [
        ...prevActions.filter(
          (action) =>
            !((action.type === 'update' && action.trip.id === id) ||
              (action.type === 'delete' && action.id === id))
        ),
        { type: 'delete', id }
      ]);
    }
  };


  return (
    <div className="app">
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-login" element={<VerifyLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        {/* Protected routes – require a valid JWT */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard
                trips={trips}
                setTrips={setTrips}
                onDeleteTrip={deleteTrip}
                isOnline={isOnline}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/explore"
          element={
            <ProtectedRoute>
              <Explore trips={trips} setTrips={setTrips} isOnline={isOnline} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/add-trip"
          element={
            <ProtectedRoute>
              <AddTrip onAddTrip={addTrip} isOnline={isOnline} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/edit-trip/:id"
          element={
            <ProtectedRoute>
              <EditTrip trips={trips} onUpdateTrip={updateTrip} isOnline={isOnline} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/trip/:id"
          element={
            <ProtectedRoute>
              <TripDetail trips={trips} isOnline={isOnline} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />

        {/* Admin-only route */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminPanel />
            </ProtectedRoute>
          }
        />

        <Route
  path="/past-trips"
  element={
    <ProtectedRoute>
      <PastTrips
        trips={trips}
        onDeleteTrip={deleteTrip}
      />
    </ProtectedRoute>
  }
/>
      </Routes>
    </div>
  );
}

export default App;
