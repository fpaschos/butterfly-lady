import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../types/commands.js';
import { createCommandHelpEmbed } from '../utils/formatter.js';

export const helpCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Get help with Butterfly Lady bot commands')
    .addStringOption(option =>
      option
        .setName('command')
        .setDescription('Get detailed help for a specific command')
        .setRequired(false)
        .addChoices(
          { name: 'roll', value: 'roll' },
          { name: 'help', value: 'help' }
        )
    ),
  
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const commandName = interaction.options.getString('command');
    
    if (commandName) {
      // Show detailed help for specific command
      await showCommandHelp(interaction, commandName);
    } else {
      // Show general help with all commands
      await showGeneralHelp(interaction);
    }
  },
  
  metadata: {
    name: 'help',
    description: 'Display bot commands and usage instructions',
    usage: '/help [command]',
    examples: [
      '/help - Show all available commands',
      '/help roll - Show detailed help for the roll command'
    ],
    category: 'utility'
  }
};

/**
 * Show detailed help for a specific command
 */
async function showCommandHelp(
  interaction: ChatInputCommandInteraction,
  commandName: string
): Promise<void> {
  const helpData = getCommandHelpData(commandName);
  
  if (!helpData) {
    await interaction.reply({
      content: `❌ No help available for command: ${commandName}`,
      ephemeral: true
    });
    return;
  }
  
  const embed = createCommandHelpEmbed(
    helpData.name,
    helpData.description,
    helpData.usage,
    helpData.examples
  );
  
  await interaction.reply({ embeds: [embed] });
}

/**
 * Show general help with all commands
 */
async function showGeneralHelp(interaction: ChatInputCommandInteraction): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0x8B0000)
    .setTitle('🦋 Butterfly Lady - L5R 4th Edition Bot')
    .setDescription(
      'A helpful bot for Legend of the Five Rings 4th Edition RPG.\n\n' +
      '**The Way of the Samurai**\n' +
      'This bot uses the Roll & Keep dice system where you roll multiple d10s ' +
      'and keep the highest results. When a die shows 10, it explodes!'
    )
    .addFields(
      {
        name: '🎲 Dice Commands',
        value: 
          '`/roll <expression>` - Roll dice with L5R rules\n' +
          '• Format: XkY (roll X dice, keep Y)\n' +
          '• Add modifiers: XkY+Z or XkY-Z\n' +
          '• Example: `/roll 5k3+10`',
        inline: false
      },
      {
        name: '📖 Utility Commands',
        value: 
          '`/help` - Show this help message\n' +
          '`/help <command>` - Detailed help for a command',
        inline: false
      },
      {
        name: '💥 Rule of 10',
        value:
          'When a d10 shows 10, it "explodes" - roll again and add to the total!\n' +
          'A die can explode multiple times.',
        inline: false
      },
      {
        name: '🔮 Coming Soon',
        value:
          '• Statistics and probability simulation\n' +
          '• Character management\n' +
          '• L5R lore and rules lookup with AI',
        inline: false
      }
    )
    .setFooter({ text: 'For detailed command help, use /help <command>' })
    .setTimestamp();
  
  await interaction.reply({ embeds: [embed] });
}

/**
 * Get help data for a specific command
 */
function getCommandHelpData(commandName: string) {
  const helpData: Record<string, {
    name: string;
    description: string;
    usage: string;
    examples: string[];
  }> = {
    roll: {
      name: 'roll',
      description: 
        '**Roll & Keep Dice System**\n\n' +
        'Roll multiple d10s and keep the highest results. ' +
        'This is the core mechanic of L5R 4th Edition.\n\n' +
        '**The Rule of 10:** When a die shows 10, it explodes! ' +
        'Roll that die again and add the new result to its total. ' +
        'A die can explode multiple times.\n\n' +
        '**Format:** `XkY[+/-Z]`\n' +
        '• X = number of dice to roll (1-100)\n' +
        '• Y = number of dice to keep (1-X)\n' +
        '• Z = optional modifier to add or subtract',
      usage: '/roll <expression>',
      examples: [
        '/roll 5k3 - Roll 5d10, keep 3 highest',
        '/roll 7k4+10 - Roll 7d10, keep 4, add 10 to result',
        '/roll 10k5-5 - Roll 10d10, keep 5, subtract 5',
        '/roll 3k2 - Simple roll (beginner character)',
        '/roll 12k6+15 - Complex roll (master samurai)'
      ]
    },
    help: {
      name: 'help',
      description:
        'Display information about Butterfly Lady bot commands.\n\n' +
        'Use without arguments to see all available commands, ' +
        'or specify a command name to get detailed help.',
      usage: '/help [command]',
      examples: [
        '/help - Show all commands',
        '/help roll - Detailed help for roll command'
      ]
    }
  };
  
  return helpData[commandName];
}

