# Phase 2: Advanced L5R 4th Edition Mechanics

## ✅ Implemented Features

Phase 2 adds comprehensive L5R 4th Edition mechanics to the Butterfly Lady Discord bot.

## 🎲 Core Mechanics

### **Explosion Modes**

| Mode | Flag | Behavior |
|------|------|----------|
| **Skilled** | _(default)_ | 10s explode (standard L5R rule) |
| **Unskilled** | `u` | No explosions |
| **Mastery** | `m` | 9s and 10s explode |

**Examples:**
```
/roll 5k3           # Skilled: 10s explode
/roll 5k3 u         # Unskilled: no explosions
/roll 7k4 m         # Mastery: 9s and 10s explode
```

### **Ten Dice Rule**

Automatically converts rolls exceeding 10 rolled or 10 kept dice:

**Conversion Rules:**
- Maximum 10 rolled dice, maximum 10 kept dice
- Every 2 excess rolled dice → 1 kept die
- Odd excess rolled die → +2 bonus
- Each excess kept die → +2 bonus

**Examples:**
- `12k4` → `10k5` (2 extra rolled → 1 kept)
- `13k9` → `10k10+2` (2 rolled → 1 kept, 1 odd → +2)
- `10k12` → `10k10+4` (2 extra kept → +4 bonus)
- `14k12` → `10k10+12` (4 rolled → +8, 2 kept → +4)

### **Target Numbers (TN)**

Roll against a target number to succeed:

**Syntax:** `tn:<number>`  
**Aliases:** `t:<number>`, `vs:<number>`

```
/roll 5k3 tn:15         # Roll vs TN 15
/roll 7k4+10 tn:25      # With modifier
```

**Display:**
- ✅ Success - Roll meets or exceeds TN
- ❌ Failed - Roll below TN
- Shows margin of success/failure

### **Raises**

Voluntarily increase difficulty for extra effect:

**Syntax:** `r:<number>` or `raises:<number>`  
**Effect:** Each raise adds +5 to the TN

```
/roll 7k4 tn:20 r:2     # TN becomes 30 (20 + 2×5)
```

**Auto-calculation:**
- Shows if called raises succeeded
- Calculates additional raises achieved
- Each 5 points above TN = 1 extra raise

**Example:**
```
Roll: 40 vs TN 15, 2 called raises
- Effective TN: 25 (15 + 10)
- Success: 40 ≥ 25 ✅
- Margin: +15
- Additional raises: 3 (15 ÷ 5)
- Total achieved: 5 raises
```

### **Emphasis**

Reroll dice showing low values once:

**Syntax:** `e:<threshold>`  
**Aliases:** `emph:<threshold>`, `emphasis:<threshold>`

**Effect:** Reroll any die showing ≤ threshold (before keeping)

```
/roll 6k3 e:2           # Reroll 1s and 2s
/roll 8k5 e:3           # Reroll 1s, 2s, and 3s
```

**Rules:**
- Only non-exploded dice are rerolled
- Reroll uses current explosion mode
- Rerolled dice can explode
- Each die rerolls once maximum

### **Skill Names**

Add skill name for display/roleplay:

**Syntax:** `skill:<name>`

```
/roll 8k5 tn:25 skill:Kenjutsu
/roll 6k3 tn:15 skill:Investigation
```

### **Detailed Mode**

Show full breakdown of roll:

**Syntax:** `--detailed` or `-d`

```
/roll 8k5 m e:2 tn:25 r:2 skill:Kenjutsu --detailed
```

**Displays:**
- All dice with explosions shown
- Emphasis rerolls (old → new values)
- Full calculation breakdown
- TN check with margin
- Raise calculations

## 📋 Command Syntax

```
/roll <expression> [flags] [tn:<num>] [r:<num>] [e:<num>] [skill:<name>]
```

**Order matters:** Flags should come BEFORE tn/raises

### **Complete Examples**

```bash
# Basic rolls
/roll 5k3                           # Skilled roll
/roll 5k3+10                        # With modifier
/roll 12k5                          # Ten Dice Rule applies (→10k6)

# Explosion modes
/roll 5k3 u                         # Unskilled
/roll 7k4 m                         # Mastery

# Target Numbers
/roll 5k3 tn:15                     # Simple TN check
/roll 7k4+10 tn:20                  # TN with modifier

# Raises
/roll 8k5 tn:20 r:2                 # 2 called raises (TN→30)
/roll 10k6+15 tn:25 r:3             # 3 raises (TN→40)

# Emphasis
/roll 6k3 e:2                       # Reroll ≤2
/roll 8k5 e:3 tn:20                 # Emphasis + TN

# Skill naming
/roll 7k4 tn:20 skill:Iaijutsu
/roll 6k3 e:2 tn:15 skill:Investigation

# Combined mechanics
/roll 8k5 m e:2 tn:25 r:2 skill:Kenjutsu
# → Mastery + Emphasis + TN 35 + Kenjutsu

/roll 12k6+15 m e:3 tn:30 r:3 skill:Tetsubo --detailed
# → Full combo with detailed output

# Unskilled attempts
/roll 4k2 u tn:20
# → No explosions, vs TN 20
```

## 🎯 Use Cases

### **Combat Rolls**
```
# Basic attack
/roll 7k4+10 tn:20 skill:Kenjutsu

# Called shot (raise)
/roll 8k5+15 tn:25 r:2 skill:Kyujutsu

# Master samurai with technique
/roll 10k6+20 m tn:30 r:2 skill:Iaijutsu
```

### **Skill Checks**
```
# Investigation
/roll 6k3 e:2 tn:15 skill:Investigation

# Unskilled attempt
/roll 3k2 u tn:20 skill:Medicine

# Emphasis on specialty
/roll 7k4 e:2 tn:25 skill:Courtier
```

### **Contested Rolls**
```
# Both players roll, compare totals
Player 1: /roll 6k3 skill:Stealth
Player 2: /roll 5k2 skill:Investigation
```

### **High-Level Characters**
```
# 10+ dice trigger Ten Dice Rule
/roll 12k7+20 m tn:35 r:3 skill:Kenjutsu

# Becomes: 10k8+20 with mastery
```

## 🔧 Technical Details

### **Order of Operations**

1. Parse expression and options
2. Apply Ten Dice Rule to roll/keep values
3. Roll all dice with appropriate explosion mode
4. Apply emphasis rerolls (if specified)
5. Keep highest dice
6. Calculate total with modifier
7. Check against TN (if specified)
8. Calculate raises (if TN specified)

### **Explosion Logic**

**Skilled Mode:**
```
Roll 10 → roll again → 7 = 17 total
Roll 10 → roll again → 10 → roll again → 3 = 23 total
```

**Mastery Mode:**
```
Roll 9 → roll again → 10 → roll again → 4 = 23 total
Roll 10 → roll again → 9 → roll again → 2 = 21 total
```

**Unskilled Mode:**
```
Roll 10 = 10 (no explosion)
```

### **Emphasis Reroll Logic**

```
Initial roll: [10+5=15], [2], [1], [8], [7], [3]
Emphasis e:2
Rerolls: [2] → [10+6=16], [1] → [4]
Final: [15], [16], [4], [8], [7], [3]
Keep 3: [16], [15], [8] = 39
```

### **Raises Calculation**

```
Base TN: 20
Called raises: 2
Effective TN: 20 + (2 × 5) = 30

Roll total: 45
Success: 45 ≥ 30 ✅
Margin: 45 - 30 = 15
Additional raises: 15 ÷ 5 = 3
Total achieved: 2 + 3 = 5 raises
```

## 📊 Display Modes

### **Simple Mode** (default)
- Dice rolled with kept dice in bold
- Total result
- Success/failure vs TN
- Raises achieved

### **Detailed Mode** (`--detailed`)
- All dice with explosion breakdowns
- Emphasis rerolls shown (old → new)
- Full calculation steps
- TN check with margin
- Raise breakdown (called + bonus)
- Ten Dice Rule conversion details

## 🎨 Visual Indicators

| Icon | Meaning |
|------|---------|
| 🎲 | Skilled roll |
| ⚪ | Unskilled roll |
| ✨ | Mastery roll |
| ✅ | Success vs TN |
| ❌ | Failed vs TN |
| 💥 | Explosions occurred (skilled) |
| 📏 | Ten Dice Rule applied |

## ⚙️ Configuration

All Phase 2 features work with the existing seedrandom implementation:
- Production: OS entropy (cryptographically secure)
- Testing: Set `DICE_SEED` env var for deterministic rolls

## 🚀 What's Next

**Phase 3:** Statistics & Probability
- Simulate thousands of rolls
- Show probability distributions
- Compare roll combinations
- Monte Carlo analysis

**Phase 4:** RAG & AI Integration
- PostgreSQL with pgvector
- Embed L5R rulebooks and lore
- Natural language rules lookup
- Character sheet integration

---

**Phase 2 Complete!** All advanced L5R 4th Edition mechanics are now available! 🎉

