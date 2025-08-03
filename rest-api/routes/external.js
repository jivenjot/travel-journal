const express = require('express');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// Get weather data for location/date
router.get('/weather/:location/:date', verifyToken, async (req, res) => {
    try {
        const { location, date } = req.params;
        
        // Placeholder implementation - in production, integrate with OpenWeatherMap API
        const mockWeatherData = {
            location,
            date,
            temperature: Math.floor(Math.random() * 30) + 10, // 10-40°C
            description: ['sunny', 'cloudy', 'rainy', 'partly cloudy'][Math.floor(Math.random() * 4)],
            humidity: Math.floor(Math.random() * 50) + 30, // 30-80%
            windSpeed: Math.floor(Math.random() * 20) + 5 // 5-25 km/h
        };
        
        res.json(mockWeatherData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch weather data' });
    }
});

// Get currency conversion rate
router.get('/currency/:from/:to', verifyToken, async (req, res) => {
    try {
        const { from, to } = req.params;
        
        // Placeholder implementation - in production, integrate with ExchangeRate-API
        const mockExchangeRates = {
            'USD': { 'EUR': 0.85, 'GBP': 0.73, 'JPY': 110, 'CAD': 1.25 },
            'EUR': { 'USD': 1.18, 'GBP': 0.86, 'JPY': 130, 'CAD': 1.47 },
            'GBP': { 'USD': 1.37, 'EUR': 1.16, 'JPY': 151, 'CAD': 1.71 }
        };
        
        const rate = mockExchangeRates[from]?.[to] || 1;
        
        res.json({
            from,
            to,
            rate,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch currency data' });
    }
});

// Upload photos (placeholder implementation)
router.post('/upload/photos', verifyToken, async (req, res) => {
    try {
        // Placeholder implementation - in production, integrate with Cloudinary
        // For now, return mock URLs
        const mockPhotos = [
            {
                url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
                publicId: 'travel_journal_' + Date.now() + '_1',
                caption: 'Sample travel photo'
            },
            {
                url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800',
                publicId: 'travel_journal_' + Date.now() + '_2',
                caption: 'Another sample photo'
            }
        ];
        
        res.json({
            success: true,
            photos: mockPhotos.slice(0, Math.floor(Math.random() * 2) + 1) // Return 1-2 photos
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to upload photos' });
    }
});

module.exports = router;

