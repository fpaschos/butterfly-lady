import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  SlashCommandBuilder
} from 'discord.js'
import { executeRoll, parseRollExpression } from '@butterfly-lady/core'
import { createErrorEmbed, createRollEmbed } from '../formatters/rollEmbed.js'
import { Command } from '../types/commands.js'

export const rollCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Roll dice using L5R 4th Edition Roll & Keep system')
    .addStringOption(option =>
      option
        .setName('expression')
        .setDescription('Roll expression with flags (e.g., 5k3, 7k4 m tn:20 r:2)')
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const expressionInput = interaction.options.getString('expression', true)

    try {
      // Parse the roll expression and options
      const { expression, options } = parseRollExpression(expressionInput)

      // Execute the roll with all options
      const result = executeRoll(expression, options)

      // Create and send the embed
      const embed = createRollEmbed(result, interaction.user.username)

      // Create buttons
      const buttons: ButtonBuilder[] = []

      // Always include reroll button
      const rerollButton = new ButtonBuilder()
        .setCustomId(`roll:${expressionInput}`)
        .setEmoji('🔄')
        .setLabel('Reroll')
        .setStyle(ButtonStyle.Secondary)
      buttons.push(rerollButton)

      // Add probability button if TN exists
      if (options.targetNumber !== undefined) {
        const probButton = new ButtonBuilder()
          .setCustomId(`prob:${expressionInput}`)
          .setEmoji('📊')
          .setLabel('Stats')
          .setStyle(ButtonStyle.Primary)
        buttons.push(probButton)
      }

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons)

      await interaction.reply({
        embeds: [embed],
        components: [row]
      })
    } catch (error) {
      // Handle parsing or execution errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      const embed = createErrorEmbed(errorMessage)
      await interaction.reply({ embeds: [embed], flags: 1 << 6 }) // MessageFlags.Ephemeral
    }
  },

  metadata: {
    name: 'roll',
    description:
      'Roll dice using the Roll & Keep system from L5R 4th Edition with advanced mechanics',
    usage: '/roll <expression> [flags] [tn:<num>] [r:<num>] [e or e:<num>]',
    examples: [
      '/roll 5k3 - Basic roll (10s explode)',
      '/roll 5k3 u - Unskilled (no explosions)',
      '/roll 7k4 m - Mastery (9s and 10s explode)',
      '/roll 7k4+10 tn:20 - Roll vs Target Number 20',
      '/roll 8k5 tn:25 r:2 - Roll with 2 called raises (TN becomes 30)',
      '/roll 6k3 e - Emphasis (reroll 1s, e defaults to e:1)',
      '/roll 6k3 e:2 - Emphasis (reroll dice showing ≤2)',
      '/roll 8k5 m e:2 tn:25 r:1 - Everything combined',
      '/roll 12k5+10 m tn:30 - Ten Dice Rule auto-applies (becomes 10k6+10)'
    ],
    category: 'dice'
  }
}
