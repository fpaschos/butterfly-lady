import 'dotenv/config';
import { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes,
  Collection,
  ChatInputCommandInteraction
} from 'discord.js';
import { Command } from './types/commands.js';
import { rollCommand } from './commands/roll.js';
import { helpCommand } from './commands/help.js';

// Environment configuration
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;

if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID) {
  console.error('❌ Missing required environment variables:');
  if (!DISCORD_TOKEN) console.error('  - DISCORD_TOKEN');
  if (!DISCORD_CLIENT_ID) console.error('  - DISCORD_CLIENT_ID');
  process.exit(1);
}

// Extend Client type to include commands collection
declare module 'discord.js' {
  export interface Client {
    commands: Collection<string, Command>;
  }
}

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
  ]
});

// Initialize commands collection
client.commands = new Collection<string, Command>();

// Register commands
const commands: Command[] = [
  rollCommand,
  helpCommand
];

// Add commands to collection
for (const command of commands) {
  client.commands.set(command.data.name, command);
}

// Bot ready event
client.once('ready', async () => {
  if (!client.user) {
    console.error('❌ Client user is not available');
    return;
  }
  
  console.log('✅ Butterfly Lady is online!');
  console.log(`📝 Logged in as ${client.user.tag}`);
  console.log(`🎲 Loaded ${commands.length} commands`);
  
  // Register slash commands with Discord
  try {
    await registerSlashCommands();
    console.log('✅ Slash commands registered successfully');
  } catch (error) {
    console.error('❌ Failed to register slash commands:', error);
  }
});

// Handle interactions
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  
  const command = client.commands.get(interaction.commandName);
  
  if (!command) {
    console.warn(`⚠️ Unknown command: ${interaction.commandName}`);
    return;
  }
  
  try {
    console.log(
      `🎲 ${interaction.user.tag} used /${interaction.commandName} ` +
      `in ${interaction.guild?.name || 'DM'}`
    );
    await command.execute(interaction as ChatInputCommandInteraction);
  } catch (error) {
    console.error(`❌ Error executing ${interaction.commandName}:`, error);
    
    const errorMessage = {
      content: '❌ An error occurred while executing this command.',
      ephemeral: true
    };
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
});

// Handle errors
client.on('error', error => {
  console.error('❌ Discord client error:', error);
});

process.on('unhandledRejection', error => {
  console.error('❌ Unhandled promise rejection:', error);
});

/**
 * Register slash commands with Discord API
 */
async function registerSlashCommands(): Promise<void> {
  const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN!);
  
  const commandData = commands.map(cmd => cmd.data.toJSON());
  
  // Register commands globally
  await rest.put(
    Routes.applicationCommands(DISCORD_CLIENT_ID!),
    { body: commandData }
  );
}

/**
 * Graceful shutdown
 */
async function shutdown(signal: string): Promise<void> {
  console.log(`\n📴 Received ${signal}, shutting down gracefully...`);
  
  client.destroy();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Start the bot
console.log('🦋 Starting Butterfly Lady...');
console.log('🔧 Environment:', process.env.NODE_ENV || 'development');

client.login(DISCORD_TOKEN).catch(error => {
  console.error('❌ Failed to login:', error);
  process.exit(1);
});

