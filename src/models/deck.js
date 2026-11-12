const mongoose = require('mongoose');

const deckSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'A deck needs a title.'],
            trim: true,
            minlength: [1, 'The title cannot be empty.'],
            maxlength: [100, 'The title exceeds the 100 character limit.'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [300, 'The description exceeds the 300 character limit'],
        },
        topic: {
            type: String,
            trim: true,
        },
        ownerId: {
            type: String,
            required: [true, 'A deck needs an owner.'],
        },
    },
    { timestamps: true }
);

deckSchema.index(
    { ownerId: 1, title: 1 },
    { unique: true, collation: { locale: 'en', strength: 2 } }
)

module.exports = mongoose.model('Deck', deckSchema);
