# L5R Probability Calculator

Rust-based Monte Carlo simulator for precomputing probability distributions for all L5R 4th Edition Roll & Keep combinations.

## What It Does

Generates lookup tables for **330 roll configurations**:
- 55 dice pools (XkY where 1 ≤ Y ≤ X ≤ 10)
- 3 explosion modes (Unskilled, Skilled, Mastery)
- 2 emphasis states (Off, On)

## Output

Creates `../../packages/core/data/probability-tables.json` containing:
- Cumulative probabilities: P(total ≥ TN) for each configuration
- Statistics: mean, stddev, median, percentiles
- Metadata: version, timestamp, simulation parameters

## Usage

```bash
# Build and run in release mode (optimized)
cargo run --release

# Development mode (faster compile, slower execution)
cargo run
```

Expected runtime: 2-5 minutes (100M+ simulations)

## Simulation Parameters

- **Unskilled**: 200,000 rounds per config
- **Skilled**: 300,000 rounds per config
- **Mastery**: 500,000 rounds per config (long tails)

Probability cutoff: ε = 1e-6 (ignore outcomes < 0.0001%)

## Validation

The tool validates:
- Probability sums ≈ 1.0
- Cumulative probabilities monotonically decreasing
- Mean/stddev sanity checks
- Known benchmarks (e.g., 5k3 skilled mean ≈ 25)

## Output Format

JSON structure:
```json
{
  "version": "1.0.0",
  "generated_at": "2025-12-26T...",
  "simulation_rounds": 500000,
  "probability_cutoff": 1e-6,
  "tables": [
    {
      "roll": 5,
      "keep": 3,
      "explosion_mode": "skilled",
      "emphasis": false,
      "statistics": {
        "mean": 25.42,
        "stddev": 8.73,
        "median": 24,
        "percentile_25": 18,
        "percentile_75": 32,
        "min": 3,
        "max": 127
      },
      "cumulative_probability": {
        "0": 1.0,
        "3": 1.0,
        "15": 0.8234,
        "25": 0.4521,
        "127": 0.000001
      }
    }
  ]
}
```

## Notes

- **One-time use**: Generate once, commit, reuse
- **No runtime dependency**: Output is pure JSON for Node.js
- **Regenerate if rules change**: Easy to update and regenerate tables

