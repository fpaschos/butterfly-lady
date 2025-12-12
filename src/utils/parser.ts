import { RollExpression } from '../types/dice.js';

/**
 * Parse a Roll & Keep expression (e.g., "5k3", "7k4+10", "10k5-5")
 * 
 * Format: XkY[+/-Z]
 * - X: number of dice to roll
 * - Y: number of dice to keep
 * - Z: optional modifier to add or subtract
 * 
 * @param expression The roll expression string
 * @returns Parsed RollExpression object
 * @throws Error if expression is invalid
 */
export function parseRollExpression(expression: string): RollExpression {
  // Remove all whitespace
  const cleaned = expression.trim().toLowerCase().replace(/\s/g, '');
  
  // Match pattern: digits + 'k' + digits + optional modifier
  const pattern = /^(\d+)k(\d+)([\+\-]\d+)?$/;
  const match = cleaned.match(pattern);
  
  if (!match) {
    throw new Error(
      'Invalid roll expression. Use format: XkY (e.g., 5k3, 7k4+10, 10k5-5)'
    );
  }
  
  const roll = parseInt(match[1], 10);
  const keep = parseInt(match[2], 10);
  const modifier = match[3] ? parseInt(match[3], 10) : 0;
  
  // Validate ranges
  if (roll < 1 || roll > 100) {
    throw new Error('Number of dice to roll must be between 1 and 100');
  }
  
  if (keep < 1) {
    throw new Error('Number of dice to keep must be at least 1');
  }
  
  if (keep > roll) {
    throw new Error(
      `Cannot keep ${keep} dice when only rolling ${roll}. Keep value must be ≤ roll value.`
    );
  }
  
  return { roll, keep, modifier };
}

