import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import locations from '../data/locations';
import '../styles/Form.css';

function EditTrip({ trips, onUpdateTrip }) {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    country: '',
    city: '',
    startDate: '',
    endDate: '',
    travelers: ''
  });

  const [errors, setErrors] = useState({});

  const countryOptions = Object.keys(locations);
  const cityOptions = formData.country ? locations[formData.country] : [];

  useEffect(() => {
    const trip = trips.find((t) => t.id === parseInt(id, 10));

    if (trip) {
      setFormData({
        country: trip.country || '',
        city: trip.city || trip.destination || '',
        startDate: trip.startDate,
        endDate: trip.endDate,
        travelers: trip.travelers.toString()
      });
    } else {
      navigate('/dashboard');
    }
  }, [id, trips, navigate]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const start = new Date(formData.startDate);
      start.setHours(0, 0, 0, 0);

      if (start < today) {
        newErrors.startDate = 'Start date cannot be in the past';
      }
    }

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        newErrors.endDate = 'End date cannot be before start date';
      }
    }

    if (!formData.travelers) {
      newErrors.travelers = 'Number of travelers is required';
    } else if (parseInt(formData.travelers, 10) <= 0) {
      newErrors.travelers = 'Travelers must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'country') {
      setFormData((prev) => ({
        ...prev,
        country: value,
        city: ''
      }));

      setErrors((prev) => ({
        ...prev,
        country: '',
        city: ''
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      const trip = trips.find((t) => t.id === parseInt(id, 10));

      onUpdateTrip({
        ...trip,
        ...formData,
        travelers: parseInt(formData.travelers, 10)
      });

      navigate('/dashboard');
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  return (
    <div className="form-layout">
      <Sidebar />

      <main className="form-main">
        <div className="form-container">
          <h1 className="form-title">Edit Trip:</h1>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="country">Country:</label>
              <select
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className={errors.country ? 'error' : ''}
              >
                <option value="">Select a country</option>
                {countryOptions.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
              {errors.country && <span className="error-message">{errors.country}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="city">City:</label>
              <select
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className={errors.city ? 'error' : ''}
                disabled={!formData.country}
              >
                <option value="">
                  {formData.country ? 'Select a city' : 'Select country first'}
                </option>
                {cityOptions.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              {errors.city && <span className="error-message">{errors.city}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="startDate">Start Date:</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className={errors.startDate ? 'error' : ''}
              />
              {errors.startDate && <span className="error-message">{errors.startDate}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="endDate">End Date:</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className={errors.endDate ? 'error' : ''}
              />
              {errors.endDate && <span className="error-message">{errors.endDate}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="travelers">Travelers:</label>
              <input
                type="number"
                id="travelers"
                name="travelers"
                value={formData.travelers}
                onChange={handleChange}
                className={errors.travelers ? 'error' : ''}
              />
              {errors.travelers && <span className="error-message">{errors.travelers}</span>}
            </div>

            <div className="form-actions">
              <button type="button" className="btn cancel-btn" onClick={handleCancel}>
                Cancel
              </button>

              <button type="submit" className="btn confirm-btn">
                Confirm
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default EditTrip;