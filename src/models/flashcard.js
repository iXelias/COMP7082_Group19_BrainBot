const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema(
    {
        deckId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Deck',
            required: [true, 'A flashcard must belong to a deck.'],
            index: true,
        },
        question: {
            type: String,
            required: [true, 'A flashcard needs a question.'],
            trim: true,
            minlength: [1, 'The question cannot be empty.'],
            maxlength: [500, 'The question exceeds the 500 character limit.'],
        },
        answer: {
            type: String,
            required: [true, 'A flashcard needs an answer.'],
            trim: true,
            minlength: [1, 'The answer cannot be empty.'],
            maxlength: [500, 'The answer exceeds the 500 character limit.'],
        },
        imageUrl: {
            type: String,
            default: null,
        },
    },
    { timestamps: true }
);

flashcardSchema.index(
    { deckId: 1, question: 1 },
    { unique: true, collation: { locale: 'en', strength: 2 } }
);

module.exports = mongoose.model('flashcard', flashcardSchema);
