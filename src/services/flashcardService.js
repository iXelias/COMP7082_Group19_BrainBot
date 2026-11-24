const mongoose = require('mongoose');
const Flashcard = require('../models/flashcard');
const { getDeckById } = require('./deckService');

async function addFlashcard({ deckId, ownerId, question, answer, imageUrl = null })
{
    const deck = await getDeckById(deckId);
    if (!deck)
        throw new Error('That deck does not exist.');

    if (deck.ownerId !== ownerId)
        throw new Error('You can only add cards to your own decks.');

    const trimmedQuestion = question.trim();
    const existingCard = await Flashcard.findOne({ deckId: deck._id, question: trimmedQuestion })
        .collation({ locale: 'en', strength: 2 });

    if (existingCard)
        throw new Error('This deck already has a flashcard with that question.');

    try
    {
        return await Flashcard.create({ deckId: deck._id, question, answer, imageUrl });
    }
    catch (error)
    {
        if (error.code === 11000)
            throw new Error('This deck already has a flashcard with that question.');

        throw error;
    }
}

async function updateFlashcard({ cardId, ownerId, question, answer, imageUrl })
{
    if (!mongoose.isValidObjectId(cardId))
        throw new Error('Invalid flashcard ID.');

    const card = await Flashcard.findById(cardId);
    if (!card)
        throw new Error('That flashcard does not exist.');

    const deck = await getDeckById(card.deckId);
    if (!deck || deck.ownerId !== ownerId)
        throw new Error('You can only edit cards in your own decks.');

    if (question !== undefined)
    {
        const trimmedQuestion = question.trim();
        const duplicate = await Flashcard.findOne(
        {
            _id: { $ne: card._id },
            deckId: deck._id,
            question: trimmedQuestion
        }).collation({ locale: 'en', strength: 2 });

        if (duplicate)
            throw new Error('This deck already has another flashcard with that question.');

        card.question = trimmedQuestion;
    }

    if (answer !== undefined)
        card.answer = answer.trim();

    if (imageUrl !== undefined)
        card.imageUrl = imageUrl;

    await card.save();
    return card;
}

async function listFlashcardsByDeck(deckId)
{
    if (!mongoose.isValidObjectId(deckId)) 
        return [];
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

module.exports = { addFlashcard, listFlashcardsByDeck, updateFlashcard, deleteFlashcard };
