import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import { 
  parseRollExpression,
  ExplosionMode, 
  applyTenDiceRule,
  queryProbability
} from '@butterfly-lady/core';
import { Command } from '../types/commands.js';
import { createProbabilityEmbed } from '../formatters/probabilityEmbed.js';

export const probCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('prob')
    .setDescription('Show probability statistics for an L5R roll')
    .addStringOption(option =>
      option
        .setName('expression')
        .setDescription('Roll expression with flags (e.g., 5k3 tn:25, 7k4 m e tn:30)')
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const expressionInput = interaction.options.getString('expression', true);

    try {
      // Parse expression and options (same as roll command)
      const { expression: parsed, options } = parseRollExpression(expressionInput);

      // Validate TN is provided
      if (options.targetNumber === undefined) {
        await interaction.reply({
          content: '❌ Target Number (tn:N) is required for probability calculations.\nExample: `/prob 5k3 tn:25`',
          flags: 1 << 6 // MessageFlags.Ephemeral
        });
        return;
      }

      // Apply Ten Dice Rule
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

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to calculate probabilities';
      console.error('Error in prob command:', error);
      await interaction.reply({
        content: `❌ ${errorMessage}`,
        flags: 1 << 6 // MessageFlags.Ephemeral
      });
    }
  },

  metadata: {
    name: 'prob',
    description: 'Show probability statistics for an L5R roll',
    category: 'dice',
    usage: '/prob <expression> [flags] tn:<num> [r:<num>]',
    examples: [
      '/prob 5k3 tn:25 - Basic probability (skilled)',
      '/prob 5k3 u tn:20 - Unskilled (no explosions)',
      '/prob 7k4 m e tn:30 - Mastery + emphasis',
      '/prob 8k5+10 tn:35 r:2 - With modifier and raises',
      '/prob 12k4 tn:30 - Ten Dice Rule auto-applies'
    ]
  }
};
