const mongoose = require('mongoose');
const Flashcard = require('../models/flashcard');
const { getDeckById } = require('./deckService');

async function addFlashcard({ deckId, ownerId, question, answer })
{
    const deck = await getDeckById(deckId);
    if (!deck)
        throw new Error('That deck does not exist.');

    if (deck.ownerId !== ownerId)
        throw new Error('You can only add cards to your own decks.');

    return Flashcard.create({ deckId: deck._id, question, answer });
}

async function listFlashcardsByDeck(deckId)
{
    if (!mongoose.isValidObjectId(deckId)) return [];
    return Flashcard.find({ deckId }).sort({ createdAt: 1 });
}

async function deleteFlashcard({ cardId, ownerId })
{
    if (!mongoose.isValidObjectId(cardId))
        throw new Error('Invalid flashcard ID.');

    const card = await Flashcard.findById(cardId);
    if (!card)
        throw new Error('That flashcard does not exist.');

    const deck = await getDeckById(card.deckId);
    if (!deck || deck.ownerId !== ownerId)
        throw new Error('You can only delete cards from your own decks.');

    await Flashcard.deleteOne({ _id: card._id });
    return card;
}

module.exports = { addFlashcard, listFlashcardsByDeck, deleteFlashcard };
