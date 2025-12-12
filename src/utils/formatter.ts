import { EmbedBuilder } from 'discord.js';
import { RollResult } from '../types/dice.js';
import { formatDieResult } from './dice.js';

/**
 * Create a Discord embed for a roll result
 * Shows all dice, highlights kept dice, displays explosions
 * 
 * @param result The roll result to format
 * @param username The username who made the roll
 * @returns Discord EmbedBuilder with formatted roll
 */
export function createRollEmbed(result: RollResult, username: string): EmbedBuilder {
  const { expression, allDice, keptIndices, subtotal, total } = result;
  const { roll, keep, modifier } = expression;
  
  // Build the expression string
  let expressionStr = `${roll}k${keep}`;
  if (modifier > 0) expressionStr += `+${modifier}`;
  if (modifier < 0) expressionStr += `${modifier}`;
  
  // Format all dice, marking kept ones
  const diceDisplay = allDice.map((die, index) => {
    const dieStr = formatDieResult(die);
    const isKept = keptIndices.includes(index);
    
    if (isKept) {
      // Bold kept dice
      return `**${dieStr}**`;
    }
    return dieStr;
  }).join(', ');
  
  // Count explosions
  const explosionCount = allDice.filter(die => die.exploded).length;
  
  // Build embed
  const embed = new EmbedBuilder()
    .setColor(0x8B0000) // Dark red for L5R theme
    .setTitle('🎲 Roll & Keep')
    .setDescription(`${username} rolled **${expressionStr}**`)
    .addFields(
      {
        name: 'Dice Rolled',
        value: diceDisplay,
        inline: false
      },
      {
        name: 'Result',
        value: buildResultString(subtotal, modifier, total),
        inline: false
      }
    )
    .setTimestamp();
  
  // Add explosion info if any dice exploded
  if (explosionCount > 0) {
    const explosionText = explosionCount === 1 
      ? '💥 1 die exploded!' 
      : `💥 ${explosionCount} dice exploded!`;
    embed.setFooter({ text: explosionText });
  }
  
  return embed;
}

/**
 * Build the result string showing calculation
 * 
 * @param subtotal Sum of kept dice
 * @param modifier The modifier applied
 * @param total Final total
 * @returns Formatted result string
 */
function buildResultString(subtotal: number, modifier: number, total: number): string {
  if (modifier === 0) {
    return `**${total}**`;
  }
  
  const modifierStr = modifier > 0 ? `+${modifier}` : `${modifier}`;
  return `${subtotal} ${modifierStr} = **${total}**`;
}

/**
 * Create an error embed for invalid rolls
 * 
 * @param error The error message
 * @returns Discord EmbedBuilder with error
 */
export function createErrorEmbed(error: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0xFF0000)
    .setTitle('❌ Invalid Roll')
    .setDescription(error)
    .setTimestamp();
}

/**
 * Create a help embed for a specific command
 * 
 * @param name Command name
 * @param description Command description
 * @param usage Usage instructions
 * @param examples Example commands
 * @returns Discord EmbedBuilder with help info
 */
export function createCommandHelpEmbed(
  name: string,
  description: string,
  usage: string,
  examples: string[]
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(0x4169E1) // Royal blue
    .setTitle(`📖 Command: /${name}`)
    .setDescription(description)
    .addFields(
      {
        name: 'Usage',
        value: usage,
        inline: false
      },
      {
        name: 'Examples',
        value: examples.map(ex => `\`${ex}\``).join('\n'),
        inline: false
      }
    )
    .setTimestamp();
  
  return embed;
}

