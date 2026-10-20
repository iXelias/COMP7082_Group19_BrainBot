require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection, REST, Routes, ActivityType } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const flashcardsDatabase = new Map();

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'SlashCommands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

const commandsDataForRegistration = [];

for (const file of commandFiles)
{
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command)
    {
        client.commands.set(command.data.name, command);
        commandsDataForRegistration.push(command.data.toJSON());
    }
}

client.once('clientReady', async () =>
{
    console.log(`Bot is online as ${ client.user.tag }`);

    client.user.setPresence(
        {
            activities: [
                {
                    name: 'you studying',
                    type: ActivityType.Watching
                }],
            status: 'online',
        });

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try
    {
        console.log(`Started refreshing ${ commandsDataForRegistration.length } application commands.`);
        await rest.put(Routes.applicationCommands(client.user.id), { body: commandsDataForRegistration });
        console.log('Successfully reloaded application commands.');
    }
    catch (error) { console.error(error); }
});

client.on('messageCreate', (message) =>
{
    if (message.author.bot)
        return;

    if (message.content.toLowerCase() === '!ping')
        message.reply('Pong!');

});

client.on('interactionCreate', async interaction =>
{
    console.log(`Received interaction: ${ interaction.type } | Command: ${ interaction.commandName }`);

    if (interaction.isChatInputCommand())
    {
        const command = client.commands.get(interaction.commandName);
        if (!command)
            return console.log(`Command NOT found in collection: ${ interaction.commandName }`);

        try
        {
            console.log(`Executing command: ${ interaction.commandName }`);
            await command.execute(interaction, flashcardsDatabase);
        }
        catch (error)
        {
            console.error('Execution Error:', error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
        return;
    }

    if (interaction.isButton())
    {
        console.log(`Button clicked! Custom ID: ${ interaction.customId }`);
        if (interaction.customId.startsWith('reveal_'))
        {
            const answer = interaction.customId.replace('reveal_', '');
            await interaction.reply({ content: `**The answer is:**\n${ answer }`, ephemeral: true });
        }
        return;
    }
});



client.login(process.env.DISCORD_TOKEN);
