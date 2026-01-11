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
import { probCommand } from './commands/prob.js';

// Re-export Client for use by backend
export type { Client } from 'discord.js';

// Extend Client type to include commands collection
declare module 'discord.js' {
  export interface Client {
    commands: Collection<string, Command>;
  }
}

export interface BotConfig {
  token: string;
  clientId: string;
  statusChannelId?: string;
}

/**
 * Initialize and start the Discord bot
 */
export async function startBot(config: BotConfig): Promise<Client> {
  const { token, clientId, statusChannelId } = config;

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
    helpCommand,
    probCommand
  ];

  // Add commands to collection
  for (const command of commands) {
    client.commands.set(command.data.name, command);
  }

  // Bot ready event
  client.once('clientReady', async () => {
    if (!client.user) {
      console.error('❌ Client user is not available');
      return;
    }
    
    console.log('✅ Butterfly Lady is online!');
    console.log(`📝 Logged in as ${client.user.tag}`);
    console.log(`🎲 Loaded ${commands.length} commands`);
    
    // Register slash commands with Discord
    try {
      await registerSlashCommands(token, clientId, commands);
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
      if (statusChannelId) {
        try {
          const channel = await client.channels.fetch(statusChannelId);
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
        flags: 1 << 6 // MessageFlags.Ephemeral
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

  // Start the bot
  await client.login(token);
  
  return client;
}

/**
 * Register slash commands with Discord API
 */
async function registerSlashCommands(
  token: string,
  clientId: string,
  commands: Command[]
): Promise<void> {
  const rest = new REST({ version: '10' }).setToken(token);
  
  const commandData = commands.map(cmd => cmd.data.toJSON());
  
  // Register commands globally
  await rest.put(
    Routes.applicationCommands(clientId),
    { body: commandData }
  );
}

/**
 * Gracefully shutdown the bot
 */
export async function shutdownBot(
  client: Client,
  statusChannelId?: string
): Promise<void> {
  console.log('📴 Shutting down bot gracefully...');
  
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
    if (statusChannelId && client.isReady()) {
      try {
        const channel = await client.channels.fetch(statusChannelId);
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
    console.log('✅ Bot shutdown complete');
  } catch (error) {
    console.error('❌ Error during bot shutdown:', error);
    // Make sure we still destroy on error
    client.destroy();
    throw error;
  }
}
