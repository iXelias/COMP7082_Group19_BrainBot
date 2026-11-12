const { SlashCommandBuilder } = require('discord.js');
const { deleteDeck, listDecksByOwner } = require('../services/deckService');

module.exports =
{
    data: new SlashCommandBuilder()
        .setName('delete-deck')
        .setDescription('Permanently delete a deck and all its flashcards')
        .addStringOption(option => option.setName('deck')
            .setDescription('Select the deck to delete')
            .setRequired(true)
            .setAutocomplete(true)),

    async autocomplete(interaction)
    {
        const focusedValue = interaction.options.getFocused().toLowerCase();
        const decks = await listDecksByOwner(interaction.user.id);

        const filtered = decks.filter(deck => deck.title.toLowerCase().includes(focusedValue)).slice(0, 25);

        await interaction.respond(filtered.map(deck =>
        ({
            name: deck.title,
            value: deck._id.toString()
        })));
    },

    async execute(interaction)
    {
        const deckId = interaction.options.getString('deck').trim();
        const ownerId = interaction.user.id;

        try
        {
            const deletedDeck = await deleteDeck({ deckId, ownerId });

            await interaction.reply({ content: `Deleted deck **"${ deletedDeck.title }"** and all of its flashcards.`, ephemeral: true });
        }
        catch (error)
        {
            await interaction.reply({ content: `Error: ${ error.message }`, ephemeral: true });
        }
    }
};
