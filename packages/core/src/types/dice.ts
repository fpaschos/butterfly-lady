/**
 * Explosion modes for dice rolling
 */
export enum ExplosionMode {
  Skilled = 'skilled',     // 10s explode (default L5R behavior)
  Unskilled = 'unskilled', // No explosions
  Mastery = 'mastery'      // 9s and 10s explode
}

/**
 * Represents a single die result with explosion tracking
 */
export interface DieResult {
  /** The face value of the die (1-10) */
  value: number;
  /** Individual rolls if the die exploded */
  rolls: number[];
  /** Whether this die exploded */
  exploded: boolean;
}

/**
 * Represents a parsed Roll & Keep expression
 */
export interface RollExpression {
  /** Number of dice to roll */
  roll: number;
  /** Number of dice to keep */
  keep: number;
  /** Modifier to add/subtract from the total */
  modifier: number;
}

/**
 * Options for advanced roll mechanics
 */
export interface RollOptions {
  /** Explosion mode (default: skilled) */
  explosionMode: ExplosionMode;
  /** Target Number to beat */
  targetNumber?: number;
  /** Number of raises called */
  calledRaises?: number;
  /** Emphasis threshold (reroll dice ≤ this value) */
  emphasisThreshold?: number;
}

/**
 * Information about Ten Dice Rule conversion
 */
export interface TenDiceRuleConversion {
  /** Original roll/keep values */
  original: { roll: number; keep: number };
  /** Converted roll/keep values */
  converted: { roll: number; keep: number; bonus: number };
}

/**
 * Information about an emphasis reroll
 */
export interface EmphasisReroll {
  /** Index of the die that was rerolled */
  diceIndex: number;
  /** Original value before reroll */
  oldValue: number;
  /** New value after reroll */
  newValue: number;
}

/**
 * Result of a complete Roll & Keep roll
 */
export interface RollResult {
  /** The parsed expression */
  expression: RollExpression;
  /** Roll options used */
  options: RollOptions;
  /** All dice that were rolled */
  allDice: DieResult[];
  /** Indices of dice that were kept (sorted by value, descending) */
  keptIndices: number[];
  /** Sum of kept dice values */
  subtotal: number;
  /** Final total including modifier */
  total: number;
  /** Ten Dice Rule conversion info (if applied) */
  tenDiceRuleApplied?: TenDiceRuleConversion;
  /** Emphasis rerolls (if any) */
  emphasisRerolls?: EmphasisReroll[];
  /** Success against TN (if TN specified) */
  success?: boolean;
  /** Total raises achieved (if TN specified) */
  achievedRaises?: number;
  /** Margin of success/failure (if TN specified) */
  marginOfSuccess?: number;
}
