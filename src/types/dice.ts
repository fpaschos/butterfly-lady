/**
 * Represents a single die result with explosion tracking
 */
export interface DieResult {
  /** The face value of the die (1-10) */
  value: number;
  /** Individual rolls if the die exploded (rolled 10) */
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
 * Result of a complete Roll & Keep roll
 */
export interface RollResult {
  /** The parsed expression */
  expression: RollExpression;
  /** All dice that were rolled */
  allDice: DieResult[];
  /** Indices of dice that were kept (sorted by value, descending) */
  keptIndices: number[];
  /** Sum of kept dice values */
  subtotal: number;
  /** Final total including modifier */
  total: number;
}

