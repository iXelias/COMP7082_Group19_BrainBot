const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = 
{
    data: new SlashCommandBuilder().setName('quiz').setDescription('Quiz yourself on your saved flashcards'),

    async execute(interaction, flashcardsDatabase)
    {
        const userId = interaction.user.id;
        const userCards = flashcardsDatabase.get(userId);

        if (!userCards || userCards.length === 0)
        {
            return await interaction.reply(
            {
                content: "You don't have any flashcards yet! Use `/create-card` to make some.",
                ephemeral: true
            });
        }

        const randomCard = userCards[Math.floor(Math.random() * userCards.length)];

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('BrainBot Quiz Time!')
            .setDescription(`**Question:**\n${ randomCard.question }`)
            .setFooter({ text: 'Think about the answer, then click below to reveal!' });

        const revealButton = new ButtonBuilder()
            .setCustomId(`reveal_${ randomCard.answer }`)
            .setLabel('Reveal Answer')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(revealButton);

        await interaction.reply({ embeds: [embed], components: [row] });
    }
};
