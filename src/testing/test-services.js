const mongoose = require('mongoose');
const connectDatabase = require('../database');
const Deck = require('../models/deck');
const Flashcard = require('../models/flashcard');
const { createDeck, getDeckById, listDecksByOwner } = require('../services/deckService');
const { addFlashcard, listFlashcardsByDeck } = require('../services/flashcardService');

async function run()
{
    await connectDatabase();
    await Deck.init();

    const deck = await createDeck({ title: 'Service Test', ownerId: 'userA' });
    console.log('Created deck:', deck.title);

    const found = await getDeckById(deck._id);
    console.log('Found deck:', found.title);

    const decks = await listDecksByOwner('userA');
    console.log('userA has', decks.length, 'deck(s)');

    try
    {
        await createDeck({ title: 'Service Test', ownerId: 'userA' });
    } 
    catch (e)
    {
        console.log('Duplicate rejected:', e.message);
    }

    await addFlashcard({ deckId: deck._id, ownerId: 'userA', question: 'Q1', answer: 'A1' });
    await addFlashcard({ deckId: deck._id, ownerId: 'userA', question: 'Q2', answer: 'A2' });
    const cards = await listFlashcardsByDeck(deck._id);
    console.log('Deck has', cards.length, 'cards');

    try
    {
        await addFlashcard({ deckId: new mongoose.Types.ObjectId(), ownerId: 'userA', question: 'Q', answer: 'A' });
    } 
    catch (e)
    {
        console.log('Missing deck rejected:', e.message);
    }

    try
    {
        await addFlashcard({ deckId: deck._id, ownerId: 'userB', question: 'Q', answer: 'A' });
    } 
    catch (e)
    {
        console.log('Wrong owner rejected:', e.message);
    }

    await Flashcard.deleteMany({ deckId: deck._id });
    await Deck.deleteOne({ _id: deck._id });
    await mongoose.disconnect();
}

run().catch((error) =>
{
    console.error(error.message);
    process.exit(1);
});
