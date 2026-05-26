import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TripCard from '../components/TripCard';
import DeleteModal from '../components/DeleteModal';
import '../styles/Dashboard.css';

function PastTrips({ trips, onDeleteTrip }) {
  const navigate = useNavigate();

  const savedUser = JSON.parse(localStorage.getItem('user'));
  const permissions = savedUser?.permissions || [];

  const canUpdateTrip = permissions.includes('UPDATE_TRIP');
  const canDeleteTrip = permissions.includes('DELETE_TRIP');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pastTrips = [...trips]
    .filter((trip) => {
      const endDate = new Date(trip.endDate);
      endDate.setHours(0, 0, 0, 0);
      return endDate < today;
    })
    .sort((a, b) => new Date(b.endDate) - new Date(a.endDate));

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

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <section className="trips-section">
          <div className="trips-header">
            <h2>Past Trips:</h2>

            <button
              type="button"
              className="past-trips-btn"
              onClick={() => navigate('/dashboard')}
            >
              Back to dashboard
            </button>
          </div>

          {pastTrips.length > 0 ? (
            <div className="trips-grid">
              {pastTrips.map((trip) => (
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
          ) : (
            <div className="no-trips">
              <p>No past trips yet.</p>
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

export default PastTrips;