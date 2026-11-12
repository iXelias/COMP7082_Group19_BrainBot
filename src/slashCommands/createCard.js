const { SlashCommandBuilder } = require('discord.js');
const { addFlashcard } = require('../services/flashcardService');
const { listDecksByOwner } = require('../services/deckService');

module.exports =
{
    data: new SlashCommandBuilder()
        .setName('create-card')
        .setDescription('Create a new flashcard inside one of your decks')
        .addStringOption(option => option.setName('deck')
            .setDescription('Select the deck to add this card to')
            .setRequired(true)
            .setAutocomplete(true))
        .addStringOption(option => option.setName('question')
            .setDescription('The question or term on the front of the card')
            .setRequired(true))
        .addStringOption(option => option.setName('answer')
            .setDescription('The answer or definition on the back of the card')
            .setRequired(true)),

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
        const question = interaction.options.getString('question');
        const answer = interaction.options.getString('answer');
        const ownerId = interaction.user.id;

        try
        {
            await addFlashcard({ deckId, ownerId, question, answer });
            await interaction.reply({ content: `Flashcard created successfully!\n**Q:** ${ question }\n**A:** ${ answer }`, ephemeral: true });
        }
        catch (error)
        {
            await interaction.reply({ content: `Error: ${ error.message }`, ephemeral: true });
        }
    }
};
