const mongoose = require('mongoose');

const journalEntrySchema = new mongoose.Schema({
    trip: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Trip', 
        required: true 
    },
    title: { type: String, required: true },
    content: { type: String, required: true }, // Rich text content
    location: { type: String, default: '' },
    locationCoordinates: {
        latitude: { type: Number },
        longitude: { type: Number }
    },
    photos: [{
        url: { type: String, required: true },
        caption: { type: String, default: '' },
        publicId: { type: String } // For Cloudinary
    }],
    weatherData: {
        temperature: { type: Number },
        description: { type: String },
        humidity: { type: Number },
        windSpeed: { type: Number }
    },
    likes: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    comments: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Comment' 
    }],
    mood: { 
        type: String, 
        enum: ['excited', 'happy', 'relaxed', 'adventurous', 'nostalgic', 'tired', 'amazed', 'peaceful'],
        default: 'happy'
    },
    personalTags: [{ type: String }],
    date: { type: Date, required: true }
}, { timestamps: true });

const JournalEntry = mongoose.model('JournalEntry', journalEntrySchema);
module.exports = JournalEntry;

