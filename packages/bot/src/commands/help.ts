import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import { createCommandHelpEmbed } from '../formatters/rollEmbed.js'
import { Command } from '../types/commands.js'

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
          { name: 'prob', value: 'prob' },
          { name: 'help', value: 'help' }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const commandName = interaction.options.getString('command')

    if (commandName) {
      // Show detailed help for specific command
      await showCommandHelp(interaction, commandName)
    } else {
      // Show general help with all commands
      await showGeneralHelp(interaction)
    }
  },

  metadata: {
    name: 'help',
    description: 'Display bot commands and usage instructions',
    usage: '/help [command]',
    examples: [
      '/help - Show all available commands',
      '/help roll - Show detailed help for the roll command',
      '/help prob - Show detailed help for the probability command'
    ],
    category: 'utility'
  }
}

/**
 * Show detailed help for a specific command
 */
async function showCommandHelp(
  interaction: ChatInputCommandInteraction,
  commandName: string
): Promise<void> {
  const helpData = getCommandHelpData(commandName)

  if (!helpData) {
    await interaction.reply({
      content: `❌ No help available for command: ${commandName}`,
      flags: 1 << 6 // MessageFlags.Ephemeral
    })
    return
  }

  const embed = createCommandHelpEmbed(
    helpData.name,
    helpData.description,
    helpData.usage,
    helpData.examples
  )

  await interaction.reply({ embeds: [embed] })
}

/**
 * Show general help with all commands
 */
async function showGeneralHelp(interaction: ChatInputCommandInteraction): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0x8b0000)
    .setTitle('🦋 Butterfly Lady - L5R 4th Edition Bot')
    .setDescription(
      'A helpful bot for Legend of the Five Rings 4th Edition RPG.\n\n' +
        '**The Way of the Samurai**\n' +
        'Advanced Roll & Keep system with mastery, emphasis, raises, and more!'
    )
    .addFields(
      {
        name: '🎲 Dice Rolling',
        value:
          '`/roll <expr> [flags] [options]`\n' +
          '• Basic: `/roll 5k3` (10s explode)\n' +
          '• Unskilled: `/roll 5k3 u` (no explosions)\n' +
          '• Mastery: `/roll 7k4 m` (9s and 10s explode)\n' +
          '• Target Number: `/roll 5k3 tn:15`\n' +
          '• Raises: `/roll 7k4 tn:20 r:2`\n' +
          '• Emphasis: `/roll 6k3 e` (reroll 1s, e=e:1)\n' +
          '• Emphasis custom: `/roll 6k3 e:2` (reroll ≤2)\n' +
          '• Combined: `/roll 8k5 m e:2 tn:25 r:1`\n\n' +
          '`/prob <expr> tn:<N> [flags]`\n' +
          '• Check success odds: `/prob 5k3 tn:25`\n' +
          '• With modes: `/prob 7k4 m e tn:30`',
        inline: false
      },
      {
        name: '📖 Utility Commands',
        value:
          '`/help` - Show this help message\n' +
          '`/help roll` - Detailed roll command help\n' +
          '`/help prob` - Detailed probability command help',
        inline: false
      },
      {
        name: '💥 Explosion Modes',
        value:
          '**Skilled** (default): 10s explode\n' +
          '**Unskilled** (u): No explosions\n' +
          '**Mastery** (m): 9s and 10s explode',
        inline: false
      },
      {
        name: '📏 Ten Dice Rule',
        value:
          'Rolls over 10k10 auto-convert:\n' +
          '• 12k4 → 10k5\n' +
          '• 14k12 → 10k10+12\n' +
          'Extra dice become bonuses',
        inline: false
      },
      {
        name: '🎯 Target Numbers & Raises',
        value:
          '• Set TN: `tn:15`\n' +
          '• Call raises: `r:2` (+5 to TN per raise)\n' +
          '• Auto-calculates achieved raises\n' +
          '• Shows success/failure',
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
    .setTimestamp()

  await interaction.reply({ embeds: [embed] })
}

/**
 * Get help data for a specific command
 */
function getCommandHelpData(commandName: string) {
  const helpData: Record<
    string,
    {
      name: string
      description: string
      usage: string
      examples: string[]
    }
  > = {
    roll: {
      name: 'roll',
      description:
        '**Roll & Keep Dice System (L5R 4e)**\n\n' +
        'Roll multiple d10s and keep the highest results.\n\n' +
        '**Explosion Modes:**\n' +
        '• **Skilled** (default): 10s explode\n' +
        '• **Unskilled** (u flag): No explosions\n' +
        '• **Mastery** (m flag): 9s and 10s explode\n\n' +
        '**Format:** `XkY[+/-Z] [flags] [tn:N] [r:N] [e or e:N]`\n' +
        '• XkY = roll X dice, keep Y highest\n' +
        '• +/-Z = optional modifier\n' +
        '• u = unskilled (no explosions)\n' +
        '• m = mastery (9s and 10s explode)\n' +
        '• tn:N = target number to beat\n' +
        '• r:N = called raises (+5 to TN each)\n' +
        '• e or e:N = emphasis (reroll dice ≤N, e defaults to e:1)\n\n' +
        '**Ten Dice Rule:** Rolls over 10k10 automatically convert',
      usage: '/roll <expression> [flags] [options]',
      examples: [
        '/roll 5k3 - Basic skilled roll',
        '/roll 5k3 u - Unskilled (no explosions)',
        '/roll 7k4 m - Mastery (9s and 10s explode)',
        '/roll 7k4+10 tn:20 - Roll vs TN 20',
        '/roll 8k5 tn:25 r:2 - 2 called raises (TN becomes 30)',
        '/roll 6k3 e - Emphasis (reroll 1s, e defaults to e:1)',
        '/roll 6k3 e:2 - Emphasis (reroll ≤2)',
        '/roll 8k5 m e:2 tn:25 r:1 - Full combo',
        '/roll 12k5 m tn:30 - Ten Dice Rule applies (→10k6)'
      ]
    },
    prob: {
      name: 'prob',
      description:
        '**Probability & Statistics (L5R 4e)**\n\n' +
        'Show probability statistics for an L5R roll before you make it.\n' +
        'Uses precomputed Monte Carlo simulations (330 roll combinations).\n\n' +
        '**What You Get:**\n' +
        '• Success rate vs Target Number\n' +
        '• Average result (mean)\n' +
        '• Typical roll (median)\n' +
        '• Common range (25th-75th percentiles)\n' +
        '• Possible range (min-max)\n\n' +
        '**Same syntax as /roll, but TN is required:**\n' +
        '• Same explosion modes (u, m)\n' +
        '• Same emphasis (e, e:N)\n' +
        '• Same raises (r:N)\n' +
        '• Ten Dice Rule applies',
      usage: '/prob <expression> tn:<N> [flags]',
      examples: [
        '/prob 5k3 tn:25 - Check success odds (skilled)',
        '/prob 5k3 u tn:20 - Unskilled probability',
        '/prob 7k4 m e tn:30 - Mastery + emphasis',
        '/prob 8k5+10 tn:35 r:2 - With modifier and raises',
        '/prob 12k4 tn:30 - Ten Dice Rule applies'
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
        '/help roll - Detailed help for roll command',
        '/help prob - Detailed help for probability command'
      ]
    }
  }

  return helpData[commandName]
}
