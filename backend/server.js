// server.js
// THE ENTRY POINT of our backend.
// This is what runs when we type `npm run dev`.

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB
connectDB();

// Create Express app
const app = express();

// === MIDDLEWARE (order matters!) ===

// CORS: allows our React frontend (port 3000) to call this backend (port 5000)
app.use(cors());

// Body parser: lets us read JSON from request body (req.body)
app.use(express.json());

// Request logger (simple custom one — useful during development)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// === ROUTES ===

// Health check route — useful to verify server is running
app.get('/', (req, res) => {
  res.json({ message: 'FocusForge API is running 🚀' });
});

// Mount route groups
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/sessions', require('./routes/sessionRoutes'));
app.use('/api/insights', require('./routes/insightsRoutes'));
// We'll add these in Phase 2:
// app.use('/api/sessions', require('./routes/sessionRoutes'));
// app.use('/api/insights', require('./routes/insightsRoutes'));

// Error handler — MUST be LAST middleware
app.use(errorHandler);

// === START SERVER ===
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});