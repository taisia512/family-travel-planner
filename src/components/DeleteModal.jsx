import React from 'react';
import '../styles/DeleteModal.css';

function DeleteModal({ isOpen, onCancel, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Delete Trip</h2>
        <p className="modal-message">
          Are you sure you want to delete this trip? This action cannot be undone.
        </p>
        <div className="modal-actions">
          <button className="modal-btn cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="modal-btn confirm-btn" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteModal;
