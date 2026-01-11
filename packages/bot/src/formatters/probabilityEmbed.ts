import { EmbedBuilder } from 'discord.js'
import { ExplosionMode, ProbabilityResult, RollExpression } from '@butterfly-lady/core'

/**
 * Options for formatting the probability embed
 */
export interface ProbabilityEmbedOptions {
  /** Explosion mode used */
  explosionMode: ExplosionMode
  /** Target Number */
  targetNumber: number
  /** Called raises (optional) */
  calledRaises?: number
  /** Emphasis threshold (optional) */
  emphasisThreshold?: number
}

/**
 * Create a Discord embed showing probability statistics for a roll
 *
 * @param expression The roll expression (XkY+modifier)
 * @param result Probability query result
 * @param options Display options
 * @returns Discord embed
 */
export function createProbabilityEmbed(
  expression: RollExpression,
  result: ProbabilityResult,
  options: ProbabilityEmbedOptions
): EmbedBuilder {
  const { table, successRate } = result
  const { statistics } = table

  // Calculate effective TN with raises
  const raiseTN = options.targetNumber + (options.calledRaises || 0) * 5

  // Format roll expression
  const rollStr = formatRollExpression(expression)

  // Difficulty label and emoji based on success rate
  const difficultyLabel = getDifficultyLabel(successRate)
  const successEmoji = getSuccessEmoji(successRate)

  // Build the embed
  const embed = new EmbedBuilder()
    .setTitle(`📊 ${rollStr} vs TN ${raiseTN}`)
    .setColor(getColorForSuccessRate(successRate))
    .addFields(
      {
        name: `${successEmoji} Success Rate`,
        value: `**${(successRate * 100).toFixed(1)}%** ${difficultyLabel}`,
        inline: false
      },
      {
        name: '📈 Roll Statistics',
        value: [
          `Average: **${statistics.mean.toFixed(1)}** (σ ${statistics.stddev.toFixed(1)})`,
          `Typical Roll: ${statistics.median} (50% get ≤${statistics.median})`,
          `Common Range: ${statistics.percentile_25}-${statistics.percentile_75} (50% of rolls)`,
          `Possible Range: ${statistics.min}-${statistics.max}`
        ].join('\n'),
        inline: false
      }
    )

  // Add footer with mode labels
  const modeLabels = buildModeLabels(options)
  if (modeLabels.length > 0) {
    embed.setFooter({ text: modeLabels.join(' • ') })
  }

  return embed
}

/**
 * Format a roll expression as a string
 */
function formatRollExpression(expr: RollExpression): string {
  let result = `${expr.roll}k${expr.keep}`
  if (expr.modifier > 0) {
    result += `+${expr.modifier}`
  } else if (expr.modifier < 0) {
    result += `${expr.modifier}`
  }
  return result
}

/**
 * Get difficulty label for a success rate
 */
function getDifficultyLabel(rate: number): string {
  if (rate >= 0.95) return '(Trivial)'
  if (rate >= 0.75) return '(Easy)'
  if (rate >= 0.5) return '(Moderate)'
  if (rate >= 0.25) return '(Hard)'
  if (rate >= 0.1) return '(Very Hard)'
  return '(Nearly Impossible)'
}

/**
 * Get emoji based on success rate
 */
function getSuccessEmoji(rate: number): string {
  if (rate >= 0.5) return '✅'
  if (rate >= 0.1) return '⚠️'
  return '❌'
}

/**
 * Get embed color based on success rate
 */
function getColorForSuccessRate(rate: number): number {
  if (rate >= 0.75) return 0x00ff00 // Green
  if (rate >= 0.5) return 0xffff00 // Yellow
  if (rate >= 0.25) return 0xff9900 // Orange
  return 0xff0000 // Red
}

/**
 * Build mode labels for footer
 */
function buildModeLabels(options: ProbabilityEmbedOptions): string[] {
  const labels: string[] = []

  if (options.explosionMode === ExplosionMode.Unskilled) {
    labels.push('Unskilled')
  } else if (options.explosionMode === ExplosionMode.Mastery) {
    labels.push('Mastery')
  }
  // Skilled is default, so we don't show it

  if (options.emphasisThreshold) {
    labels.push(`Emphasis (≤${options.emphasisThreshold})`)
  }

  if (options.calledRaises && options.calledRaises > 0) {
    labels.push(`${options.calledRaises} Raise${options.calledRaises > 1 ? 's' : ''}`)
  }

  return labels
}
