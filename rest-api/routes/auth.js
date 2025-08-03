const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const JWT_SECRET = 'your_jwt_secret_key';
// replace/move to .env

// Signup
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const existingUser = await User.findOne(
            {
                $or: [{ username }, { email }]
            });
        if (existingUser)
            return res.status(409).json(
                { error: 'Username or email already taken' });
        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = new User({
            username, email, passwordHash
        });
        await newUser.save();
        const token = jwt.sign({ userId: newUser._id },
            JWT_SECRET);
        res.json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Signup failed' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(401).json({
            error: 'Invalidcredentials'
        });
        const isMatch = await bcrypt.compare(password,
            user.passwordHash);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
        const token = jwt.sign({ userId: user._id }, JWT_SECRET);
        res.json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get current user
router.get('/me',verifyToken, async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({
        error: 'Missing token'
    });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await
            User.findById(decoded.userId).select('username email createdAt');
        res.json(user);
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
});
module.exports = router;
