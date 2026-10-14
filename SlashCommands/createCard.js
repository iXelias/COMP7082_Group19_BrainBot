const { SlashCommandBuilder } = require('discord.js');

module.exports = 
{
    data: new SlashCommandBuilder()
        .setName('create-card')
        .setDescription('Create a new flashcard for studying')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('The question or term on the front of the card')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('answer')
                .setDescription('The answer or definition on the back of the card')
                .setRequired(true)),

    async execute(interaction, flashcardsDatabase)
    {
        const question = interaction.options.getString('question');
        const answer = interaction.options.getString('answer');
        const userId = interaction.user.id;

        if (!flashcardsDatabase.has(userId))        
            flashcardsDatabase.set(userId, []);        

        flashcardsDatabase.get(userId).push({ question, answer });

        await interaction.reply(
        {
            content: `Flashcard created successfully!\n**Q:** ${ question }\n**A:** ${ answer }`,
            ephemeral: true
        });
    }
};
