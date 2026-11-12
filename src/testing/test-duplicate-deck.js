const mongoose = require('mongoose');
const connectDatabase = require('../database');
const Deck = require('../models/deck');

async function run() {
  await connectDatabase();
  await Deck.init(); // make sure the index exists before testing

  const first = await Deck.create({ title: 'Duplicate Test', ownerId: 'userA' });
  console.log('First deck saved');

  // Same owner, same title (different capitals): should be rejected
  try {
    await Deck.create({ title: 'duplicate test', ownerId: 'userA' });
    console.log('PROBLEM: duplicate was saved');
  } catch (error) {
    if (error.code === 11000) {
      console.log('Duplicate rejected as expected');
    } else {
      throw error;
    }
  }

  // Different owner, same title: should be allowed
  const other = await Deck.create({ title: 'Duplicate Test', ownerId: 'userB' });
  console.log('Different owner saved as expected');

  await Deck.deleteMany({ _id: { $in: [first._id, other._id] } });
  await mongoose.disconnect();
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});