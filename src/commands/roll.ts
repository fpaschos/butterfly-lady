import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../types/commands.js';
import { parseRollExpression } from '../utils/parser.js';
import { executeRoll } from '../utils/dice.js';
import { createRollEmbed, createErrorEmbed } from '../utils/formatter.js';

export const rollCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Roll dice using L5R 4th Edition Roll & Keep system')
    .addStringOption(option =>
      option
        .setName('expression')
        .setDescription('Roll expression (e.g., 5k3, 7k4+10, 10k5-5)')
        .setRequired(true)
    ),
  
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const expressionInput = interaction.options.getString('expression', true);
    
    try {
      // Parse the roll expression
      const expression = parseRollExpression(expressionInput);
      
      // Execute the roll
      const result = executeRoll(expression);
      
      // Create and send the embed
      const embed = createRollEmbed(result, interaction.user.username);
      await interaction.reply({ embeds: [embed] });
      
    } catch (error) {
      // Handle parsing or execution errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const embed = createErrorEmbed(errorMessage);
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
  
  metadata: {
    name: 'roll',
    description: 'Roll dice using the Roll & Keep system from L5R 4th Edition',
    usage: '/roll <expression>',
    examples: [
      '/roll 5k3 - Roll 5 dice, keep 3 highest',
      '/roll 7k4+10 - Roll 7 dice, keep 4, add 10',
      '/roll 10k5-5 - Roll 10 dice, keep 5, subtract 5',
      '/roll 3k2 - Simple roll for a low-skilled character'
    ],
    category: 'dice'
  }
};

