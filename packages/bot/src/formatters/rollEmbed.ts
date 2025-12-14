import { EmbedBuilder } from 'discord.js';
import { RollResult, ExplosionMode, formatDieResult } from '@butterfly-lady/core';

/**
 * Create a Discord embed for a roll result with Phase 2 features
 */
export function createRollEmbed(result: RollResult, username: string): EmbedBuilder {
  const { options } = result;
  
  // Determine color based on success/failure or explosion mode
  let color = 0x8B0000; // Dark red (default L5R)
  if (result.success === true) color = 0x00AA00; // Green for success
  else if (result.success === false) color = 0xAA0000; // Bright red for failure
  else if (options.explosionMode === ExplosionMode.Mastery) color = 0xFFD700; // Gold for mastery
  
  // Build title
  const modeEmoji = getModeEmoji(options.explosionMode);
  const title = `${modeEmoji} Roll & Keep`;
  
  // Build description with expression
  let expressionStr = buildExpressionString(result);
  let description = `${username} rolled **${expressionStr}**`;
  
  // Add Ten Dice Rule note if applied
  if (result.tenDiceRuleApplied) {
    const { original, converted } = result.tenDiceRuleApplied;
    description += `\n📏 Ten Dice Rule: ${original.roll}k${original.keep} → ${converted.roll}k${converted.keep}`;
    if (converted.bonus > 0) description += `+${converted.bonus}`;
  }
  
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
  
  // Always show detailed view
  addDetailedFields(embed, result);
  
  // Add footer with context info
  const footer = buildFooter(result);
  if (footer) {
    embed.setFooter({ text: footer });
  }
  
  return embed;
}

/**
 * Add detailed fields to embed
 */
function addDetailedFields(embed: EmbedBuilder, result: RollResult): void {
  const { allDice, keptIndices, subtotal, total, expression, options } = result;
  
  // Dice breakdown
  const diceDisplay = allDice.map((die, index) => {
    const dieStr = formatDieResult(die);
    const isKept = keptIndices.includes(index);
    return isKept ? `**${dieStr}**` : dieStr;
  }).join(', ');
  
  embed.addFields({
    name: 'All Dice (kept dice in bold)',
    value: diceDisplay,
    inline: false
  });
  
  // Emphasis rerolls
  if (result.emphasisRerolls && result.emphasisRerolls.length > 0) {
    const rerollsText = result.emphasisRerolls
      .map(r => `Die ${r.diceIndex + 1}: ${r.oldValue} → ${r.newValue}`)
      .join('\n');
    embed.addFields({
      name: `Emphasis Rerolls (≤${options.emphasisThreshold})`,
      value: rerollsText,
      inline: false
    });
  }
  
  // Calculation breakdown
  let calcText = `Kept dice: ${keptIndices.map(i => allDice[i].value).join(' + ')} = ${subtotal}`;
  if (expression.modifier !== 0) {
    const modStr = expression.modifier > 0 ? `+${expression.modifier}` : `${expression.modifier}`;
    calcText += `\nModifier: ${modStr}\n**Total: ${total}**`;
  } else {
    calcText += `\n**Total: ${total}**`;
  }
  
  embed.addFields({
    name: 'Calculation',
    value: calcText,
    inline: false
  });
  
  // TN and Raises breakdown
  if (result.success !== undefined && options.targetNumber) {
    const icon = result.success ? '✅' : '❌';
    const status = result.success ? 'SUCCESS' : 'FAILED';
    
    let tnText = `${icon} **${status}**\n`;
    tnText += `Base TN: ${options.targetNumber}`;
    
    if (options.calledRaises && options.calledRaises > 0) {
      const effectiveTN = options.targetNumber + (options.calledRaises * 5);
      tnText += `\nCalled Raises: ${options.calledRaises} (+${options.calledRaises * 5})`;
      tnText += `\n**Effective TN: ${effectiveTN}**`;
    }
    
    tnText += `\nRoll: ${total}`;
    
    if (result.marginOfSuccess !== undefined) {
      const margin = result.marginOfSuccess >= 0 ? `+${result.marginOfSuccess}` : `${result.marginOfSuccess}`;
      tnText += `\nMargin: ${margin}`;
    }
    
    if (result.achievedRaises !== undefined) {
      tnText += `\n**Raises Achieved: ${result.achievedRaises}**`;
      if (options.calledRaises && result.achievedRaises > options.calledRaises) {
        const bonus = result.achievedRaises - options.calledRaises;
        tnText += ` (${options.calledRaises} called + ${bonus} bonus)`;
      }
    }
    
    embed.addFields({
      name: 'Target Number Check',
      value: tnText,
      inline: false
    });
  }
}

/**
 * Build expression string
 */
function buildExpressionString(result: RollResult): string {
  const { expression, tenDiceRuleApplied } = result;
  
  // Use original values if Ten Dice Rule was applied
  const roll = tenDiceRuleApplied?.original.roll ?? expression.roll;
  const keep = tenDiceRuleApplied?.original.keep ?? expression.keep;
  let modifier = expression.modifier;
  
  let expr = `${roll}k${keep}`;
  if (modifier > 0) expr += `+${modifier}`;
  if (modifier < 0) expr += `${modifier}`;
  
  return expr;
}

/**
 * Build footer text
 */
function buildFooter(result: RollResult): string | null {
  const parts: string[] = [];
  
  // Explosion mode info
  if (result.options.explosionMode === ExplosionMode.Unskilled) {
    parts.push('⚪ Unskilled (no explosions)');
  } else if (result.options.explosionMode === ExplosionMode.Mastery) {
    const explosionCount = result.allDice.filter(die => die.exploded).length;
    if (explosionCount > 0) {
      parts.push(`✨ Mastery: ${explosionCount} ${explosionCount === 1 ? 'die' : 'dice'} exploded (9s and 10s)`);
    } else {
      parts.push('✨ Mastery mode (9s and 10s explode)');
    }
  } else {
    // Skilled mode
    const explosionCount = result.allDice.filter(die => die.exploded).length;
    if (explosionCount > 0) {
      parts.push(`💥 ${explosionCount} ${explosionCount === 1 ? 'die' : 'dice'} exploded (10s)`);
    }
  }
  
  // Emphasis reroll info
  if (result.emphasisRerolls && result.emphasisRerolls.length > 0) {
    parts.push(`🔄 Emphasis: ${result.emphasisRerolls.length} ${result.emphasisRerolls.length === 1 ? 'die' : 'dice'} rerolled (≤${result.options.emphasisThreshold})`);
  }
  
  return parts.length > 0 ? parts.join(' • ') : null;
}

/**
 * Get emoji for explosion mode
 */
function getModeEmoji(mode: ExplosionMode): string {
  switch (mode) {
    case ExplosionMode.Unskilled:
      return '⚪';
    case ExplosionMode.Mastery:
      return '✨';
    case ExplosionMode.Skilled:
    default:
      return '🎲';
  }
}

/**
 * Create an error embed for invalid rolls
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
