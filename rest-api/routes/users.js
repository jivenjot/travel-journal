const express = require('express');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// Update user profile
router.put('/profile', verifyToken, async (req, res) => {
    try {
        const { firstName, lastName, bio, location, avatar, privacySettings } = req.body;
        
        const updatedUser = await User.findByIdAndUpdate(
            req.user.userId,
            {
                firstName,
                lastName,
                bio,
                location,
                avatar,
                privacySettings
            },
            { new: true }
        ).select('-passwordHash');
        
        res.json(updatedUser);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Get current user's profile (must come before /:id route)
router.get("/profile", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .select('-passwordHash')
            .populate('followers', 'username firstName lastName avatar')
            .populate('following', 'username firstName lastName avatar');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Get user profile by ID
router.get("/:id", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-passwordHash')
            .populate('followers', 'username firstName lastName avatar')
            .populate('following', 'username firstName lastName avatar');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Follow/unfollow user
router.post('/:id/follow', verifyToken, async (req, res) => {
    try {
        const targetUserId = req.params.id;
        const currentUserId = req.user.userId;
        
        if (targetUserId === currentUserId) {
            return res.status(400).json({ error: 'Cannot follow yourself' });
        }
        
        const targetUser = await User.findById(targetUserId);
        const currentUser = await User.findById(currentUserId);
        
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const isFollowing = currentUser.following.includes(targetUserId);
        
        if (isFollowing) {
            // Unfollow
            await User.findByIdAndUpdate(currentUserId, {
                $pull: { following: targetUserId }
            });
            await User.findByIdAndUpdate(targetUserId, {
                $pull: { followers: currentUserId }
            });
        } else {
            // Follow
            await User.findByIdAndUpdate(currentUserId, {
                $push: { following: targetUserId }
            });
            await User.findByIdAndUpdate(targetUserId, {
                $push: { followers: currentUserId }
            });
        }
        
        res.json({ 
            following: !isFollowing,
            message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to follow/unfollow user' });
    }
});

// Get user's followers
router.get('/:id/followers', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('followers', 'username firstName lastName avatar')
            .select('followers');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(user.followers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch followers' });
    }
});

// Get users being followed
router.get('/:id/following', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('following', 'username firstName lastName avatar')
            .select('following');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(user.following);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch following' });
    }
});

// Search users
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ error: 'Search query is required' });
        }
        
        const users = await User.find({
            $or: [
                { username: { $regex: q, $options: 'i' } },
                { firstName: { $regex: q, $options: 'i' } },
                { lastName: { $regex: q, $options: 'i' } }
            ]
        })
        .select('username firstName lastName avatar travelStatistics')
        .limit(20);
        
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to search users' });
    }
});

module.exports = router;

