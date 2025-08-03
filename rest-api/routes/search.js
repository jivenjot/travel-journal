const express = require('express');
const Trip = require('../models/Trip');
const JournalEntry = require('../models/JournalEntry');
const router = express.Router();

// Search trips by destination/tags
router.get('/trips', async (req, res) => {
    try {
        const { q, tags, startDate, endDate } = req.query;
        
        let searchQuery = { privacy: 'public' };
        
        if (q) {
            searchQuery.$or = [
                { title: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { destination: { $regex: q, $options: 'i' } }
            ];
        }
        
        if (tags) {
            const tagArray = tags.split(',').map(tag => tag.trim());
            searchQuery.tags = { $in: tagArray };
        }
        
        if (startDate || endDate) {
            searchQuery.startDate = {};
            if (startDate) {
                searchQuery.startDate.$gte = new Date(startDate);
            }
            if (endDate) {
                searchQuery.startDate.$lte = new Date(endDate);
            }
        }
        
        const trips = await Trip.find(searchQuery)
            .populate('user', 'username firstName lastName avatar')
            .sort({ createdAt: -1 })
            .limit(50);
        
        res.json(trips);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to search trips' });
    }
});

// Search journal entries
router.get('/entries', async (req, res) => {
    try {
        const { q, mood, tags } = req.query;
        
        // First find public trips
        const publicTrips = await Trip.find({ privacy: 'public' }).select('_id');
        const tripIds = publicTrips.map(trip => trip._id);
        
        let searchQuery = { trip: { $in: tripIds } };
        
        if (q) {
            searchQuery.$or = [
                { title: { $regex: q, $options: 'i' } },
                { content: { $regex: q, $options: 'i' } },
                { location: { $regex: q, $options: 'i' } }
            ];
        }
        
        if (mood) {
            searchQuery.mood = mood;
        }
        
        if (tags) {
            const tagArray = tags.split(',').map(tag => tag.trim());
            searchQuery.personalTags = { $in: tagArray };
        }
        
        const entries = await JournalEntry.find(searchQuery)
            .populate('trip', 'title destination user')
            .populate({
                path: 'trip',
                populate: {
                    path: 'user',
                    select: 'username firstName lastName avatar'
                }
            })
            .sort({ createdAt: -1 })
            .limit(50);
        
        res.json(entries);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to search entries' });
    }
});

module.exports = router;

