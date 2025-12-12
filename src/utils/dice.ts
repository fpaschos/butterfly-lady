import { DieResult, RollExpression, RollResult } from '../types/dice.js';

/**
 * Roll a single d10 with the Rule of 10 (explosion)
 * When a 10 is rolled, roll again and add to the total
 * 
 * @returns DieResult with final value and roll history
 */
function rollD10WithExplosion(): DieResult {
  const rolls: number[] = [];
  let total = 0;
  let exploded = false;
  
  // Keep rolling while we get 10s
  let currentRoll: number;
  do {
    currentRoll = Math.floor(Math.random() * 10) + 1;
    rolls.push(currentRoll);
    total += currentRoll;
    
    if (currentRoll === 10) {
      exploded = true;
    }
  } while (currentRoll === 10);
  
  return {
    value: total,
    rolls,
    exploded
  };
}

/**
 * Execute a Roll & Keep roll with L5R 4th Edition rules
 * 
 * @param expression The parsed roll expression
 * @returns Complete roll result with all dice and totals
 */
export function executeRoll(expression: RollExpression): RollResult {
  const { roll, keep, modifier } = expression;
  
  // Roll all dice
  const allDice: DieResult[] = [];
  for (let i = 0; i < roll; i++) {
    allDice.push(rollD10WithExplosion());
  }
  
  // Sort dice by value (descending) and get indices of kept dice
  const sortedIndices = allDice
    .map((die, index) => ({ die, index }))
    .sort((a, b) => b.die.value - a.die.value)
    .slice(0, keep)
    .map(item => item.index);
  
  // Calculate subtotal from kept dice
  const subtotal = sortedIndices.reduce((sum, index) => sum + allDice[index].value, 0);
  
  // Apply modifier
  const total = subtotal + modifier;
  
  return {
    expression,
    allDice,
    keptIndices: sortedIndices,
    subtotal,
    total
  };
}

/**
 * Format a die result for display
 * Shows individual rolls if the die exploded
 * 
 * @param die The die result to format
 * @returns Formatted string representation
 */
export function formatDieResult(die: DieResult): string {
  if (die.exploded) {
    // Show explosion: "18 (10+8)" or "23 (10+10+3)"
    const rollsStr = die.rolls.join('+');
    return `${die.value} (${rollsStr})`;
  }
  return die.value.toString();
}

