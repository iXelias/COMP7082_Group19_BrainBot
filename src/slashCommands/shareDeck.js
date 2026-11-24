const { SlashCommandBuilder } = require('discord.js');
const { listDecksByOwner, shareDeck } = require('../services/deckService');

module.exports =
{
    data: new SlashCommandBuilder()
        .setName('share-deck')
        .setDescription('Share one of your decks with everyone in this Discord server')
        .addStringOption(option =>
            option.setName('deck')
                .setDescription('Select the deck you want to share')
                .setRequired(true)
                .setAutocomplete(true)),

    async autocomplete(interaction)
    {
        const focusedValue = interaction.options.getFocused().toLowerCase();
        // Only show decks owned by the user (since only creators can share)
        const decks = await listDecksByOwner(interaction.user.id);

        const filtered = decks.filter(deck => deck.title.toLowerCase().includes(focusedValue)).slice(0, 25);

        await interaction.respond(filtered.map(deck => 
        ({
            name: deck.isShared ? `${ deck.title } (Already Shared)` : deck.title,
            value: deck._id.toString()
        })));
    },

    async execute(interaction)
    {
        const deckId = interaction.options.getString('deck').trim();
        const ownerId = interaction.user.id;
        const guildId = interaction.guildId;

        try
        {
            const shared = await shareDeck({ deckId, ownerId, guildId });

            await interaction.reply(
                {
                    content: `**${ interaction.user.username }** shared the deck **"${ shared.title }"** with the server! Anyone here can now view and review it.`
                });
        }
        catch (error)
        {
            await interaction.reply({ content: `Error: ${ error.message }`, ephemeral: true });
        }
    }
};
