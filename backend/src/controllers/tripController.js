const tripService = require('../services/tripService');
const validateTrip = require('../validators/tripValidator');

const getTrips = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const userId = req.headers['x-user-id'];
  const role = req.headers['x-user-role'] || 'user';

  const result = await tripService.getAllTrips(page, pageSize, userId, role);
  res.json(result);
};

const getTrip = async (req, res) => {
  const id = parseInt(req.params.id);
  const trip = await tripService.getTripById(id);

  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  res.json(trip);
};

const createTrip = async (req, res) => {
  const errors = validateTrip(req.body);

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const userId = req.headers['x-user-id'];
  const newTrip = await tripService.createTrip(req.body, userId);
  
  const io = req.app.get('io');
  if (io) io.emit('activityLogged');
  
  res.status(201).json(newTrip);
};

const updateTrip = async (req, res) => {
  const id = parseInt(req.params.id);

  const errors = validateTrip(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const userId = req.headers['x-user-id'];
  const updatedData = { ...req.body, userId };

  const updated = await tripService.updateTrip(id, updatedData);

  if (!updated) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  const io = req.app.get('io');
  if (io) io.emit('activityLogged');

  res.json(updated);
};

const deleteTrip = async (req, res) => {
  const id = parseInt(req.params.id);
  const userId = req.headers['x-user-id'];

  const destination = await tripService.deleteTrip(id, userId);

  if (!destination) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  const io = req.app.get('io');
  if (io) io.emit('activityLogged');

  res.status(204).send();
};

const getTripStats = async (req, res) => {
  const stats = await tripService.getTripStats();
  res.json(stats);
};

module.exports = {
  getTrips,
  getTrip,
  createTrip,
  updateTrip,
  deleteTrip,
  getTripStats
};