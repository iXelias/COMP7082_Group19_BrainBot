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

// ADDED: Fetch user's own decks OR decks shared in this specific Discord server
async function listAvailableDecks(ownerId, guildId)
{
    return Deck.find({ $or: 
    [
        { ownerId },
        { isShared: true, guildId }
    ]}).sort({ createdAt: -1 });
}

// ADDED: Allow the creator to share their deck with the current server
async function shareDeck({ deckId, ownerId, guildId })
{
    const deck = await getDeckById(deckId);
    if (!deck)
        throw new Error('That deck does not exist.');

    if (deck.ownerId !== ownerId)
        throw new Error('Only the deck creator can share this deck.');

    if (!guildId)
        throw new Error('You can only share a deck inside a Discord server.');

    deck.isShared = true;
    deck.guildId = guildId;
    await deck.save();
    return deck;
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

module.exports = { createDeck, getDeckById, listDecksByOwner, listAvailableDecks, shareDeck, deleteDeck };
