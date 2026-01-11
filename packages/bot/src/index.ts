import { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes,
  Collection,
  ChatInputCommandInteraction,
  ButtonInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import { parseRollExpression, executeRoll } from '@butterfly-lady/core';
import { Command } from './types/commands.js';
import { rollCommand } from './commands/roll.js';
import { helpCommand } from './commands/help.js';
import { probCommand } from './commands/prob.js';
import { createRollEmbed, createErrorEmbed } from './formatters/rollEmbed.js';

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
    // Handle button interactions
    if (interaction.isButton()) {
      await handleButtonInteraction(interaction);
      return;
    }

    // Handle slash command interactions
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
 * Handle button interactions (e.g., "Roll" from /prob, "Reroll" from /roll)
 */
async function handleButtonInteraction(interaction: ButtonInteraction): Promise<void> {
  // Parse button customId (format: "roll:expression" or "prob:expression")
  if (interaction.customId.startsWith('roll:')) {
    await handleRollButton(interaction);
  } else if (interaction.customId.startsWith('prob:')) {
    await handleProbButton(interaction);
  } else {
    console.warn(`⚠️ Unknown button customId: ${interaction.customId}`);
  }
}

/**
 * Handle roll/reroll button
 */
async function handleRollButton(interaction: ButtonInteraction): Promise<void> {
  const expressionInput = interaction.customId.substring(5); // Remove "roll:" prefix

  try {
    // Parse the roll expression and options
    const { expression, options } = parseRollExpression(expressionInput);
    
    // Execute the roll with all options
    const result = executeRoll(expression, options);
    
    // Create and send the embed
    const embed = createRollEmbed(result, interaction.user.username);
    
    // Create buttons
    const buttons: ButtonBuilder[] = [];
    
    // Always include reroll button
    const rerollButton = new ButtonBuilder()
      .setCustomId(`roll:${expressionInput}`)
      .setEmoji('🔄')
      .setLabel('Reroll')
      .setStyle(ButtonStyle.Secondary);
    buttons.push(rerollButton);
    
    // Add probability button if TN exists
    if (options.targetNumber !== undefined) {
      const probButton = new ButtonBuilder()
        .setCustomId(`prob:${expressionInput}`)
        .setEmoji('📊')
        .setLabel('Stats')
        .setStyle(ButtonStyle.Primary);
      buttons.push(probButton);
    }

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(...buttons);

    await interaction.reply({ 
      embeds: [embed],
      components: [row]
    });
    
    console.log(
      `🎲 ${interaction.user.tag} rolled via button: ${expressionInput} ` +
      `in ${interaction.guild?.name || 'DM'}`
    );
  } catch (error) {
    // Handle parsing or execution errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const embed = createErrorEmbed(errorMessage);
    await interaction.reply({ embeds: [embed], flags: 1 << 6 }); // Ephemeral
    
    console.error(`❌ Error executing button roll:`, error);
  }
}

/**
 * Handle probability button
 */
async function handleProbButton(interaction: ButtonInteraction): Promise<void> {
  const expressionInput = interaction.customId.substring(5); // Remove "prob:" prefix

  try {
    // Parse expression and options
    const { expression: parsed, options } = parseRollExpression(expressionInput);

    // Validate TN is provided
    if (options.targetNumber === undefined) {
      await interaction.reply({
        content: '❌ Target Number (tn:N) is required for probability calculations.',
        flags: 1 << 6 // Ephemeral
      });
      return;
    }

    // Apply Ten Dice Rule
    const { applyTenDiceRule, queryProbability, ExplosionMode } = await import('@butterfly-lady/core');
    const tenDiceResult = applyTenDiceRule(parsed.roll, parsed.keep);
    const roll = tenDiceResult.roll;
    const keep = tenDiceResult.keep;
    const modifier = parsed.modifier + tenDiceResult.bonus;

    // Calculate effective TN including raises
    const effectiveTN = options.targetNumber + (options.calledRaises || 0) * 5;

    // Query probability tables
    const result = queryProbability({
      roll,
      keep,
      explosionMode: options.explosionMode || ExplosionMode.Skilled,
      emphasis: options.emphasisThreshold !== undefined,
      targetNumber: effectiveTN,
      modifier
    });

    // Create embed
    const { createProbabilityEmbed } = await import('./formatters/probabilityEmbed.js');
    const embed = createProbabilityEmbed(
      { roll, keep, modifier },
      result,
      {
        explosionMode: options.explosionMode || ExplosionMode.Skilled,
        targetNumber: options.targetNumber,
        calledRaises: options.calledRaises,
        emphasisThreshold: options.emphasisThreshold
      }
    );

    // Add Ten Dice Rule notice if applied
    if (tenDiceResult.applied) {
      embed.setDescription(
        `⚙️ Ten Dice Rule: ${tenDiceResult.original!.roll}k${tenDiceResult.original!.keep} → ` +
        `${roll}k${keep}${tenDiceResult.bonus > 0 ? `+${tenDiceResult.bonus}` : ''}`
      );
    }

    // Create button to execute the roll
    const rollButton = new ButtonBuilder()
      .setCustomId(`roll:${expressionInput}`)
      .setEmoji('🎲')
      .setLabel('Roll')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(rollButton);

    await interaction.reply({ 
      embeds: [embed],
      components: [row]
    });

    console.log(
      `📊 ${interaction.user.tag} viewed probability via button: ${expressionInput} ` +
      `in ${interaction.guild?.name || 'DM'}`
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to calculate probabilities';
    console.error('Error in prob button:', error);
    await interaction.reply({
      content: `❌ ${errorMessage}`,
      flags: 1 << 6 // Ephemeral
    });
  }
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
