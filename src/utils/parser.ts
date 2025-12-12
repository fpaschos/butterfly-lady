import { RollExpression, RollOptions, ExplosionMode } from '../types/dice.js';

/**
 * Parse a Roll & Keep expression with optional flags and options
 * 
 * Format: XkY [+/-Z] [flags] [tn:N] [r:N] [e:N]
 * - XkY: roll X dice, keep Y
 * - +/-Z: optional modifier (can be attached to XkY or separate, at any position)
 * - Flags (before tn/raises): u (unskilled), m (mastery)
 * - e or e:N or emphasis:N - emphasis threshold (e defaults to e:1)
 * - tn:N or t:N or vs:N - target number
 * - r:N or raises:N - called raises
 * 
 * @param input The full input string
 * @returns Parsed expression and options
 * @throws Error if expression is invalid
 */
export function parseRollExpression(input: string): {
  expression: RollExpression;
  options: Partial<RollOptions>;
} {
  const cleaned = input.trim();
  
  // Split by spaces to parse components
  const parts = cleaned.split(/\s+/);
  
  // First part should be the roll expression (XkY[+/-Z])
  if (parts.length === 0) {
    throw new Error('No roll expression provided');
  }
  
  const rollPart = parts[0].toLowerCase();
  const expression = parseBasicRollExpression(rollPart);
  
  // Parse options from remaining parts
  const options: Partial<RollOptions> = {
    explosionMode: ExplosionMode.Skilled // Default
  };
  
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i].toLowerCase();
    
    // Check for standalone modifier (+X or -X)
    const modifierMatch = part.match(/^([+\-]\d+)$/);
    if (modifierMatch) {
      const modifier = parseInt(modifierMatch[1], 10);
      if (!isNaN(modifier)) {
        expression.modifier += modifier;
        continue;
      }
    }
    
    // Flags (single letter or word)
    if (part === 'u' || part === 'unskilled') {
      options.explosionMode = ExplosionMode.Unskilled;
    } else if (part === 'm' || part === 'mastery') {
      options.explosionMode = ExplosionMode.Mastery;
    } else if (part === 'e' || part === 'emph' || part === 'emphasis') {
      // e without value defaults to e:1
      options.emphasisThreshold = 1;
    }
    // Options with values
    else if (part.includes(':')) {
      const [key, value] = part.split(':');
      
      if (key === 'tn' || key === 't' || key === 'vs') {
        const tn = parseInt(value, 10);
        if (isNaN(tn) || tn < 1) {
          throw new Error('Target Number must be a positive number');
        }
        options.targetNumber = tn;
      } else if (key === 'r' || key === 'raises') {
        const raises = parseInt(value, 10);
        if (isNaN(raises) || raises < 0) {
          throw new Error('Raises must be a non-negative number');
        }
        options.calledRaises = raises;
      } else if (key === 'e' || key === 'emph' || key === 'emphasis') {
        const emph = parseInt(value, 10);
        if (isNaN(emph) || emph < 1 || emph > 10) {
          throw new Error('Emphasis threshold must be between 1 and 10');
        }
        options.emphasisThreshold = emph;
      }
    }
  }
  
  return { expression, options };
}

/**
 * Parse the basic roll expression (XkY[+/-Z])
 */
function parseBasicRollExpression(rollStr: string): RollExpression {
  // Match pattern: digits + 'k' + digits + optional modifier
  const pattern = /^(\d+)k(\d+)([\+\-]\d+)?$/;
  const match = rollStr.match(pattern);
  
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
