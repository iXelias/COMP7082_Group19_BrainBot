const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
// 1. CHANGED: Import listAvailableDecks instead of listDecksByOwner
const { getDeckById, listAvailableDecks } = require('../services/deckService');
const { listFlashcardsByDeck } = require('../services/flashcardService');

module.exports =
{
    data: new SlashCommandBuilder()
        .setName('list-cards')
        .setDescription('View all flashcards inside a deck')
        .addStringOption(option => option.setName('deck')
            .setDescription('Select the deck to inspect')
            .setRequired(true)
            .setAutocomplete(true)),

    async autocomplete(interaction)
    {
        const focusedValue = interaction.options.getFocused().toLowerCase();
        const decks = await listAvailableDecks(interaction.user.id, interaction.guildId);

        const filtered = decks.filter(deck => deck.title.toLowerCase().includes(focusedValue)).slice(0, 25);

        await interaction.respond(
            filtered.map(deck => ({
                name: deck.ownerId === interaction.user.id ? deck.title : `${ deck.title } (Shared)`,
                value: deck._id.toString()
            }))
        );
    },

    async execute(interaction)
    {
        const deckId = interaction.options.getString('deck').trim();
        const deck = await getDeckById(deckId);

        if (!deck)        
            return await interaction.reply({ content: 'Could not find that deck.', ephemeral: true });        

        // 3. ADDED: Verify user owns the deck OR it is shared in this server
        const isOwner = deck.ownerId === interaction.user.id;
        const isSharedHere = deck.isShared && deck.guildId === interaction.guildId;
        if (!isOwner && !isSharedHere)
        {
            return await interaction.reply({ content: 'You do not have access to this private deck.', ephemeral: true });
        }

        const cards = await listFlashcardsByDeck(deckId);

        if (!cards || cards.length === 0)
        {
            return await interaction.reply(
            {
                content: `The deck **"${ deck.title }"** has no flashcards yet. Use \`/create-card\` to add some!`,
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`Flashcards in "${ deck.title }" (${ cards.length })`)
            .setFooter({ text: isOwner ? 'Use /delete-card to remove any card.' : 'Shared server deck (read-only)' });

        cards.slice(0, 25).forEach((card, index) =>
        {
            embed.addFields(
            {
                name: `${ index + 1 }. ${ card.question.substring(0, 200) }`,
                value: `**A:** ${ card.answer.substring(0, 500) }`
            });
        });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
