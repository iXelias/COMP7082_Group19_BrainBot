const mongoose = require('mongoose');
const connectDatabase = require('../database');
const Deck = require('../models/deck');

async function run() {
  await connectDatabase();

  // Should fail: no title and no owner
  try {
    await Deck.create({});
  } catch (error) {
    console.log('Rejected as expected:', error.message);
  }

  // Should succeed
  const deck = await Deck.create({ title: 'Test Deck', ownerId: '12345' });
  console.log('Saved deck:', deck.title, deck._id.toString());

  // Clean up the test deck
  await Deck.deleteOne({ _id: deck._id });
  await mongoose.disconnect();
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});