const { SlashCommandBuilder } = require('discord.js');
const { createDeck } = require('../services/deckService');

module.exports =
{
    data: new SlashCommandBuilder()
        .setName('create-deck')
        .setDescription('Create a new deck to organize your flashcards')
        .addStringOption(option => option.setName('title')
            .setDescription('The name of the deck (max 100 characters)')
            .setMaxLength(100)
            .setRequired(true))
        .addStringOption(option => option.setName('topic')
            .setDescription('Subject or category (e.g., Computer Science, Biology)')
            .setRequired(false))
        .addStringOption(option => option.setName('description')
            .setDescription('Optional summary of what this deck covers (max 300 characters)')
            .setMaxLength(300)
            .setRequired(false)),

    async execute(interaction)
    {
        const title = interaction.options.getString('title');
        const topic = interaction.options.getString('topic') || undefined;
        const description = interaction.options.getString('description') || undefined;
        const ownerId = interaction.user.id;

        try
        {
            const newDeck = await createDeck({ title, description, topic, ownerId });

            await interaction.reply({ content: `Deck **"${ newDeck.title }"** created successfully!\n**Deck ID:** \`${ newDeck._id }\`\n*(Copy this ID to use with \`/create-card\` and \`/quiz\`)*`, ephemeral: true });
        }
        catch (error)
        {
            await interaction.reply({ content: `Error: ${ error.message }`, ephemeral: true });
        }
    }
};
