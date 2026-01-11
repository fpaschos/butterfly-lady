import probabilityTablesData from '../../data/probability-tables.json' with { type: 'json' }
import { ProbabilityTables } from '../types/probability.js'

/**
 * Cached probability tables (loaded once on first access)
 */
let cachedTables: ProbabilityTables | null = null

/**
 * Load probability tables from JSON file
 * Uses static import - works in both Node.js and browser environments
 * Tables are cached after first load for performance
 *
 * @returns The complete probability tables
 * @throws Error if the tables are invalid
 */
export function loadProbabilityTables(): ProbabilityTables {
  if (cachedTables) {
    return cachedTables
  }

  // Static import - bundled at compile time
  // Works in Node.js (Discord bot) and browsers (React VTT)
  cachedTables = probabilityTablesData as unknown as ProbabilityTables

  if (!cachedTables || !cachedTables.tables) {
    throw new Error('Invalid probability tables format')
  }

  return cachedTables
}

/**
 * Clear the cached tables (useful for testing)
 */
export function clearCache(): void {
  cachedTables = null
}
