const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getDeckById, listDecksByOwner } = require('../services/deckService');
const { listFlashcardsByDeck } = require('../services/flashcardService');

module.exports =
{
    data: new SlashCommandBuilder()
        .setName('list-cards')
        .setDescription('View your saved flashcards')
        .addStringOption(option => option.setName('deck')
            .setDescription('Optional: Filter cards by a specific deck')
            .setRequired(false)
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
        const deckId = interaction.options.getString('deck');
        const ownerId = interaction.user.id;

        if (deckId)
        {
            const deck = await getDeckById(deckId.trim());
            if (!deck)            
                return await interaction.reply({ content: 'Could not find that deck.', ephemeral: true });            

            const cards = await listFlashcardsByDeck(deckId.trim());
            if (!cards || cards.length === 0)            
                return await interaction.reply({ content: `The deck **"${ deck.title }"** has no flashcards yet.`, ephemeral: true });            

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`Flashcards in "${ deck.title }" (${ cards.length })`)
                .setFooter({ text: 'Use /delete-card to remove any card.' });

            cards.slice(0, 25).forEach((card, index) =>
            {
                embed.addFields({ name: `${ index + 1 }. ${ card.question.substring(0, 200) }`, value: `**A:** ${ card.answer.substring(0, 500) }` });
            });

            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const userDecks = await listDecksByOwner(ownerId);
        if (!userDecks || userDecks.length === 0)        
            return await interaction.reply({ content: "You don't have any decks or flashcards yet! Use `/create-deck` to get started.", ephemeral: true });        

        const allCards = [];
        for (const deck of userDecks)
        {
            const cards = await listFlashcardsByDeck(deck._id);
            cards.forEach(card =>
            {
                allCards.push({ deckTitle: deck.title, question: card.question, answer: card.answer });
            });
        }

        if (allCards.length === 0)        
            return await interaction.reply({ content: "You have decks created, but no flashcards yet! Use `/create-card` to add some.", ephemeral: true });        

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`All Your Flashcards (${ allCards.length })`)
            .setFooter({ text: 'Tip: Select a deck in /list-cards to filter by subject.' });

        allCards.slice(0, 25).forEach((item, index) =>
        {
            embed.addFields({ name: `${ index + 1 }. [${ item.deckTitle }] ${ item.question.substring(0, 180) }`,  value: `**A:** ${ item.answer.substring(0, 500) }` });
        });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
