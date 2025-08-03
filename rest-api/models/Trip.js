const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    destination: { type: String, required: true },
    destinationCoordinates: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true }
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    privacy: { 
        type: String, 
        enum: ['public', 'private', 'friends'], 
        default: 'public' 
    },
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    entries: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'JournalEntry' 
    }],
    tags: [{ type: String }],
    coverPhoto: { type: String, default: '' }
}, { timestamps: true });

const Trip = mongoose.model('Trip', tripSchema);
module.exports = Trip;

