const express = require('express');
const JournalEntry = require('../models/JournalEntry');
const Trip = require('../models/Trip');
const Comment = require('../models/Comment');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// Get all entries for a trip
router.get('/trip/:tripId', async (req, res) => {
    try {
        const { tripId } = req.params;
        
        // Check if trip exists and is accessible
        const trip = await Trip.findById(tripId);
        if (!trip) {
            return res.status(404).json({ error: 'Trip not found' });
        }
        
        const entries = await JournalEntry.find({ trip: tripId })
            .populate('comments')
            .populate('likes', 'username firstName lastName avatar')
            .sort({ date: 1 });
        
        res.json(entries);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch entries' });
    }
});

// Create new journal entry
router.post('/', verifyToken, async (req, res) => {
    try {
        const { tripId, title, content, location, locationCoordinates, photos, mood, personalTags, date } = req.body;
        
        // Verify trip exists and user owns it
        const trip = await Trip.findById(tripId);
        if (!trip) {
            return res.status(404).json({ error: 'Trip not found' });
        }
        
        if (trip.user.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const newEntry = new JournalEntry({
            trip: tripId,
            title,
            content,
            location,
            locationCoordinates,
            photos: photos || [],
            mood,
            personalTags: personalTags || [],
            date: date || new Date()
        });
        
        await newEntry.save();
        
        // Add entry to trip's entries array
        await Trip.findByIdAndUpdate(tripId, {
            $push: { entries: newEntry._id }
        });
        
        const populatedEntry = await JournalEntry.findById(newEntry._id)
            .populate('comments')
            .populate('likes', 'username firstName lastName avatar');
        
        res.status(201).json(populatedEntry);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create entry' });
    }
});

// Get single entry by ID
router.get('/:id', async (req, res) => {
    try {
        const entry = await JournalEntry.findById(req.params.id)
            .populate('trip')
            .populate('comments')
            .populate('likes', 'username firstName lastName avatar')
            .populate({
                path: 'comments',
                populate: {
                    path: 'user',
                    select: 'username firstName lastName avatar'
                }
            });
        
        if (!entry) {
            return res.status(404).json({ error: 'Entry not found' });
        }
        
        // Check if entry is accessible based on trip privacy
        const trip = await Trip.findById(entry.trip._id);
        if (trip.privacy === 'private' && (!req.user || trip.user.toString() !== req.user.userId)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        res.json(entry);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch entry' });
    }
});

// Update entry by ID
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const entry = await JournalEntry.findById(req.params.id).populate('trip');
        
        if (!entry) {
            return res.status(404).json({ error: 'Entry not found' });
        }
        
        if (entry.trip.user.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const { title, content, location, locationCoordinates, photos, mood, personalTags } = req.body;
        
        const updatedEntry = await JournalEntry.findByIdAndUpdate(
            req.params.id,
            {
                title,
                content,
                location,
                locationCoordinates,
                photos,
                mood,
                personalTags
            },
            { new: true }
        )
        .populate('comments')
        .populate('likes', 'username firstName lastName avatar');
        
        res.json(updatedEntry);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update entry' });
    }
});

// Delete entry by ID
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const entry = await JournalEntry.findById(req.params.id).populate('trip');
        
        if (!entry) {
            return res.status(404).json({ error: 'Entry not found' });
        }
        
        if (entry.trip.user.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        // Remove entry from trip's entries array
        await Trip.findByIdAndUpdate(entry.trip._id, {
            $pull: { entries: entry._id }
        });
        
        // Delete all comments associated with this entry
        await Comment.deleteMany({ entry: entry._id });
        
        await JournalEntry.findByIdAndDelete(req.params.id);
        
        res.json({ message: 'Entry deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete entry' });
    }
});

// Like/unlike an entry
router.post('/:id/like', verifyToken, async (req, res) => {
    try {
        const entry = await JournalEntry.findById(req.params.id);
        
        if (!entry) {
            return res.status(404).json({ error: 'Entry not found' });
        }
        
        const userId = req.user.userId;
        const isLiked = entry.likes.includes(userId);
        
        if (isLiked) {
            // Unlike
            await JournalEntry.findByIdAndUpdate(req.params.id, {
                $pull: { likes: userId }
            });
        } else {
            // Like
            await JournalEntry.findByIdAndUpdate(req.params.id, {
                $push: { likes: userId }
            });
        }
        
        const updatedEntry = await JournalEntry.findById(req.params.id)
            .populate('likes', 'username firstName lastName avatar');
        
        res.json({ 
            liked: !isLiked, 
            likesCount: updatedEntry.likes.length,
            likes: updatedEntry.likes
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to like/unlike entry' });
    }
});

// Add comment to entry
router.post('/:id/comment', verifyToken, async (req, res) => {
    try {
        const { content, replyTo } = req.body;
        const entryId = req.params.id;
        
        const entry = await JournalEntry.findById(entryId);
        if (!entry) {
            return res.status(404).json({ error: 'Entry not found' });
        }
        
        const newComment = new Comment({
            entry: entryId,
            user: req.user.userId,
            content,
            replyTo: replyTo || null
        });
        
        await newComment.save();
        
        // Add comment to entry's comments array
        await JournalEntry.findByIdAndUpdate(entryId, {
            $push: { comments: newComment._id }
        });
        
        const populatedComment = await Comment.findById(newComment._id)
            .populate('user', 'username firstName lastName avatar');
        
        res.status(201).json(populatedComment);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

// Delete comment
router.delete('/:entryId/comments/:commentId', verifyToken, async (req, res) => {
    try {
        const { entryId, commentId } = req.params;
        
        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        
        // Check if user owns the comment or the entry
        const entry = await JournalEntry.findById(entryId).populate('trip');
        const isCommentOwner = comment.user.toString() === req.user.userId;
        const isEntryOwner = entry.trip.user.toString() === req.user.userId;
        
        if (!isCommentOwner && !isEntryOwner) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        // Remove comment from entry's comments array
        await JournalEntry.findByIdAndUpdate(entryId, {
            $pull: { comments: commentId }
        });
        
        await Comment.findByIdAndDelete(commentId);
        
        res.json({ message: 'Comment deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete comment' });
    }
});

module.exports = router;

