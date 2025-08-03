const express = require('express');
let flights = require('../data/flights');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const Flight = require('../models/Flight')

// router.get('/', (req, res) => {
//     res.json(flights);
// })


router.get('/', async (req, res) => {
    try {
        const { from, to } = req.query;
        // const page = parseInt(req.query.page) || 1;
        // const limit = parseInt(req.query.limit) || 5;

        const filter = {};
        // let filtered = flights;

        if (from) {
            filter.from = from;
        }
        if (to) {
            filter.to = to;
        }
        const flights = await Flight.find(filter);
        res.json(flights.map(f => ({ ...f._doc, id: f._id })));
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch flights" });
    }
})
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests, try again later.'
});
router.use(limiter);
router.get('/:id', async (req, res) => {
    try {
        const f = await Flight.findById(req.params.id);
        f ? res.json({ ...f._doc, id: f._id }) :
            res.status(400).json({ error: "flight not found" })
    } catch {
        res.status(400).json({ error: "Inavlid ID" });
    }
})
router.post('/'
    , async (req, res) => {
        try {
            console.log("POst body");
            const newFlight = new Flight(req.body);
            const saved = await newFlight.save();
            res.status(201).json({
                ...saved.
                    _doc, id: saved._id
            });
        } catch {
            res.status(400).json({ error: 'Invalid input' });
        }
    });
router.delete('/:id'
    , async (req, res) => {
        try {
            const deleted = await
                Flight.findByIdAndDelete(req.params.id);
            deleted ? res.json({ message: 'Flight deleted' }) :
                res.status(404).json({ error: 'Not found' });
        } catch {
            res.status(400).json({ error: 'Invalid ID' });
        }
    });
module.exports = router;