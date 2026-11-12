const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { listDecksByOwner } = require('../services/deckService');

module.exports =
{
    data: new SlashCommandBuilder().setName('list-decks').setDescription('View all of your saved flashcard decks and their IDs'),

    async execute(interaction)
    {
        const ownerId = interaction.user.id;

        try
        {
            const decks = await listDecksByOwner(ownerId);

            if (!decks || decks.length === 0)            
                return await interaction.reply({ content: "You don't have any decks yet! Use `/create-deck` to make your first one.", ephemeral: true });            

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`${ interaction.user.username }'s Flashcard Decks`)
                .setFooter({ text: 'Copy a Deck ID to add cards or start a quiz.' });

            decks.forEach(deck =>
            {
                const topicText = deck.topic ? ` | Topic: ${ deck.topic }` : '';
                const descText = deck.description ? `\n*${ deck.description }*` : '';

                embed.addFields({ name: `${ deck.title }${ topicText }`,value: `**ID:** \`${ deck._id }\`${ descText }` });
            });

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
        catch (error)
        {
            console.error('Error listing decks:', error);
            await interaction.reply({ content: 'There was an error retrieving your decks.', ephemeral: true });
        }
    }
};
