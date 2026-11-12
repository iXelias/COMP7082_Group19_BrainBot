const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getDeckById, listDecksByOwner } = require('../services/deckService');
const { listFlashcardsByDeck } = require('../services/flashcardService');

module.exports =
{
    data: new SlashCommandBuilder()
        .setName('quiz')
        .setDescription('Quiz yourself on a specific flashcard deck')
        .addStringOption(option => option.setName('deck')
            .setDescription('Select the deck you want to study')
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

        const deck = await getDeckById(deckId);
        if (!deck)
            return await interaction.reply({ content: 'Could not find that deck. Please select a valid deck from the dropdown.', ephemeral: true });

        const deckCards = await listFlashcardsByDeck(deckId);

        if (!deckCards || deckCards.length === 0)
            return await interaction.reply({ content: `The deck **"${ deck.title }"** doesn't have any flashcards yet! Use \`/create-card\` to add some.`, ephemeral: true });

        const randomCard = deckCards[Math.floor(Math.random() * deckCards.length)];

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`BrainBot Quiz: ${ deck.title }`)
            .setDescription(`**Question:**\n${ randomCard.question }`)
            .setFooter({ text: 'Think about the answer, then click below to reveal!' });

        const safeAnswer = randomCard.answer.substring(0, 90);

        const revealButton = new ButtonBuilder()
            .setCustomId(`reveal_${ safeAnswer }`)
            .setLabel('Reveal Answer')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(revealButton);

        await interaction.reply({ embeds: [embed], components: [row] });
    }
};
