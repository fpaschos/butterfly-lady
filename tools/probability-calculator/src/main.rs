mod config;
mod dice;
mod stats;
mod output;

use std::time::Instant;
use config::{generate_all_configs, RollConfig};
use dice::simulate_roll_xky;
use stats::{calculate_statistics, calculate_cumulative_probabilities, validate_distribution, validate_cumulative};
use output::{create_probability_tables, write_json_file, format_file_size, ProbabilityTable};

fn main() {
    println!("🎲 L5R Probability Calculator");
    println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    // Generate all configurations
    let configs = generate_all_configs();
    println!("📊 Generating {} probability tables...", configs.len());
    println!();
    
    let start_time = Instant::now();
    let mut tables = Vec::with_capacity(configs.len());
    
    // Process each configuration
    for (index, config) in configs.iter().enumerate() {
        let config_start = Instant::now();
        
        // Show progress
        print_progress(index + 1, configs.len(), &config);
        
        // Run simulation
        let histogram = simulate_roll_xky(&config);
        let total_count = config.simulation_rounds();
        
        // Validate distribution
        if let Err(e) = validate_distribution(&histogram, total_count) {
            eprintln!("❌ Validation error for {:?}: {}", config, e);
            std::process::exit(1);
        }
        
        // Calculate statistics
        let statistics = calculate_statistics(&histogram, total_count);
        
        // Calculate cumulative probabilities
        let cumulative = calculate_cumulative_probabilities(&histogram, total_count);
        
        // Validate cumulative
        if let Err(e) = validate_cumulative(&cumulative) {
            eprintln!("❌ Cumulative validation error for {:?}: {}", config, e);
            std::process::exit(1);
        }
        
        // Create table entry
        let table = ProbabilityTable::new(&config, statistics, cumulative);
        tables.push(table);
        
        // Show timing for this config
        let elapsed = config_start.elapsed();
        println!(" [{:.2}s]", elapsed.as_secs_f64());
    }
    
    println!();
    println!("✅ All simulations complete!");
    
    // Create output structure
    let probability_tables = create_probability_tables(tables);
    
    // Write to file
    let output_path = "../../packages/core/data/probability-tables.json";
    println!("📝 Writing to {}", output_path);
    
    if let Err(e) = write_json_file(output_path, &probability_tables) {
        eprintln!("❌ Failed to write JSON: {}", e);
        std::process::exit(1);
    }
    
    // Get file size
    if let Ok(metadata) = std::fs::metadata(output_path) {
        let size = format_file_size(metadata.len());
        println!("📦 File size: {}", size);
    }
    
    // Show summary
    let total_elapsed = start_time.elapsed();
    println!();
    println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    println!("🎉 Complete!");
    println!("⏱️  Total time: {:.2}s", total_elapsed.as_secs_f64());
    println!("📊 Tables generated: {}", configs.len());
    
    // Show some sample statistics
    show_sample_statistics(&probability_tables);
}

fn print_progress(current: usize, total: usize, config: &RollConfig) {
    let percent = (current as f64 / total as f64) * 100.0;
    let mode_str = match config.explosion_mode {
        config::ExplosionMode::Unskilled => "u",
        config::ExplosionMode::Skilled => "s",
        config::ExplosionMode::Mastery => "m",
    };
    let emphasis_str = if config.emphasis { "+e" } else { "" };
    
    print!(
        "[{:3}/{:3}] ({:5.1}%) {}k{} {}{} ",
        current,
        total,
        percent,
        config.roll,
        config.keep,
        mode_str,
        emphasis_str
    );
}

fn show_sample_statistics(tables: &output::ProbabilityTables) {
    println!();
    println!("📈 Sample Statistics:");
    println!();
    
    // Find some interesting examples
    let examples = [
        (5, 3, config::ExplosionMode::Skilled, false, "5k3 skilled"),
        (7, 4, config::ExplosionMode::Mastery, false, "7k4 mastery"),
        (10, 10, config::ExplosionMode::Mastery, true, "10k10 mastery+emphasis"),
    ];
    
    for (roll, keep, mode, emphasis, label) in examples {
        if let Some(table) = tables.tables.iter().find(|t| {
            t.roll == roll && t.keep == keep && t.explosion_mode == mode && t.emphasis == emphasis
        }) {
            println!("  {} →", label);
            println!("    Mean:   {:.2}", table.statistics.mean);
            println!("    StdDev: {:.2}", table.statistics.stddev);
            println!("    Median: {}", table.statistics.median);
            println!("    Range:  {} - {}", table.statistics.min, table.statistics.max);
            
            // Show P(≥25) if available
            if let Some(prob) = table.cumulative_probability.get("25") {
                println!("    P(≥25): {:.1}%", prob * 100.0);
            }
            
            println!();
        }
    }
}

