require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');

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

client.once('ready', async () =>
{
    console.log(`Bot is online as ${ client.user.tag }`);

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try
    {
        console.log(`Started refreshing ${ commandsDataForRegistration.length } application (/) commands.`);
        await rest.put(Routes.applicationCommands(client.user.id), { body: commandsDataForRegistration });
        console.log('Successfully reloaded application (/) commands.');
    } 
    catch (error) { console.error(error); }
});

client.on('interactionCreate', async interaction =>
{
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) 
        return;

    try
    {
        await command.execute(interaction, flashcardsDatabase);
    } 
    catch (error)
    {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

// Handle the button reveal globally
client.on('interactionCreate', async interaction =>
{
    if (!interaction.isButton()) 
        return;

    if (interaction.customId.startsWith('reveal_'))    
        await interaction.reply({ content: `**The answer is:**\n${ interaction.customId.replace('reveal_', '') }`, ephemeral: true });    
});

client.login(process.env.DISCORD_TOKEN);
