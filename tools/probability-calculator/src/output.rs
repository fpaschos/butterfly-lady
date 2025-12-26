use std::collections::BTreeMap;
use std::fs::File;
use std::io::Write;
use std::path::Path;
use serde::{Deserialize, Serialize};
use chrono::Utc;

use crate::config::{ExplosionMode, RollConfig};
use crate::stats::{Statistics, PROBABILITY_CUTOFF};

/// Root structure for the JSON output
#[derive(Debug, Serialize, Deserialize)]
pub struct ProbabilityTables {
    pub version: String,
    pub generated_at: String,
    pub simulation_rounds: SimulationRounds,
    pub probability_cutoff: f64,
    pub tables: Vec<ProbabilityTable>,
}

/// Simulation round counts per explosion mode
#[derive(Debug, Serialize, Deserialize)]
pub struct SimulationRounds {
    pub unskilled: usize,
    pub skilled: usize,
    pub mastery: usize,
}

/// A single probability table entry
#[derive(Debug, Serialize, Deserialize)]
pub struct ProbabilityTable {
    pub roll: u8,
    pub keep: u8,
    pub explosion_mode: ExplosionMode,
    pub emphasis: bool,
    pub statistics: Statistics,
    pub cumulative_probability: BTreeMap<String, f64>,
}

impl ProbabilityTable {
    pub fn new(
        config: &RollConfig,
        statistics: Statistics,
        cumulative_probability: BTreeMap<i32, f64>,
    ) -> Self {
        // Convert BTreeMap<i32, f64> to BTreeMap<String, f64> for JSON
        let cumulative_probability = cumulative_probability
            .into_iter()
            .map(|(k, v)| (k.to_string(), v))
            .collect();
        
        Self {
            roll: config.roll,
            keep: config.keep,
            explosion_mode: config.explosion_mode,
            emphasis: config.emphasis,
            statistics,
            cumulative_probability,
        }
    }
}

/// Create the full probability tables structure
pub fn create_probability_tables(tables: Vec<ProbabilityTable>) -> ProbabilityTables {
    ProbabilityTables {
        version: "1.0.0".to_string(),
        generated_at: Utc::now().to_rfc3339(),
        simulation_rounds: SimulationRounds {
            unskilled: ExplosionMode::Unskilled.simulation_rounds(),
            skilled: ExplosionMode::Skilled.simulation_rounds(),
            mastery: ExplosionMode::Mastery.simulation_rounds(),
        },
        probability_cutoff: PROBABILITY_CUTOFF,
        tables,
    }
}

/// Write probability tables to JSON file
pub fn write_json_file<P: AsRef<Path>>(
    path: P,
    tables: &ProbabilityTables,
) -> Result<(), Box<dyn std::error::Error>> {
    let json = serde_json::to_string_pretty(tables)?;
    
    // Create parent directories if they don't exist
    if let Some(parent) = path.as_ref().parent() {
        std::fs::create_dir_all(parent)?;
    }
    
    let mut file = File::create(path)?;
    file.write_all(json.as_bytes())?;
    
    Ok(())
}

/// Format file size in human-readable format
pub fn format_file_size(bytes: u64) -> String {
    const KB: u64 = 1024;
    const MB: u64 = KB * 1024;
    
    if bytes < KB {
        format!("{} bytes", bytes)
    } else if bytes < MB {
        format!("{:.1} KB", bytes as f64 / KB as f64)
    } else {
        format!("{:.2} MB", bytes as f64 / MB as f64)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    #[test]
    fn test_create_probability_table() {
        let config = RollConfig::new(5, 3, ExplosionMode::Skilled, false);
        
        let stats = Statistics {
            mean: 25.5,
            stddev: 8.2,
            median: 24,
            percentile_25: 18,
            percentile_75: 32,
            min: 3,
            max: 100,
        };
        
        let mut cumulative = BTreeMap::new();
        cumulative.insert(0, 1.0);
        cumulative.insert(25, 0.5);
        cumulative.insert(50, 0.1);
        
        let table = ProbabilityTable::new(&config, stats, cumulative);
        
        assert_eq!(table.roll, 5);
        assert_eq!(table.keep, 3);
        assert_eq!(table.explosion_mode, ExplosionMode::Skilled);
        assert!(!table.emphasis);
        assert_eq!(table.statistics.mean, 25.5);
    }

    #[test]
    fn test_format_file_size() {
        assert_eq!(format_file_size(500), "500 bytes");
        assert_eq!(format_file_size(2048), "2.0 KB");
        assert_eq!(format_file_size(1_500_000), "1.43 MB");
    }
}

