require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection, REST, Routes, ActivityType } = require('discord.js');

const connectDatabase = require('./src/database');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'src/slashCommands');
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
        console.log(`Loaded command: /${ command.data.name } (${ file })`);
    }
    else    
        console.log(`Skipped file ${ file }: missing "data" or "execute" property.`);    
}


client.once('clientReady', async () =>
{
    console.log(`Bot is online as ${ client.user.tag }`);

    try
    {
        await connectDatabase();
    }
    catch (error)
    {
        console.error('Failed to start bot due to database error.');
        process.exit(1);
    }

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
    const userTag = interaction.user.tag;

    if (interaction.isAutocomplete())
    {
        const command = client.commands.get(interaction.commandName);
        if (!command || !command.autocomplete) return;

        try
        {
            console.log(`[Autocomplete] /${ interaction.commandName } triggered by ${ userTag }`);
            await command.autocomplete(interaction);
        }
        catch (error)
        {
            console.error(`Autocomplete Error on /${ interaction.commandName }:`, error);
        }
        return;
    }

    if (interaction.isChatInputCommand())
    {
        const command = client.commands.get(interaction.commandName);
        if (!command)
            return console.log(`[Command Not Found] /${ interaction.commandName } called by ${ userTag }`);

        try
        {
            console.log(`[Command] /${ interaction.commandName } called by ${ userTag }`);
            await command.execute(interaction);
        }
        catch (error)
        {
            console.error(`Execution Error on /${ interaction.commandName }:`, error);
            if (interaction.replied || interaction.deferred)            
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });            
            else            
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });            
        }
        return;
    }

    if (interaction.isButton())
    {
        console.log(`[Button] "${ interaction.customId }" clicked by ${ userTag }`);
        if (interaction.customId.startsWith('reveal_'))
            await interaction.reply({ content: `**The answer is:**\n${ interaction.customId.replace('reveal_', '') }`, ephemeral: true });

        return;
    }
});


client.login(process.env.DISCORD_TOKEN);
