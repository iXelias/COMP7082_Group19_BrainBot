const mongoose = require('mongoose');
const Deck = require('../models/deck');
const Flashcard = require('../models/flashcard');

async function createDeck({ title, description, topic, ownerId })
{
    try
    {
        return await Deck.create({ title, description, topic, ownerId });
    }
    catch (error)
    {
        if (error.code === 11000)
            throw new Error('You already have a deck with that title.');

        throw error;
    }
}

async function getDeckById(deckId)
{
    if (!mongoose.isValidObjectId(deckId))
        return null;

    return Deck.findById(deckId);
}

async function listDecksByOwner(ownerId)
{
    return Deck.find({ ownerId }).sort({ createdAt: -1 });
}

async function deleteDeck({ deckId, ownerId })
{
    const deck = await getDeckById(deckId);
    if (!deck)
        throw new Error('That deck does not exist.');

    if (deck.ownerId !== ownerId)
        throw new Error('You can only delete your own decks.');

    await Flashcard.deleteMany({ deckId: deck._id });
    await Deck.deleteOne({ _id: deck._id });
    return deck;
}

module.exports = { createDeck, getDeckById, listDecksByOwner, deleteDeck };
