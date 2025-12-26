use rand::Rng;
use std::collections::HashMap;
use crate::config::{ExplosionMode, RollConfig};

/// Represents a single die result with explosion tracking
#[derive(Debug, Clone)]
pub struct DieResult {
    pub value: i32,
    pub exploded: bool,
}

impl DieResult {
    fn new(value: i32, exploded: bool) -> Self {
        Self { value, exploded }
    }
}

/// Roll a single d10 with explosion logic
/// 
/// Returns the total value and whether the die exploded.
/// This matches the logic in packages/core/src/dice/dice.ts
pub fn roll_d10_with_explosion<R: Rng>(mode: ExplosionMode, rng: &mut R) -> DieResult {
    let first_roll = rng.gen_range(1..=10);
    let mut total = first_roll;
    let mut exploded = false;
    
    // Check if first roll explodes
    let mut should_explode = match mode {
        ExplosionMode::Unskilled => false,
        ExplosionMode::Skilled => first_roll == 10,
        ExplosionMode::Mastery => first_roll == 9 || first_roll == 10,
    };
    
    if should_explode {
        exploded = true;
    }
    
    // Keep rolling while die explodes
    while should_explode {
        let next_roll = rng.gen_range(1..=10);
        total += next_roll;
        
        // Check if this roll also explodes
        should_explode = match mode {
            ExplosionMode::Unskilled => false,
            ExplosionMode::Skilled => next_roll == 10,
            ExplosionMode::Mastery => next_roll == 9 || next_roll == 10,
        };
    }
    
    DieResult::new(total, exploded)
}

/// Apply emphasis: reroll non-exploded dice showing 1
/// 
/// Matches the logic in packages/core/src/dice/dice.ts (lines 141-165)
/// Emphasis only rerolls dice that:
/// 1. Did NOT explode
/// 2. Show a value of 1
pub fn apply_emphasis<R: Rng>(
    dice: &mut Vec<DieResult>,
    mode: ExplosionMode,
    rng: &mut R,
) {
    for die in dice.iter_mut() {
        // Only reroll non-exploded dice showing 1
        if !die.exploded && die.value == 1 {
            let new_die = roll_d10_with_explosion(mode, rng);
            *die = new_die;
        }
    }
}

/// Simulate a single XkY roll and return the total
fn simulate_single_roll<R: Rng>(
    config: &RollConfig,
    rng: &mut R,
) -> i32 {
    // Step 1: Roll all dice
    let mut dice: Vec<DieResult> = (0..config.roll)
        .map(|_| roll_d10_with_explosion(config.explosion_mode, rng))
        .collect();
    
    // Step 2: Apply emphasis if enabled
    if config.emphasis {
        apply_emphasis(&mut dice, config.explosion_mode, rng);
    }
    
    // Step 3: Keep highest dice
    dice.sort_by(|a, b| b.value.cmp(&a.value));
    let kept_dice = &dice[0..(config.keep as usize)];
    
    // Step 4: Sum kept dice
    kept_dice.iter().map(|d| d.value).sum()
}

/// Run Monte Carlo simulation for a roll configuration
/// 
/// Returns a histogram: total value → count
pub fn simulate_roll_xky(config: &RollConfig) -> HashMap<i32, usize> {
    let rounds = config.simulation_rounds();
    let mut histogram: HashMap<i32, usize> = HashMap::new();
    let mut rng = rand::thread_rng();
    
    for _ in 0..rounds {
        let total = simulate_single_roll(config, &mut rng);
        *histogram.entry(total).or_insert(0) += 1;
    }
    
    histogram
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::SeedableRng;
    use rand::rngs::StdRng;

    #[test]
    fn test_unskilled_no_explosion() {
        let mut rng = StdRng::seed_from_u64(42);
        
        // Roll many times with unskilled mode
        for _ in 0..1000 {
            let result = roll_d10_with_explosion(ExplosionMode::Unskilled, &mut rng);
            // Unskilled should never explode
            assert!(!result.exploded);
            // Value should be 1-10
            assert!(result.value >= 1 && result.value <= 10);
        }
    }

    #[test]
    fn test_skilled_explosion_on_10() {
        let mut rng = StdRng::seed_from_u64(42);
        let mut found_explosion = false;
        
        for _ in 0..1000 {
            let result = roll_d10_with_explosion(ExplosionMode::Skilled, &mut rng);
            if result.exploded {
                found_explosion = true;
                // Exploded dice should have value > 10
                assert!(result.value > 10);
            }
        }
        
        // Should find at least some explosions in 1000 rolls
        assert!(found_explosion);
    }

    #[test]
    fn test_mastery_explosion_on_9_and_10() {
        let mut rng = StdRng::seed_from_u64(42);
        let mut found_explosion = false;
        
        for _ in 0..1000 {
            let result = roll_d10_with_explosion(ExplosionMode::Mastery, &mut rng);
            if result.exploded {
                found_explosion = true;
                // Exploded dice should have value > 8 (at least 9)
                assert!(result.value > 8);
            }
        }
        
        // Should find many explosions in 1000 rolls (20% chance per die)
        assert!(found_explosion);
    }

    #[test]
    fn test_emphasis_rerolls_ones() {
        let mut rng = StdRng::seed_from_u64(42);
        
        // Create dice with a non-exploded 1
        let mut dice = vec![
            DieResult::new(1, false),  // Should be rerolled
            DieResult::new(5, false),  // Should not be rerolled
            DieResult::new(10, true),  // Should not be rerolled (exploded)
        ];
        
        let original_value = dice[0].value;
        apply_emphasis(&mut dice, ExplosionMode::Skilled, &mut rng);
        
        // First die should have been rerolled (value changed)
        // Note: There's a small chance it rolls 1 again, but very unlikely
        assert_ne!(dice[0].value, original_value);
        
        // Second die should be unchanged
        assert_eq!(dice[1].value, 5);
        
        // Third die should be unchanged (was exploded)
        assert_eq!(dice[2].value, 10);
    }

    #[test]
    fn test_simulate_roll_histogram() {
        let config = RollConfig::new(3, 2, ExplosionMode::Skilled, false);
        let histogram = simulate_roll_xky(&config);
        
        // Should have entries
        assert!(!histogram.is_empty());
        
        // Total count should equal simulation rounds
        let total_count: usize = histogram.values().sum();
        assert_eq!(total_count, config.simulation_rounds());
        
        // All results should be >= 2 (minimum 2 dice showing 1)
        for &total in histogram.keys() {
            assert!(total >= 2);
        }
    }

    #[test]
    fn test_simulate_roll_basic_sanity() {
        let config = RollConfig::new(5, 3, ExplosionMode::Skilled, false);
        let histogram = simulate_roll_xky(&config);
        
        // Minimum possible: three 1s = 3
        let min_value = *histogram.keys().min().unwrap();
        assert!(min_value >= 3);
        
        // Should have reasonable distribution
        assert!(histogram.len() > 10); // More than 10 unique outcomes
    }
}

