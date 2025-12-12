import { randomBytes } from 'crypto';
import seedrandom from 'seedrandom';
import { 
  DieResult, 
  RollExpression, 
  RollResult, 
  RollOptions,
  ExplosionMode,
  TenDiceRuleConversion,
  EmphasisReroll
} from '../types/dice.js';

/**
 * Create a cryptographically strong seed from OS entropy
 */
function createOSSeed(): string {
  const cryptoBytes = randomBytes(32).toString('hex');
  const timestamp = Date.now().toString(36);
  const pid = process.pid.toString(36);
  return `${cryptoBytes}-${timestamp}-${pid}`;
}

// Initialize RNG based on environment
let rng: seedrandom.PRNG;

if (process.env.NODE_ENV === 'test' && process.env.DICE_SEED) {
  rng = seedrandom(process.env.DICE_SEED);
  console.log('🎲 Test mode: deterministic seed');
} else if (process.env.DICE_SEED) {
  rng = seedrandom(process.env.DICE_SEED);
  console.log('🎲 Development: explicit seed:', process.env.DICE_SEED);
} else {
  const seed = createOSSeed();
  rng = seedrandom(seed);
  console.log('🎲 Production: OS-entropy seed initialized');
}

/**
 * Manually set a seed (useful for testing or Phase 2 statistics)
 */
export function setSeed(seed?: string): void {
  if (seed) {
    rng = seedrandom(seed);
  } else {
    rng = seedrandom(createOSSeed());
  }
}

/**
 * Roll a single d10 with explosion mode
 * 
 * @param mode Explosion mode (skilled/unskilled/mastery)
 * @returns DieResult with final value and roll history
 */
function rollD10WithExplosion(mode: ExplosionMode): DieResult {
  const rolls: number[] = [];
  let total = 0;
  let exploded = false;
  
  let currentRoll: number;
  do {
    currentRoll = Math.floor(rng() * 10) + 1;
    rolls.push(currentRoll);
    total += currentRoll;
    
    // Check if die explodes based on mode
    let shouldExplode = false;
    if (mode === ExplosionMode.Skilled && currentRoll === 10) {
      shouldExplode = true;
      exploded = true;
    } else if (mode === ExplosionMode.Mastery && (currentRoll === 9 || currentRoll === 10)) {
      shouldExplode = true;
      exploded = true;
    }
    // Unskilled mode never explodes
    
    if (!shouldExplode) break;
  } while (true);
  
  return {
    value: total,
    rolls,
    exploded
  };
}

/**
 * Apply the Ten Dice Rule (L5R 4e p. 76)
 * No more than 10 rolled or kept dice
 */
export function applyTenDiceRule(roll: number, keep: number): {
  roll: number;
  keep: number;
  bonus: number;
  applied: boolean;
  original?: { roll: number; keep: number };
} {
  if (roll <= 10 && keep <= 10) {
    return { roll, keep, bonus: 0, applied: false };
  }
  
  const original = { roll, keep };
  let newRoll = roll;
  let newKeep = keep;
  let bonus = 0;
  
  // Handle excess rolled dice
  if (newRoll > 10) {
    const excessRolled = newRoll - 10;
    // Every 2 excess rolled dice become 1 kept die
    const keptFromRolled = Math.floor(excessRolled / 2);
    // Odd leftover rolled die becomes +2 bonus
    const oddRolled = excessRolled % 2;
    
    newRoll = 10;
    newKeep += keptFromRolled;
    bonus += oddRolled * 2;
  }
  
  // Handle excess kept dice
  if (newKeep > 10) {
    const excessKept = newKeep - 10;
    // Each excess kept die becomes +2 bonus
    bonus += excessKept * 2;
    newKeep = 10;
  }
  
  return {
    roll: newRoll,
    keep: newKeep,
    bonus,
    applied: true,
    original
  };
}

/**
 * Apply emphasis rerolls
 * Reroll any die showing ≤ threshold value once
 */
export function applyEmphasis(
  dice: DieResult[],
  threshold: number,
  mode: ExplosionMode
): { dice: DieResult[]; rerolls: EmphasisReroll[] } {
  const newDice = [...dice];
  const rerolls: EmphasisReroll[] = [];
  
  for (let i = 0; i < newDice.length; i++) {
    const die = newDice[i];
    // Only reroll non-exploded dice that are ≤ threshold
    if (!die.exploded && die.value <= threshold) {
      const oldValue = die.value;
      const newDie = rollD10WithExplosion(mode);
      newDice[i] = newDie;
      rerolls.push({
        diceIndex: i,
        oldValue,
        newValue: newDie.value
      });
    }
  }
  
  return { dice: newDice, rerolls };
}

/**
 * Calculate raises
 */
export function calculateRaises(
  total: number,
  baseTN: number,
  calledRaises: number
): {
  effectiveTN: number;
  success: boolean;
  calledRaises: number;
  achievedRaises: number;
  marginOfSuccess: number;
} {
  const effectiveTN = baseTN + (calledRaises * 5);
  const success = total >= effectiveTN;
  const margin = total - effectiveTN;
  
  // Calculate additional raises beyond called raises
  const additionalRaises = success && margin >= 5 ? Math.floor(margin / 5) : 0;
  const achievedRaises = success ? calledRaises + additionalRaises : 0;
  
  return {
    effectiveTN,
    success,
    calledRaises,
    achievedRaises,
    marginOfSuccess: margin
  };
}

/**
 * Execute a Roll & Keep roll with L5R 4th Edition rules
 */
export function executeRoll(
  expression: RollExpression,
  options?: Partial<RollOptions>
): RollResult {
  // Set default options
  const fullOptions: RollOptions = {
    explosionMode: options?.explosionMode || ExplosionMode.Skilled,
    targetNumber: options?.targetNumber,
    calledRaises: options?.calledRaises || 0,
    emphasisThreshold: options?.emphasisThreshold
  };
  
  let { roll, keep, modifier } = expression;
  
  // Step 1: Apply Ten Dice Rule
  const tenDiceResult = applyTenDiceRule(roll, keep);
  let tenDiceRuleApplied: TenDiceRuleConversion | undefined;
  
  if (tenDiceResult.applied) {
    roll = tenDiceResult.roll;
    keep = tenDiceResult.keep;
    modifier += tenDiceResult.bonus;
    tenDiceRuleApplied = {
      original: tenDiceResult.original!,
      converted: { roll, keep, bonus: tenDiceResult.bonus }
    };
  }
  
  // Step 2: Roll all dice with appropriate explosion mode
  let allDice: DieResult[] = [];
  for (let i = 0; i < roll; i++) {
    allDice.push(rollD10WithExplosion(fullOptions.explosionMode));
  }
  
  // Step 3: Apply emphasis rerolls if specified
  let emphasisRerolls: EmphasisReroll[] | undefined;
  if (fullOptions.emphasisThreshold !== undefined) {
    const emphasisResult = applyEmphasis(
      allDice,
      fullOptions.emphasisThreshold,
      fullOptions.explosionMode
    );
    allDice = emphasisResult.dice;
    emphasisRerolls = emphasisResult.rerolls.length > 0 
      ? emphasisResult.rerolls 
      : undefined;
  }
  
  // Step 4: Keep highest dice
  const sortedIndices = allDice
    .map((die, index) => ({ die, index }))
    .sort((a, b) => b.die.value - a.die.value)
    .slice(0, keep)
    .map(item => item.index);
  
  // Step 5: Calculate totals
  const subtotal = sortedIndices.reduce((sum, index) => sum + allDice[index].value, 0);
  const total = subtotal + modifier;
  
  // Step 6: Check against TN and calculate raises if specified
  let success: boolean | undefined;
  let achievedRaises: number | undefined;
  let marginOfSuccess: number | undefined;
  
  if (fullOptions.targetNumber !== undefined) {
    const raisesResult = calculateRaises(
      total,
      fullOptions.targetNumber,
      fullOptions.calledRaises || 0
    );
    success = raisesResult.success;
    achievedRaises = raisesResult.achievedRaises;
    marginOfSuccess = raisesResult.marginOfSuccess;
  }
  
  return {
    expression,
    options: fullOptions,
    allDice,
    keptIndices: sortedIndices,
    subtotal,
    total,
    tenDiceRuleApplied,
    emphasisRerolls,
    success,
    achievedRaises,
    marginOfSuccess
  };
}

/**
 * Format a die result for display
 */
export function formatDieResult(die: DieResult): string {
  if (die.exploded) {
    const rollsStr = die.rolls.join('+');
    return `${die.value} (${rollsStr})`;
  }
  return die.value.toString();
}
