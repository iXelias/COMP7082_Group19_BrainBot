const { SlashCommandBuilder } = require('discord.js');
const { listDecksByOwner } = require('../services/deckService');
const { listFlashcardsByDeck, deleteFlashcard } = require('../services/flashcardService');

module.exports =
{
    data: new SlashCommandBuilder()
        .setName('delete-card')
        .setDescription('Delete a specific flashcard from one of your decks')
        .addStringOption(option => option.setName('deck')
            .setDescription('Select the deck containing the card')
            .setRequired(true)
            .setAutocomplete(true))
        .addStringOption(option => option.setName('card')
            .setDescription('Select the flashcard to delete')
            .setRequired(true)
            .setAutocomplete(true)),

    async autocomplete(interaction)
    {
        const focusedOption = interaction.options.getFocused(true);

        if (focusedOption.name === 'deck')
        {
            const decks = await listDecksByOwner(interaction.user.id);
            const filtered = decks.filter(deck => deck.title.toLowerCase().includes(focusedOption.value.toLowerCase())).slice(0, 25);

            return await interaction.respond(filtered.map(deck =>
            ({
                name: deck.title,
                value: deck._id.toString()
            })));
        }

        if (focusedOption.name === 'card')
        {
            const selectedDeckId = interaction.options.getString('deck');
            if (!selectedDeckId)
                return await interaction.respond([]);

            const cards = await listFlashcardsByDeck(selectedDeckId);
            const filtered = cards.filter(card => card.question.toLowerCase().includes(focusedOption.value.toLowerCase())).slice(0, 25);

            return await interaction.respond(filtered.map(card =>
            ({
                name: card.question.substring(0, 100),
                value: card._id.toString()
            })));
        }
    },

    async execute(interaction)
    {
        const cardId = interaction.options.getString('card').trim();
        const ownerId = interaction.user.id;

        try
        {
            const deletedCard = await deleteFlashcard({ cardId, ownerId });

            await interaction.reply({ content: `Deleted flashcard:\n**Q:** ${ deletedCard.question }`, ephemeral: true });
        }
        catch (error)
        {
            await interaction.reply({ content: `Error: ${ error.message }`, ephemeral: true });
        }
    }
};
