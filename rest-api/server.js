const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/auth.js');
const flightsRouter = require('./routes/flights');
const tripsRouter = require('./routes/trips');
const entriesRouter = require('./routes/entries');
const usersRouter = require('./routes/users');
const searchRouter = require('./routes/search');
const externalRouter = require('./routes/external');

dotenv.config();

const app = express();

// ✅ Middleware: CORS with Vercel frontend allowed
app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://travel-frontend-rosy.vercel.app'
    ],
    credentials: true,
}));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripsRouter);
app.use('/api/entries', entriesRouter);
app.use('/api/users', usersRouter);
app.use('/api/search', searchRouter);
app.use('/api', externalRouter);
app.use('/flights', flightsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Travel Journal API is running' });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("Connected to MongoDB Atlas"))
    .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Travel Journal REST API running at http://localhost:${PORT}`);
});
