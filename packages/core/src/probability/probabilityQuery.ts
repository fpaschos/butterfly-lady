import { ExplosionMode } from '../types/dice.js'
import { ProbabilityTable } from '../types/probability.js'
import { loadProbabilityTables } from './probabilityLoader.js'

/**
 * Options for querying probability tables
 */
export interface ProbabilityQueryOptions {
  /** Number of dice to roll */
  roll: number
  /** Number of dice to keep */
  keep: number
  /** Explosion mode */
  explosionMode: ExplosionMode
  /** Whether emphasis is applied */
  emphasis: boolean
  /** Target Number to beat */
  targetNumber: number
  /** Modifier to add to roll (adjusts effective TN) */
  modifier?: number
}

/**
 * Result of a probability query
 */
export interface ProbabilityResult {
  /** The matching probability table */
  table: ProbabilityTable
  /** Probability of success (0.0 to 1.0) */
  successRate: number
  /** Effective TN after adjusting for modifier */
  effectiveTN: number
}

/**
 * Query probability tables for a specific roll configuration
 *
 * @param options Query parameters
 * @returns Probability result with success rate and statistics
 * @throws Error if no matching table is found
 */
export function queryProbability(options: ProbabilityQueryOptions): ProbabilityResult {
  const tables = loadProbabilityTables()

  // Convert ExplosionMode enum to JSON string format
  const modeStr = explosionModeToString(options.explosionMode)

  // Find matching table
  const table = tables.tables.find(
    t =>
      t.roll === options.roll &&
      t.keep === options.keep &&
      t.explosion_mode === modeStr &&
      t.emphasis === options.emphasis
  )

  if (!table) {
    throw new Error(
      `No probability data found for ${options.roll}k${options.keep} ` +
        `(${modeStr}, emphasis: ${options.emphasis})`
    )
  }

  // Adjust TN for modifier
  // Example: 5k3+10 tn:25 → need to roll ≥15 on base dice
  const effectiveTN = options.targetNumber - (options.modifier || 0)

  // Get cumulative probability P(total >= effectiveTN)
  const successRate = getCumulativeProbability(table, effectiveTN)

  return {
    table,
    successRate,
    effectiveTN
  }
}

/**
 * Get cumulative probability P(total >= tn) from table
 *
 * @param table Probability table
 * @param tn Target number
 * @returns Probability of rolling >= tn (0.0 to 1.0)
 */
function getCumulativeProbability(table: ProbabilityTable, tn: number): number {
  // Check if exact TN exists in table
  const tnStr = tn.toString()
  if (table.cumulative_probability[tnStr] !== undefined) {
    return table.cumulative_probability[tnStr]
  }

  // If exact TN not found, find the highest TN <= requested TN
  // (Cumulative probability is non-increasing, so we use the closest lower value)
  const availableTNs = Object.keys(table.cumulative_probability)
    .map(Number)
    .sort((a, b) => a - b)

  // If TN is below minimum, probability is 1.0 (always succeed)
  if (tn <= availableTNs[0]) {
    return 1.0
  }

  // If TN is above maximum, probability is near 0
  if (tn > availableTNs[availableTNs.length - 1]) {
    return 0.0
  }

  // Find the largest TN in table that is <= requested TN
  for (let i = availableTNs.length - 1; i >= 0; i--) {
    if (availableTNs[i] <= tn) {
      return table.cumulative_probability[availableTNs[i].toString()]
    }
  }

  // Fallback (should not reach here)
  return 0.0
}

/**
 * Convert ExplosionMode enum to JSON string format
 *
 * @param mode ExplosionMode enum value
 * @returns String representation for JSON
 */
function explosionModeToString(mode: ExplosionMode): 'unskilled' | 'skilled' | 'mastery' {
  switch (mode) {
    case ExplosionMode.Unskilled:
      return 'unskilled'
    case ExplosionMode.Skilled:
      return 'skilled'
    case ExplosionMode.Mastery:
      return 'mastery'
    default:
      return 'skilled'
  }
}
