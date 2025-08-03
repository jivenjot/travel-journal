const express = require('express');
const Trip = require('../models/Trip');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// Get all public trips + user's trips (with optional auth)
router.get('/', async (req, res) => {
    try {
        let query = { privacy: 'public' };
        
        // If user is authenticated, also include their private trips
        if (req.headers.authorization) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                query = {
                    $or: [
                        { privacy: 'public' },
                        { user: decoded.userId }
                    ]
                };
            } catch (authErr) {
                // If token is invalid, just show public trips
                query = { privacy: 'public' };
            }
        }
        
        const trips = await Trip.find(query)
            .populate('user', 'username firstName lastName avatar')
            .sort({ createdAt: -1 });
        
        res.json(trips);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch trips' });
    }
});

// Get trips by specific user
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const trips = await Trip.find({ 
            user: userId,
            privacy: { $in: ["public", "private"] } // Allow public and private trips for the owner
        })
        .populate('user', 'username firstName lastName avatar')
        .sort({ createdAt: -1 });
        
        res.json(trips);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch user trips' });
    }
});

// Create new trip
router.post('/', verifyToken, async (req, res) => {
    try {
        const { title, description, destination, destinationCoordinates, startDate, endDate, tags, privacy } = req.body;
        
        // Map frontend privacy values to backend values
        let mappedPrivacy = 'public';
        if (privacy === 'private') {
            mappedPrivacy = 'private';
        } else if (privacy === 'friends-only') {
            mappedPrivacy = 'friends';
        }
        
        const newTrip = new Trip({
            title,
            description,
            destination,
            destinationCoordinates,
            startDate,
            endDate,
            tags: tags || [],
            privacy: mappedPrivacy,
            user: req.user.userId
        });
        
        await newTrip.save();
        
        // Update user's travel statistics
        await User.findByIdAndUpdate(req.user.userId, {
            $inc: { 'travelStatistics.totalTrips': 1 }
        });
        
        const populatedTrip = await Trip.findById(newTrip._id)
            .populate('user', 'username firstName lastName avatar');
        
        res.status(201).json(populatedTrip);
    } catch (err) {
        console.error(err);
        console.warn(err);
        res.status(500).json({ error: 'Failed to create trip', details: err.message });
    }
});

// Get single trip by ID
router.get('/:id', async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id)
            .populate('user', 'username firstName lastName avatar')
            .populate({
                path: 'entries',
                populate: {
                    path: 'comments',
                    populate: {
                        path: 'user',
                        select: 'username firstName lastName avatar'
                    }
                }
            });
        
        if (!trip) {
            return res.status(404).json({ error: 'Trip not found' });
        }
        
        // Check if trip is accessible (public or user's own trip)
        if (trip.privacy === 'private' && (!req.user || trip.user._id.toString() !== req.user.userId)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        res.json(trip);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch trip' });
    }
});

// Update trip by ID
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);
        
        if (!trip) {
            return res.status(404).json({ error: 'Trip not found' });
        }
        
        if (trip.user.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const { title, description, destination, destinationCoordinates, startDate, endDate, privacy, tags } = req.body;
        
        const updatedTrip = await Trip.findByIdAndUpdate(
            req.params.id,
            {
                title,
                description,
                destination,
                destinationCoordinates,
                startDate,
                endDate,
                privacy,
                tags
            },
            { new: true }
        ).populate('user', 'username firstName lastName avatar');
        
        res.json(updatedTrip);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update trip' });
    }
});

// Delete trip by ID
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);
        
        if (!trip) {
            return res.status(404).json({ error: 'Trip not found' });
        }
        
        if (trip.user.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        await Trip.findByIdAndDelete(req.params.id);
        
        // Update user's travel statistics
        await User.findByIdAndUpdate(req.user.userId, {
            $inc: { 'travelStatistics.totalTrips': -1 }
        });
        
        res.json({ message: 'Trip deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete trip' });
    }
});

module.exports = router;

