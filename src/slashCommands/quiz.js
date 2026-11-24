const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { getDeckById, listAvailableDecks } = require('../services/deckService');
const { listFlashcardsByDeck } = require('../services/flashcardService');

module.exports =
{
    data: new SlashCommandBuilder()
        .setName('quiz')
        .setDescription('Start an interactive flashcard quiz session for a deck')
        .addStringOption(option => option.setName('deck')
            .setDescription('Select the deck you want to study')
            .setRequired(true)
            .setAutocomplete(true))
        .addBooleanOption(option => option.setName('in-order')
            .setDescription('Set to True to study cards in original order instead of random')
            .setRequired(false)),

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
        const inOrder = interaction.options.getBoolean('in-order') ?? false;
        const deck = await getDeckById(deckId);

        if (!deck)
            return await interaction.reply({ content: 'Could not find that deck.', ephemeral: true });

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
                content: `The deck **"${ deck.title }"** has no flashcards yet! Use \`/create-card\` to add some.`,
                ephemeral: true
            });
        }

        if (!inOrder)
        {
            for (let i = cards.length - 1; i > 0; i--)
            {
                const j = Math.floor(Math.random() * (i + 1));
                [cards[i], cards[j]] = [cards[j], cards[i]];
            }
        }

        let currentIndex = 0;
        let rightCount = 0;
        let wrongCount = 0;
        let skippedCount = 0;

        function buildQuestionView(index)
        {
            const card = cards[index];
            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`Quiz: ${ deck.title }`)
                .setDescription(`**Question:**\n${ card.question }`)
                .setFooter({ text: `Card ${ index + 1 } of ${ cards.length }` });

            if (card.imageUrl)
                embed.setImage(card.imageUrl);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('quiz_reveal')
                    .setLabel('Reveal Answer')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('quiz_skip')
                    .setLabel('Skip')
                    .setStyle(ButtonStyle.Secondary)
            );

            return { embeds: [embed], components: [row] };
        }

        function buildAnswerView(index)
        {
            const card = cards[index];
            const embed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle(`Quiz: ${ deck.title }`)
                .addFields(
                    { name: 'Question', value: card.question },
                    { name: 'Answer', value: card.answer }
                )
                .setFooter({ text: `Did you get it right?` });

            if (card.imageUrl)
                embed.setImage(card.imageUrl);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('quiz_correct')
                    .setLabel('Correct')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('quiz_incorrect')
                    .setLabel('Incorrect')
                    .setStyle(ButtonStyle.Danger)
            );

            return { embeds: [embed], components: [row] };
        }

        const response = await interaction.reply({
            ...buildQuestionView(currentIndex),
            ephemeral: true,
            fetchReply: true
        });

        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 15 * 60 * 1000
        });

        collector.on('collect', async buttonInteraction =>
        {
            if (buttonInteraction.customId === 'quiz_reveal')
                return await buttonInteraction.update(buildAnswerView(currentIndex));

            if (buttonInteraction.customId === 'quiz_correct')
                rightCount++;
            else if (buttonInteraction.customId === 'quiz_incorrect')
                wrongCount++;
            else if (buttonInteraction.customId === 'quiz_skip')
                skippedCount++;

            currentIndex++;

            if (!(currentIndex < cards.length))
            {
                const answeredCount = rightCount + wrongCount;
                const percentage = answeredCount > 0 ? Math.round((rightCount / answeredCount) * 100) : 0;

                const summaryEmbed = new EmbedBuilder()
                    .setColor(0x00CC66)
                    .setTitle(`Quiz Complete: ${ deck.title }`)
                    .setDescription(`You finished reviewing **${ cards.length }** flashcards!`)
                    .addFields(
                        { name: 'Correct', value: `${ rightCount }`, inline: true },
                        { name: 'Incorrect', value: `${ wrongCount }`, inline: true },
                        { name: 'Skipped', value: `${ skippedCount }`, inline: true },
                        { name: 'Accuracy', value: `${ percentage }%`, inline: true }
                    );

                await buttonInteraction.update({ embeds: [summaryEmbed], components: [] });
                collector.stop('completed');
            }
            else
                await buttonInteraction.update(buildQuestionView(currentIndex));
        });

        collector.on('end', async (_, reason) =>
        {
            if (reason === 'time')
            {
                await interaction.editReply({
                    content: 'Quiz session timed out after 15 minutes of inactivity.',
                    components: []
                }).catch(() => { });
            }
        });
    }
};
