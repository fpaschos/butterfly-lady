use std::collections::{BTreeMap, HashMap};
use serde::{Deserialize, Serialize};

/// Probability cutoff threshold (ε = 1e-6)
/// Only store TN values where P(total ≥ TN) ≥ this threshold
pub const PROBABILITY_CUTOFF: f64 = 1e-6;

/// Statistical measures for a distribution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Statistics {
    pub mean: f64,
    pub stddev: f64,
    pub median: i32,
    pub percentile_25: i32,
    pub percentile_75: i32,
    pub min: i32,
    pub max: i32,
}

/// Calculate statistics from a histogram
pub fn calculate_statistics(histogram: &HashMap<i32, usize>, total_count: usize) -> Statistics {
    // Convert to sorted list for percentile calculations
    let mut values_with_counts: Vec<(i32, usize)> = histogram.iter()
        .map(|(&v, &c)| (v, c))
        .collect();
    values_with_counts.sort_by_key(|(v, _)| *v);
    
    // Calculate mean
    let sum: i64 = values_with_counts.iter()
        .map(|(value, count)| (*value as i64) * (*count as i64))
        .sum();
    let mean = sum as f64 / total_count as f64;
    
    // Calculate standard deviation
    let variance: f64 = values_with_counts.iter()
        .map(|(value, count)| {
            let diff = (*value as f64) - mean;
            diff * diff * (*count as f64)
        })
        .sum::<f64>() / total_count as f64;
    let stddev = variance.sqrt();
    
    // Calculate percentiles
    let median = calculate_percentile(&values_with_counts, total_count, 0.50);
    let percentile_25 = calculate_percentile(&values_with_counts, total_count, 0.25);
    let percentile_75 = calculate_percentile(&values_with_counts, total_count, 0.75);
    
    // Min and max
    let min = values_with_counts.first().unwrap().0;
    let max = values_with_counts.last().unwrap().0;
    
    Statistics {
        mean,
        stddev,
        median,
        percentile_25,
        percentile_75,
        min,
        max,
    }
}

/// Calculate a specific percentile from sorted values with counts
fn calculate_percentile(
    values_with_counts: &[(i32, usize)],
    total_count: usize,
    percentile: f64,
) -> i32 {
    let target_count = (total_count as f64 * percentile) as usize;
    let mut cumulative = 0;
    
    for &(value, count) in values_with_counts {
        cumulative += count;
        if cumulative >= target_count {
            return value;
        }
    }
    
    // Should never reach here
    values_with_counts.last().unwrap().0
}

/// Convert histogram to cumulative probability distribution
/// 
/// Returns P(total ≥ TN) for each TN, with probability cutoff applied
pub fn calculate_cumulative_probabilities(
    histogram: &HashMap<i32, usize>,
    total_count: usize,
) -> BTreeMap<i32, f64> {
    // Convert to sorted probabilities
    let probabilities: BTreeMap<i32, f64> = histogram.iter()
        .map(|(&value, &count)| (value, count as f64 / total_count as f64))
        .collect();
    
    // Calculate cumulative: P(total ≥ TN)
    // Start from highest value and work backwards
    let mut cumulative_map: BTreeMap<i32, f64> = BTreeMap::new();
    let mut cumulative = 0.0;
    
    // Iterate in reverse order (highest to lowest)
    for (&value, &prob) in probabilities.iter().rev() {
        cumulative += prob;
        cumulative_map.insert(value, cumulative);
    }
    
    // Add entry for 0 (always 1.0 - everything is ≥ 0)
    cumulative_map.insert(0, 1.0);
    
    // Apply probability cutoff: remove entries with P < ε
    cumulative_map.retain(|_, &mut p| p >= PROBABILITY_CUTOFF);
    
    cumulative_map
}

/// Validate that a histogram represents a valid probability distribution
pub fn validate_distribution(histogram: &HashMap<i32, usize>, total_count: usize) -> Result<(), String> {
    // Check that sum of counts equals total
    let sum_counts: usize = histogram.values().sum();
    if sum_counts != total_count {
        return Err(format!(
            "Count sum mismatch: {} != {}",
            sum_counts, total_count
        ));
    }
    
    // Check that total probability ≈ 1.0
    let total_probability: f64 = histogram.values()
        .map(|&count| count as f64 / total_count as f64)
        .sum();
    
    if (total_probability - 1.0).abs() > 1e-9 {
        return Err(format!(
            "Probability sum not 1.0: {}",
            total_probability
        ));
    }
    
    Ok(())
}

/// Validate that cumulative probabilities are monotonically decreasing
pub fn validate_cumulative(cumulative: &BTreeMap<i32, f64>) -> Result<(), String> {
    let mut prev_prob = 1.0;
    const TOLERANCE: f64 = 1e-9;
    
    for (&tn, &prob) in cumulative.iter() {
        if prob > prev_prob + TOLERANCE {
            return Err(format!(
                "Non-monotonic cumulative at TN {}: {} > {}",
                tn, prob, prev_prob
            ));
        }
        
        // Allow for floating point precision errors
        if prob < -TOLERANCE || prob > 1.0 + TOLERANCE {
            return Err(format!(
                "Invalid probability at TN {}: {}",
                tn, prob
            ));
        }
        
        prev_prob = prob;
    }
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_statistics() {
        let mut histogram = HashMap::new();
        histogram.insert(10, 100);
        histogram.insert(20, 200);
        histogram.insert(30, 100);
        
        let stats = calculate_statistics(&histogram, 400);
        
        // Mean should be (10*100 + 20*200 + 30*100) / 400 = 20
        assert!((stats.mean - 20.0).abs() < 0.01);
        
        // Median should be 20
        assert_eq!(stats.median, 20);
        
        // Min and max
        assert_eq!(stats.min, 10);
        assert_eq!(stats.max, 30);
    }

    #[test]
    fn test_calculate_cumulative() {
        let mut histogram = HashMap::new();
        histogram.insert(10, 100);
        histogram.insert(20, 200);
        histogram.insert(30, 100);
        
        let cumulative = calculate_cumulative_probabilities(&histogram, 400);
        
        // P(≥ 0) = 1.0
        assert_eq!(cumulative.get(&0), Some(&1.0));
        
        // P(≥ 10) = 1.0
        assert_eq!(cumulative.get(&10), Some(&1.0));
        
        // P(≥ 20) = 0.75 (300/400)
        assert!((cumulative.get(&20).unwrap() - 0.75).abs() < 0.01);
        
        // P(≥ 30) = 0.25 (100/400)
        assert!((cumulative.get(&30).unwrap() - 0.25).abs() < 0.01);
    }

    #[test]
    fn test_validate_distribution() {
        let mut histogram = HashMap::new();
        histogram.insert(10, 100);
        histogram.insert(20, 200);
        histogram.insert(30, 100);
        
        // Should be valid
        assert!(validate_distribution(&histogram, 400).is_ok());
        
        // Should fail with wrong total
        assert!(validate_distribution(&histogram, 500).is_err());
    }

    #[test]
    fn test_validate_cumulative() {
        let mut cumulative = BTreeMap::new();
        cumulative.insert(0, 1.0);
        cumulative.insert(10, 1.0);
        cumulative.insert(20, 0.75);
        cumulative.insert(30, 0.25);
        
        // Should be valid
        assert!(validate_cumulative(&cumulative).is_ok());
        
        // Non-monotonic should fail
        let mut bad_cumulative = BTreeMap::new();
        bad_cumulative.insert(0, 1.0);
        bad_cumulative.insert(10, 0.5);
        bad_cumulative.insert(20, 0.75); // Goes up!
        
        assert!(validate_cumulative(&bad_cumulative).is_err());
    }

    #[test]
    fn test_probability_cutoff() {
        let mut histogram = HashMap::new();
        histogram.insert(10, 999_999);
        histogram.insert(100, 1); // Very rare outcome
        
        let cumulative = calculate_cumulative_probabilities(&histogram, 1_000_000);
        
        // P(≥ 100) = 0.000001, should be filtered by cutoff
        assert!(cumulative.get(&100).is_none());
        
        // P(≥ 10) = 1.0, should be kept
        assert_eq!(cumulative.get(&10), Some(&1.0));
    }
}

