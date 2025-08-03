const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const tripRoutes = require('./routes/trips');

dotenv.config();

const app = express();

// Global CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://travel-frontend-rosy.vercel.app');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  next();
});

// Enable CORS with credentials
app.use(cors({
  origin: 'https://travel-frontend-rosy.vercel.app',
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);

// Handle preflight requests
app.options('*', cors());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is up and running' });
});

// Connect to DB and start server
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT || 5000, () => {
      console.log('Server running on port', process.env.PORT || 5000);
    });
  })
  .catch(err => console.error('DB connection error:', err));
