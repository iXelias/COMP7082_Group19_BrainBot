const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { createDeck, deleteDeck } = require('../services/deckService');
const { addFlashcard } = require('../services/flashcardService');

module.exports =
{
    data: new SlashCommandBuilder()
        .setName('generate-deck')
        .setDescription('Upload a lecture PDF and let local AI generate a high-quality flashcard deck')
        .addAttachmentOption(option =>
            option.setName('pdf')
                .setDescription('Your lecture slides or study notes (.pdf, max 10MB)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('title')
                .setDescription('Name for the new deck (e.g., Week 4 Lecture)')
                .setMaxLength(100)
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('count')
                .setDescription('Target number of flashcards to generate (default: 10, max: 25)')
                .setMinValue(3)
                .setMaxValue(25)
                .setRequired(false))
        .addStringOption(option =>
            option.setName('topic')
                .setDescription('Optional subject or course code (e.g., MATH 7808)')
                .setRequired(false)),

    async execute(interaction)
    {
        const attachment = interaction.options.getAttachment('pdf');
        const title = interaction.options.getString('title').trim();
        const targetCount = interaction.options.getInteger('count') ?? 10;
        const topic = interaction.options.getString('topic') || undefined;
        const ownerId = interaction.user.id;

        const ollamaUrl = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
        const ollamaModel = process.env.OLLAMA_MODEL || 'qwen2.5vl:7b';

        const isPdf = attachment.contentType === 'application/pdf' || attachment.name.toLowerCase().endsWith('.pdf');
        if (!isPdf)
        {
            return await interaction.reply({
                content: 'Error: Please upload a valid **.pdf** file.',
                flags: MessageFlags.Ephemeral
            });
        }

        if (attachment.size > 10 * 1024 * 1024)
        {
            return await interaction.reply({
                content: 'Error: PDF file is too large. Please upload a PDF under **10 MB**.',
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        let createdDeck = null;

        try
        {
            // Step 1: Download PDF
            console.log(`[generate-deck] Step 1: Downloading ${ attachment.name }...`);
            await interaction.editReply({ content: '📥 Downloading PDF from Discord...' });

            const response = await fetch(attachment.url);
            if (!response.ok)
                throw new Error('Failed to download the PDF from Discord.');

            const arrayBuffer = await response.arrayBuffer();
            const pdfBuffer = Buffer.from(arrayBuffer);

            // Step 2: Render pages at crisp 2.0 scale for sharp handwriting & math OCR
            console.log('[generate-deck] Step 2: Rendering high-resolution pages...');
            await interaction.editReply({ content: '📄 Rendering high-resolution pages for AI vision...' });

            const { pdf } = await import('pdf-to-img');
            const document = await pdf(pdfBuffer, { scale: 2.0 });
            const allPages = [];
            for await (const imageBuffer of document)
            {
                allPages.push(imageBuffer.toString('base64'));
                if (allPages.length >= 24) 
                    break; // Cap at 24 pages (~6 batches)
            }

            // Step 3: Split pages into small batches of 4 pages so 6GB VRAM stays sharp and accurate
            const PAGES_PER_BATCH = 4;
            const batches = [];
            for (let i = 0; i < allPages.length; i += PAGES_PER_BATCH)            
                batches.push(allPages.slice(i, i + PAGES_PER_BATCH));            

            const cardsPerBatch = Math.max(2, Math.ceil(targetCount / batches.length));
            const allGeneratedCards = [];

            for (let b = 0; b < batches.length; b++)
            {
                if (allGeneratedCards.length >= targetCount) 
                    break;

                const startPage = b * PAGES_PER_BATCH + 1;
                const endPage = startPage + batches[b].length - 1;

                console.log(`[generate-deck] Step 3: Processing batch ${ b + 1 }/${ batches.length } (pages ${ startPage }-${ endPage })...`);
                await interaction.editReply({
                    content: `Reading pages **${ startPage }–${ endPage }** of **${ allPages.length }** with **${ ollamaModel }** (Batch ${ b + 1 }/${ batches.length })...`
                });

                const existingQuestions = allGeneratedCards.map(c => `- ${ c.question }`).join('\n');

                const prompt = `You are an expert university tutor creating exam-ready study flashcards from these lecture note pages (pages ${ startPage } to ${ endPage }).
Read all typed text, diagrams, graphs, and handwritten annotations carefully.
Generate ${ cardsPerBatch } high-quality flashcards covering the most important definitions, formulas, concepts, and worked examples on these pages.
Rules:
- Make each question clear, specific, and testable (never reference "page 3" or "this slide").
- Write math cleanly in plain text/Unicode (e.g., dy/dx, Δx, lim, e^x, ln(x)) without raw LaTeX backslashes.
- Keep every question under 450 characters and every answer accurate, concise, and under 450 characters.
${ existingQuestions ? `\nDo NOT repeat any of these already-generated questions:\n${ existingQuestions }` : '' }`;

                const ollamaRes = await fetch(`${ ollamaUrl }/api/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: ollamaModel,
                        stream: false,
                        format: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    question: { type: 'string' },
                                    answer: { type: 'string' }
                                },
                                required: ['question', 'answer']
                            }
                        },
                        options: {
                            temperature: 0.25,
                            num_ctx: 8192 // Fits 4 high-res pages cleanly inside 6GB VRAM
                        },
                        messages: [
                            {
                                role: 'user',
                                content: prompt,
                                images: batches[b]
                            }
                        ]
                    })
                });

                if (!ollamaRes.ok)
                {
                    const errText = await ollamaRes.text().catch(() => '');
                    throw new Error(`Ollama server returned HTTP ${ ollamaRes.status }: ${ errText }`);
                }

                const data = await ollamaRes.json();
                const parsed = JSON.parse(data.message.content);
                const batchCards = Array.isArray(parsed) ? parsed : (parsed.flashcards || parsed.cards || []);

                for (const card of batchCards)                
                    if (card?.question && card?.answer && allGeneratedCards.length < targetCount)
                        allGeneratedCards.push(card);

            }

            if (allGeneratedCards.length === 0)            
                throw new Error('Ollama could not extract enough study material from that PDF.');            

            // Step 4: Save Deck and Cards to MongoDB
            console.log(`[generate-deck] Step 4: Saving ${ allGeneratedCards.length } cards to MongoDB...`);
            await interaction.editReply({ content: '💾 Saving flashcards to your deck...' });

            createdDeck = await createDeck({
                title,
                topic,
                description: `AI-generated from ${ attachment.name }`,
                ownerId
            });

            let savedCount = 0;
            for (const item of allGeneratedCards)
            {
                try
                {
                    await addFlashcard({
                        deckId: createdDeck._id,
                        ownerId,
                        question: String(item.question).substring(0, 500),
                        answer: String(item.answer).substring(0, 500)
                    });
                    savedCount++;
                }
                catch {}
            }

            if (savedCount === 0)
            {
                await deleteDeck({ deckId: createdDeck._id, ownerId });
                throw new Error('Failed to save any valid flashcards from the PDF.');
            }

            console.log(`[generate-deck] Step 5: Done! Saved ${ savedCount } cards.`);

            const embed = new EmbedBuilder()
                .setColor(0x00CC66)
                .setTitle(`AI Deck Generated: ${ createdDeck.title }`)
                .setDescription(`Created **${ savedCount }** flashcards from \`${ attachment.name }\`!`)
                .addFields(
                    { name: 'Sample Question', value: String(allGeneratedCards[0].question).substring(0, 1024) },
                    { name: 'Sample Answer', value: String(allGeneratedCards[0].answer).substring(0, 1024) }
                )
                .setFooter({ text: `Generated locally with ${ ollamaModel } • Run /quiz or /list-cards to study!` });

            await interaction.editReply({ content: '', embeds: [embed] });
        }
        catch (error)
        {
            console.error('[generate-deck] Error:', error);

            if (createdDeck)            
                await deleteDeck({ deckId: createdDeck._id, ownerId }).catch(() => { });            

            await interaction.editReply({
                content: `Error generating deck: ${ error.message }`
            });
        }
    }
};
