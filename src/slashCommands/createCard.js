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
            .setRequired(true))
        .addAttachmentOption(option => option.setName('image')
            .setDescription('Optional: Attach an image or diagram to this flashcard')
            .setRequired(false)),

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
        const attachment = interaction.options.getAttachment('image');
        const ownerId = interaction.user.id;

        // Validate that the uploaded file is an image
        if (attachment && !attachment.contentType?.startsWith('image/'))
        {
            return await interaction.reply(
            {
                content: 'Error: The attached file must be an image (PNG, JPG, GIF, or WebP).',
                flags: MessageFlags.Ephemeral
            });
        }

        const imageUrl = attachment ? attachment.url : null;

        try
        {
            await addFlashcard({ deckId, ownerId, question, answer, imageUrl });

            await interaction.reply(
            {
                content: `Flashcard created successfully!\n**Q:** ${ question }\n**A:** ${ answer }${ imageUrl ? '\n*(Image attached)*' : '' }`,
                flags: MessageFlags.Ephemeral
            });
        }
        catch (error)
        {
            await interaction.reply({ content: `Error: ${ error.message }`, flags: MessageFlags.Ephemeral });
        }
    }
};
