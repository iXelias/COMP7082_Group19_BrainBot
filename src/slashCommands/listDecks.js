const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { listAvailableDecks } = require('../services/deckService');

module.exports =
{
    data: new SlashCommandBuilder()
        .setName('list-decks')
        .setDescription('View your decks and decks shared by classmates in this server'),

    async execute(interaction)
    {
        const ownerId = interaction.user.id;
        const guildId = interaction.guildId;

        try
        {
            const decks = await listAvailableDecks(ownerId, guildId);

            if (!decks || decks.length === 0)
            {
                return await interaction.reply(
                    {
                        content: "No decks found! Use `/create-deck` to make your first one.",
                        ephemeral: true
                    });
            }

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`Available Flashcard Decks (${ decks.length })`)
                .setFooter({ text: 'Use /review or /list-cards to study any of these decks.' });

            // Cache usernames so we don't fetch the same creator twice
            const userCache = new Map();

            for (const deck of decks.slice(0, 25))
            {
                let creatorLabel = 'You';
                if (deck.ownerId !== ownerId)
                {
                    if (!userCache.has(deck.ownerId))
                    {
                        try
                        {
                            const creator = await interaction.client.users.fetch(deck.ownerId);
                            userCache.set(deck.ownerId, creator.username);
                        }
                        catch
                        {
                            userCache.set(deck.ownerId, 'Unknown Student');
                        }
                    }
                    creatorLabel = `Shared by **${ userCache.get(deck.ownerId) }**`;
                }
                else if (deck.isShared)
                {
                    creatorLabel = 'You (Shared with server)';
                }

                const topicText = deck.topic ? ` | Topic: ${ deck.topic }` : '';
                const descText = deck.description ? `\n*${ deck.description }*` : '';

                embed.addFields(
                    {
                        name: `${ deck.title } — ${ creatorLabel }`,
                        value: `**ID:** \`${ deck._id }\`${ topicText }${ descText }`
                    });
            }

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
        catch (error)
        {
            console.error('Error listing decks:', error);
            await interaction.reply(
                {
                    content: 'There was an error retrieving the decks.',
                    ephemeral: true
                });
        }
    }
};
