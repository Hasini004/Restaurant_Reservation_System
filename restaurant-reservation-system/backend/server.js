require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const tableRoutes = require('./routes/tableRoutes');
const reservationRoutes = require('./routes/reservationRoutes');

connectDB();

const app = express();

// --- Core middleware ---
app.use(express.json());

const allowedOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    credentials: true,
  })
);

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// --- Health check ---
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is running' });
});

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/reservations', reservationRoutes);

// --- Error handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = app;
