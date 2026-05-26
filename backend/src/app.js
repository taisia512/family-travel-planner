const express = require('express');
const cors = require('cors');

const tripRoutes = require('./routes/tripRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Allow requests from the Vite frontend (HTTPS on 5173) and any LAN origin.
// In production you would restrict this to specific origins.
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. Postman, curl, same-origin)
    // and any https or http origin for dev/LAN testing.
    callback(null, true);
  },
  credentials: true
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', expenseRoutes);
app.use('/api', chatRoutes);
app.use('/api', userRoutes);
app.use('/api/admin', adminRoutes);
app.get('/', (req, res) => {
  res.json({ message: 'Family Travel Backend is running' });
});

app.use('/api/trips', tripRoutes);

if (process.env.NODE_ENV !== 'test') {
  const generatorRoutes = require('./routes/generatorRoutes');
  app.use('/api/generator', generatorRoutes);
}

module.exports = app;