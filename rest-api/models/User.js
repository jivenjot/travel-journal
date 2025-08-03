const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
username: { type: String, required: true, unique: true },
email: { type: String, required: true, unique: true },
passwordHash: { type: String, required: true },
firstName: { type: String, default: '' },
lastName: { type: String, default: '' },
bio: { type: String, default: '' },
location: { type: String, default: '' },
avatar: { type: String, default: '' },
privacySettings: {
    profileVisibility: { type: String, enum: ['public', 'private', 'friends'], default: 'public' },
    tripsVisibility: { type: String, enum: ['public', 'private', 'friends'], default: 'public' }
},
travelStatistics: {
    countriesVisited: { type: Number, default: 0 },
    totalTrips: { type: Number, default: 0 },
    totalDistance: { type: Number, default: 0 }
},
followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });
const User = mongoose.model('User', userSchema);
module.exports = User;