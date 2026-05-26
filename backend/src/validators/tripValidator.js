const validateTrip = (trip) => {
  const errors = [];

  if (!trip.country && !trip.destination) {
    errors.push('Country or Destination is required');
  }

  if (!trip.startDate) {
    errors.push('Start date is required');
  }

  if (!trip.endDate) {
    errors.push('End date is required');
  }

  if (trip.startDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(trip.startDate);
    start.setHours(0, 0, 0, 0);

    if (start < today) {
      errors.push('Start date cannot be in the past');
    }
  }

  if (trip.startDate && trip.endDate) {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);

    if (end < start) {
      errors.push('End date cannot be before start date');
    }
  }

  if (trip.price !== undefined && trip.price < 0) {
    errors.push('Price cannot be negative');
  }

  return errors;
};

module.exports = validateTrip;