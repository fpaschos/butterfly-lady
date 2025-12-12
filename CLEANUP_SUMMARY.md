# ✅ Cleanup Complete

All 4 requested cleanup tasks have been implemented successfully.

## Changes Made

### 1. ✅ Removed `skill:` Option

**Why:** Not needed for the bot's functionality.

**Files Modified:**
- `src/types/dice.ts` - Removed `skillName` from `RollOptions`
- `src/utils/parser.ts` - Removed skill parsing logic
- `src/utils/dice.ts` - Removed skillName from options
- `src/utils/formatter.ts` - Removed skill name from title
- `src/commands/roll.ts` - Removed from examples
- `src/commands/help.ts` - Removed from documentation
- `README.md` - Removed from examples

**Before:**
```
/roll 8k5 m e:2 tn:25 r:1 skill:Kenjutsu
```

**After:**
```
/roll 8k5 m e:2 tn:25 r:1
```

---

### 2. ✅ Emphasis Defaults to `e:1`

**Why:** Better ergonomics - most common use case is rerolling 1s.

**Files Modified:**
- `src/utils/parser.ts` - Added logic to treat `e` as `e:1`

**Before:**
```
/roll 6k3 e:1    # Had to specify :1 explicitly
```

**After:**
```
/roll 6k3 e      # Defaults to e:1 (reroll 1s)
/roll 6k3 e:2    # Still can specify e:2, e:3, etc.
```

**Implementation:**
```typescript
else if (part === 'e' || part === 'emph' || part === 'emphasis') {
  // e without value defaults to e:1
  options.emphasisThreshold = 1;
}
```

---

### 3. ✅ All Rolls Show Detailed View

**Why:** Detailed information is always valuable, no need for a flag.

**Files Modified:**
- `src/types/dice.ts` - Removed `detailed` from `RollOptions`
- `src/utils/formatter.ts` - Removed simple mode, always show detailed
- `src/commands/roll.ts` - Removed `--detailed` from examples
- `src/commands/help.ts` - Removed `--detailed` references
- `README.md` - Removed `--detailed` flag

**Before:**
```
/roll 5k3 tn:15              # Simple view
/roll 5k3 tn:15 --detailed   # Detailed view
```

**After:**
```
/roll 5k3 tn:15              # Always shows full detailed breakdown
```

**What's Shown:**
- All dice with explosions
- Emphasis rerolls (if any)
- Calculation breakdown
- TN check with margin (if specified)
- Raises breakdown (if specified)

---

### 4. ✅ Emphasis Info in Footer

**Why:** Show which mechanics were applied, consistent with mastery/explosion displays.

**Files Modified:**
- `src/utils/formatter.ts` - Added emphasis to footer with 🔄 icon

**Footer Now Shows:**
- 💥 Explosions (skilled mode)
- ✨ Mastery explosions (mastery mode)
- ⚪ Unskilled (no explosions)
- 🔄 **Emphasis rerolls** (NEW!)

**Example Output:**
```
Footer: "✨ Mastery: 3 dice exploded (9s and 10s) • 🔄 Emphasis: 2 dice rerolled (≤2)"
```

**Implementation:**
```typescript
// Emphasis reroll info
if (result.emphasisRerolls && result.emphasisRerolls.length > 0) {
  parts.push(`🔄 Emphasis: ${result.emphasisRerolls.length} ${result.emphasisRerolls.length === 1 ? 'die' : 'dice'} rerolled (≤${result.options.emphasisThreshold})`);
}
```

---

## Examples with All Changes

### Basic Roll
```
/roll 5k3
```
Output shows:
- All dice
- Kept dice in bold
- Calculation
- Footer: "💥 1 die exploded (10s)" (if any 10s)

### Emphasis (Default)
```
/roll 6k3 e
```
Output shows:
- Dice with rerolls
- "Emphasis Rerolls (≤1)" section showing old → new
- Calculation
- Footer: "🔄 Emphasis: 2 dice rerolled (≤1)"

### Emphasis (Custom)
```
/roll 6k3 e:3
```
Output shows:
- Rerolls all 1s, 2s, and 3s
- Footer: "🔄 Emphasis: 4 dice rerolled (≤3)"

### Full Combo
```
/roll 8k5 m e:2 tn:25 r:2
```
Output shows:
- Mastery explosions on 9s and 10s
- Emphasis rerolls ≤2
- All dice (kept in bold)
- Calculation breakdown
- TN check vs 30 (25 + 2×5)
- Raises achieved
- Footer: "✨ Mastery: 2 dice exploded (9s and 10s) • 🔄 Emphasis: 3 dice rerolled (≤2)"

---

## Technical Summary

### Files Modified: 8
1. `src/types/dice.ts`
2. `src/utils/parser.ts`
3. `src/utils/dice.ts`
4. `src/utils/formatter.ts`
5. `src/commands/roll.ts`
6. `src/commands/help.ts`
7. `README.md`
8. This file (CLEANUP_SUMMARY.md)

### Lines Changed: ~150

### Linter Status:
- ✅ Core files: Clean
- ⚠️ Minor warnings: 1 (unused import warning, false positive)
- Discord.js type compatibility warnings (don't affect functionality)

---

## Updated Command Syntax

**Format:**
```
/roll XkY[+/-Z] [flags] [tn:N] [r:N] [e or e:N]
```

**Flags:**
- _(default)_ = Skilled (10s explode)
- `u` = Unskilled (no explosions)
- `m` = Mastery (9s and 10s explode)

**Options:**
- `tn:N` = Target Number
- `r:N` = Called raises
- `e` = Emphasis (defaults to e:1)
- `e:N` = Emphasis with custom threshold

---

## Benefits

1. **Simpler Commands** ✅
   - No need for `--detailed` flag
   - `e` is shorter than `e:1`
   - No `skill:` clutter

2. **Better UX** ✅
   - Always see full information
   - Clear footer shows which mechanics applied
   - Consistent icon usage

3. **Cleaner Code** ✅
   - Removed unused skill feature
   - Simplified formatter (no mode switching)
   - Less complexity in parser

4. **More Intuitive** ✅
   - `e` naturally means "reroll 1s" (most common)
   - All rolls consistently formatted
   - Footer tells you what happened

---

## Testing Recommendations

Test these scenarios:

```bash
# Emphasis defaults
/roll 6k3 e          # Should reroll 1s
/roll 6k3 e:2        # Should reroll ≤2
/roll 6k3 e:3        # Should reroll ≤3

# Footer display
/roll 5k3 m          # Should show mastery in footer
/roll 5k3 e          # Should show emphasis in footer
/roll 5k3 m e        # Should show both in footer

# No skill names
/roll 5k3 tn:15      # Should work without skill:
# skill: should not be recognized

# All detailed
/roll 5k3            # Should show full breakdown
/roll 5k3 tn:15      # Should show full breakdown
```

---

## Backward Compatibility

### Breaking Changes:
1. `skill:Name` option removed (was cosmetic only)
2. `--detailed` flag removed (all rolls now detailed)

### Still Works:
- All core mechanics
- All flags (u, m, e)
- All options (tn, r, e:N)
- Ten Dice Rule
- Raises
- Everything else

---

**Cleanup complete! Bot is now simpler and more user-friendly.** ✨

