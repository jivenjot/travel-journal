const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    entry: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'JournalEntry', 
        required: true 
    },
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    content: { type: String, required: true },
    replyTo: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Comment',
        default: null 
    },
    likes: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }]
}, { timestamps: true });

const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;

