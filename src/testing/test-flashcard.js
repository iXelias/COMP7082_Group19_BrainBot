const mongoose = require('mongoose');
const connectDatabase = require('../database');
const Deck = require('../models/deck');
const Flashcard = require('../models/flashcard');

async function run() {
  await connectDatabase();

  const deck = await Deck.create({ title: 'Card Test Deck', ownerId: '12345' });

  // Should fail: no deck, question or answer
  try {
    await Flashcard.create({});
  } catch (error) {
    console.log('Rejected as expected:', error.message);
  }

  // Should succeed
  const card = await Flashcard.create({
    deckId: deck._id,
    question: 'What does CPU stand for?',
    answer: 'Central Processing Unit',
  });
  console.log('Saved card:', card.question);

  // Clean up
  await Flashcard.deleteMany({ deckId: deck._id });
  await Deck.deleteOne({ _id: deck._id });
  await mongoose.disconnect();
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});