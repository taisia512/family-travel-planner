const { Trip } = require('../models');
const { createLog } = require('./logService');

const getAllTrips = async (page = 1, pageSize = 10, userId = null, role = 'user') => {
  const limit = pageSize;
  const offset = (page - 1) * pageSize;

  let whereClause = {};
  if (role !== 'admin') {
    whereClause = { userId: userId || -1 };
  }

  const result = await Trip.findAndCountAll({
    where: whereClause,
    limit,
    offset,
    order: [['id', 'ASC']]
  });

  return {
    page,
    pageSize,
    totalItems: result.count,
    totalPages: Math.ceil(result.count / pageSize),
    items: result.rows
  };
};

const getTripById = async (id) => {
  return await Trip.findByPk(id);
};

const createTrip = async (trip, userId) => {
  const newTrip = await Trip.create({
    destination: trip.destination || (trip.city ? `${trip.city}, ${trip.country}` : trip.country),
    country: trip.country,
    city: trip.city,
    travelers: trip.travelers || 1,
    startDate: trip.startDate,
    endDate: trip.endDate,
    price: trip.price || 0,
    userId
  });

  await createLog({
    userId,
    action: 'CREATE_TRIP',
    details: `Created trip to ${newTrip.destination}`
  });

  return newTrip;
};

const updateTrip = async (id, updatedData) => {
  const trip = await Trip.findByPk(id);

  if (!trip) {
    return null;
  }

  await trip.update({
    destination: updatedData.destination || (updatedData.city ? `${updatedData.city}, ${updatedData.country}` : updatedData.country),
    country: updatedData.country,
    city: updatedData.city,
    travelers: updatedData.travelers,
    startDate: updatedData.startDate,
    endDate: updatedData.endDate,
    price: updatedData.price !== undefined ? updatedData.price : trip.price
  });

  await createLog({
    userId: updatedData.userId,
    action: 'UPDATE_TRIP',
    details: `Updated trip to ${trip.destination}`
  });

  return trip;
};

const deleteTrip = async (id, userId) => {
  const trip = await Trip.findByPk(id);

  if (!trip) {
    return false;
  }

  const destination = trip.destination;
  await trip.destroy();

  await createLog({
    userId,
    action: 'DELETE_TRIP',
    details: `Deleted trip to ${destination}`
  });

  return destination;
};

const getTripStats = async () => {
  const trips = await Trip.findAll();

  const totalTrips = trips.length;
  const totalPrice = trips.reduce((sum, trip) => sum + Number(trip.price), 0);
  const averagePrice = totalTrips > 0 ? totalPrice / totalTrips : 0;

  return {
    totalTrips,
    totalPrice,
    averagePrice
  };
};

module.exports = {
  getAllTrips,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
  getTripStats
};