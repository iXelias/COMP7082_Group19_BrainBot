const mongoose = require('mongoose');
const Deck = require('../models/deck');

async function createDeck({ title, description, topic, ownerId }) {
  try {
    return await Deck.create({ title, description, topic, ownerId });
  } catch (error) {
    if (error.code === 11000) {
      throw new Error('You already have a deck with that title.');
    }
    throw error;
  }
}

async function getDeckById(deckId) {
  if (!mongoose.isValidObjectId(deckId)) {
    return null;
  }
  return Deck.findById(deckId);
}

async function listDecksByOwner(ownerId) {
  return Deck.find({ ownerId }).sort({ createdAt: -1 });
}

module.exports = { createDeck, getDeckById, listDecksByOwner };