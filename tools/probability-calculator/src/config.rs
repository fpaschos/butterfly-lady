use serde::{Deserialize, Serialize};

/// Explosion modes for L5R dice rolling
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ExplosionMode {
    Unskilled, // No explosions
    Skilled,   // 10s explode (default L5R)
    Mastery,   // 9s and 10s explode
}

impl ExplosionMode {
    /// Get the number of simulation rounds for this explosion mode
    pub fn simulation_rounds(&self) -> usize {
        match self {
            ExplosionMode::Unskilled => 200_000,
            ExplosionMode::Skilled => 300_000,
            ExplosionMode::Mastery => 500_000,
        }
    }
}

/// Configuration for a single roll type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct RollConfig {
    pub roll: u8,               // X in XkY (1-10)
    pub keep: u8,               // Y in XkY (1-X)
    pub explosion_mode: ExplosionMode,
    pub emphasis: bool,         // Whether emphasis is active
}

impl RollConfig {
    pub fn new(roll: u8, keep: u8, explosion_mode: ExplosionMode, emphasis: bool) -> Self {
        assert!(roll >= 1 && roll <= 10, "Roll must be 1-10");
        assert!(keep >= 1 && keep <= roll, "Keep must be 1-roll");
        
        Self {
            roll,
            keep,
            explosion_mode,
            emphasis,
        }
    }

    /// Get the number of simulation rounds for this configuration
    pub fn simulation_rounds(&self) -> usize {
        self.explosion_mode.simulation_rounds()
    }
}

/// Generate all 330 roll configurations
pub fn generate_all_configs() -> Vec<RollConfig> {
    let mut configs = Vec::with_capacity(330);
    
    // Enumerate all XkY combinations (55 pools)
    for roll in 1..=10 {
        for keep in 1..=roll {
            // For each pool, try all explosion modes (3) and emphasis states (2)
            for explosion_mode in [ExplosionMode::Unskilled, ExplosionMode::Skilled, ExplosionMode::Mastery] {
                for emphasis in [false, true] {
                    configs.push(RollConfig::new(roll, keep, explosion_mode, emphasis));
                }
            }
        }
    }
    
    assert_eq!(configs.len(), 330, "Expected 330 configurations");
    configs
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_all_configs() {
        let configs = generate_all_configs();
        
        // Should generate exactly 330 configs
        assert_eq!(configs.len(), 330);
        
        // Check that we have all explosion modes
        let unskilled_count = configs.iter().filter(|c| c.explosion_mode == ExplosionMode::Unskilled).count();
        let skilled_count = configs.iter().filter(|c| c.explosion_mode == ExplosionMode::Skilled).count();
        let mastery_count = configs.iter().filter(|c| c.explosion_mode == ExplosionMode::Mastery).count();
        
        assert_eq!(unskilled_count, 110); // 55 pools × 2 emphasis states
        assert_eq!(skilled_count, 110);
        assert_eq!(mastery_count, 110);
        
        // Check emphasis distribution
        let emphasis_on = configs.iter().filter(|c| c.emphasis).count();
        let emphasis_off = configs.iter().filter(|c| !c.emphasis).count();
        
        assert_eq!(emphasis_on, 165); // 55 pools × 3 modes
        assert_eq!(emphasis_off, 165);
    }

    #[test]
    fn test_valid_pools() {
        let configs = generate_all_configs();
        
        // All configs should have valid roll/keep values
        for config in configs {
            assert!(config.roll >= 1 && config.roll <= 10);
            assert!(config.keep >= 1 && config.keep <= config.roll);
        }
    }
}

