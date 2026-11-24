const { SlashCommandBuilder } = require('discord.js');
const { listDecksByOwner } = require('../services/deckService');
const { listFlashcardsByDeck, updateFlashcard } = require('../services/flashcardService');

module.exports =
{
    data: new SlashCommandBuilder()
        .setName('edit-card')
        .setDescription('Edit an existing flashcard in one of your decks')
        .addStringOption(option => option.setName('deck')
            .setDescription('Select the deck containing the card')
            .setRequired(true)
            .setAutocomplete(true))
        .addStringOption(option => option.setName('card')
            .setDescription('Select the flashcard to edit')
            .setRequired(true)
            .setAutocomplete(true))
        .addStringOption(option => option.setName('question')
            .setDescription('New question text (leave blank to keep current)')
            .setMaxLength(500)
            .setRequired(false))
        .addStringOption(option => option.setName('answer')
            .setDescription('New answer text (leave blank to keep current)')
            .setMaxLength(500)
            .setRequired(false))
        .addAttachmentOption(option => option.setName('image')
            .setDescription('New image attachment (leave blank to keep current)')
            .setRequired(false))
        .addBooleanOption(option => option.setName('remove-image')
            .setDescription('Set to True to remove the existing image from this card')
            .setRequired(false)),

    async autocomplete(interaction)
    {
        const focusedOption = interaction.options.getFocused(true);

        if (focusedOption.name === 'deck')
        {
            const decks = await listDecksByOwner(interaction.user.id);
            const filtered = decks.filter(deck => deck.title.toLowerCase().includes(focusedOption.value.toLowerCase())).slice(0, 25);

            return await interaction.respond(filtered.map(deck => (
            {
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

            return await interaction.respond(filtered.map(card => (
            {
                name: card.question.substring(0, 100),
                value: card._id.toString()
            })));
        }
    },

    async execute(interaction)
    {
        const cardId = interaction.options.getString('card').trim();
        const newQuestion = interaction.options.getString('question') ?? undefined;
        const newAnswer = interaction.options.getString('answer') ?? undefined;
        const attachment = interaction.options.getAttachment('image');
        const removeImage = interaction.options.getBoolean('remove-image') ?? false;
        const ownerId = interaction.user.id;

        if (!newQuestion && !newAnswer && !attachment && !removeImage)
        {
            return await interaction.reply(
            {
                content: 'You did not provide any changes. Fill in at least one option (`question`, `answer`, `image`, or `remove-image`).',
                    flags: MessageFlags.Ephemeral
            });
        }

        if (attachment && !attachment.contentType?.startsWith('image/'))
        {
            return await interaction.reply(
            {
                content: 'Error: The attached file must be an image (PNG, JPG, GIF, or WebP).',
                flags: MessageFlags.Ephemeral
            });
        }

        let imageUrl = undefined;
        if (removeImage)
            imageUrl = null;
        else if (attachment)
            imageUrl = attachment.url;

        try
        {
            const updated = await updateFlashcard({
                cardId,
                ownerId,
                question: newQuestion,
                answer: newAnswer,
                imageUrl
            });

            await interaction.reply(
            {
                content: `Flashcard updated successfully!\n**Q:** ${ updated.question }\n**A:** ${ updated.answer }${ updated.imageUrl ? '\n*(Image attached)*' : '' }`,
                flags: MessageFlags.Ephemeral
            });
        }
        catch (error)
        {
            await interaction.reply({ content: `Error: ${ error.message }`, flags: MessageFlags.Ephemeral });
        }
    }
};
