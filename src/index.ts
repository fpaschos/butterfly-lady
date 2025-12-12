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
const STATUS_CHANNEL_ID = process.env.STATUS_CHANNEL_ID; // Optional: for bot status notifications

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
    
    // Set bot status to show it's ready for use
    client.user.setPresence({
      activities: [{
        name: 'Roll & Keep dice | /help',
        type: 0 // Playing
      }],
      status: 'online'
    });
    console.log('🎭 Bot presence set');
    
    // Optional: Send startup notification to status channel
    if (STATUS_CHANNEL_ID) {
      try {
        const channel = await client.channels.fetch(STATUS_CHANNEL_ID);
        if (channel?.isTextBased() && 'send' in channel) {
          await channel.send('🦋 **Butterfly Lady is now online!**\nReady to roll some dice for Rokugan.');
          console.log('📢 Startup notification sent');
        }
      } catch (error) {
        console.warn('⚠️ Could not send startup notification:', error);
      }
    }
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

// Shutdown flag to prevent multiple shutdown calls
let isShuttingDown = false;

/**
 * Graceful shutdown
 */
async function shutdown(signal: string): Promise<void> {
  // Prevent multiple shutdown calls
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;
  
  console.log(`\n📴 Received ${signal}, shutting down gracefully...`);
  
  try {
    // Set status to invisible immediately
    if (client.user) {
      try {
        client.user.setStatus('invisible');
        console.log('👻 Set status to invisible');
      } catch (err) {
        // Ignore errors if already disconnected
      }
    }
    
    // Optional: Send shutdown notification and WAIT for it
    if (STATUS_CHANNEL_ID && client.isReady()) {
      try {
        const channel = await client.channels.fetch(STATUS_CHANNEL_ID);
        if (channel?.isTextBased() && 'send' in channel) {
          await channel.send('🦋 **Butterfly Lady is shutting down...**\nI\'ll be back soon!');
          console.log('📢 Shutdown notification sent');
        }
      } catch (err) {
        console.warn('⚠️ Could not send shutdown notification:', err);
      }
    }
    
    // NOW destroy the client after message is sent
    client.destroy();
    console.log('✅ Shutdown complete');
    
    // Exit cleanly
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    // Make sure we still destroy and exit on error
    client.destroy();
    process.exit(1);
  }
}

// Handle shutdown signals - must handle async
process.on('SIGINT', () => {
  // Don't await here, let the async function run
  shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  // Don't await here, let the async function run
  shutdown('SIGTERM');
});

// Start the bot
console.log('🦋 Starting Butterfly Lady...');
console.log('🔧 Environment:', process.env.NODE_ENV || 'development');

client.login(DISCORD_TOKEN).catch(error => {
  console.error('❌ Failed to login:', error);
  process.exit(1);
});

