/**
 * Represents a single probability table entry for a specific roll configuration
 */
export interface ProbabilityTable {
  /** Number of dice to roll */
  roll: number;
  /** Number of dice to keep */
  keep: number;
  /** Explosion mode used for this table */
  explosion_mode: 'unskilled' | 'skilled' | 'mastery';
  /** Whether emphasis was applied */
  emphasis: boolean;
  /** Statistical measures for this roll configuration */
  statistics: Statistics;
  /** Cumulative probability P(total >= TN) for each TN value */
  cumulative_probability: Record<string, number>;
}

/**
 * Statistical measures for a probability distribution
 */
export interface Statistics {
  /** Mean (average) value */
  mean: number;
  /** Standard deviation */
  stddev: number;
  /** Median (50th percentile) */
  median: number;
  /** 25th percentile */
  percentile_25: number;
  /** 75th percentile */
  percentile_75: number;
  /** Minimum possible value */
  min: number;
  /** Maximum observed value */
  max: number;
}

/**
 * Root structure of the probability tables JSON file
 */
export interface ProbabilityTables {
  /** Version of the table format */
  version: string;
  /** Timestamp when tables were generated */
  generated_at: string;
  /** Number of simulation rounds per mode */
  simulation_rounds: {
    unskilled: number;
    skilled: number;
    mastery: number;
  };
  /** Probability cutoff threshold used */
  probability_cutoff: number;
  /** Array of all probability tables */
  tables: ProbabilityTable[];
}
