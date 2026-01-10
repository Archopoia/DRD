# Souffrance Health System Implementation

## Overview

This document explains the implementation of the **Souffrance Health System** - an 8-type health system where suffering is directly linked to experience gain.

## Key Concepts

### 8 Types of Suffering (Souffrances)

Each Souffrance is tied to an Attribute:

1. **Blessures (FOR)** - Physical wounds
2. **Fatigues (AGI)** - Exhaustion, slowness
3. **Entraves (DEX)** - Impediments, blockages
4. **Disettes (VIG)** - Hunger, thirst, lack
5. **Addictions (EMP)** - Dependencies, unhealthy attachments
6. **Maladies (PER)** - Afflictions, infections
7. **Folies (CRÉ)** - Mental disorders, obsessions
8. **Rancœurs (VOL)** - Resentments, hatred

### Health States (Based on Total DS)

The **total** of all 8 souffrance types determines overall health:

- **NORMAL** (0-9 DS): Character is healthy
- **RAGE** (10-14 DS): Must roll 1d6 > Niv de Rage to act against instinct
- **UNCONSCIOUS** (15-20 DS): Must roll 1d6 > Niv d'Évanouissement to act
- **DEFEATED** (21-25 DS): Coma or Madness
- **DEATH** (26+ DS): Physical death or total loss of identity

### Séquelles (Sequelae) - Per Souffrance Type

Each individual souffrance type has levels:

- **0-2 DS**: None (Léger)
- **3-5 DS**: Passagère (Temporary)
- **6-9 DS**: Durable (Durable)
- **10-14 DS**: Permanente (Permanent)
- **15-20 DS**: Fatale (Fatal)
- **21-25 DS**: Vaincu (Defeated)
- **26+ DS**: Mort (Death)

## Experience Link: How Suffering Grants Marks

**Core Rule** (Page 63 & 72): When you use a competence and **fail**, you:
1. **Gain 1 mark per failure** on the competence you used (Page 63: "Pour chaque Échec obtenu... attribuez-vous 1 Marque à la CT utilisée")
2. **Each failure causes suffering** (typically 1 DS per failure)
3. **After resistance absorbs some suffering**, the actual damage gives marks on the resistance competence (Page 72: "Chaque Échec déterminé comme une Souffrance ET outrepassant votre Résistance liée... en Marque d'expérience dans la CT y ayant résisté")

### Resistance System

Each Souffrance has a **Resistance Competence** (R[Souffrance], e.g., R[Blessures]):

**Resistance Calculation** (Page 72):
- Resistance level = Competence Level (Niv) of resistance competence
- Resistance absorbs DS **equal to its level** (flat absorption, not percentage)
- Example: If you have R[Blessures] Niv 2 and take 7 DS of Blessures, 2 are absorbed, 5 go through
- The resistance competence gains marks equal to the **actual damage taken** (after resistance), not the absorbed amount

**Example:**
- Walk [Pas] vs DC +5, roll -2 = **7 failures**
- **7 marks** on [Pas] (the competence used)
- **7 failures** = 7 Blessures (before resistance)
- R[Blessures] Niv 2 absorbs 2 Blessures → **5 actual Blessures**
- **5 marks** on R[Blessures] (equal to actual damage)

## Implementation

### Files Created

1. **`src/game/character/SouffranceHealthSystem.ts`**
   - Core system class that manages 8 souffrance types
   - Tracks total health state
   - Links suffering to experience marks
   - Calculates resistance and applies damage

2. **`src/components/ui/SouffranceHealthBars.tsx`**
   - React component displaying 8 individual souffrance bars
   - Shows total health state
   - Color-coded bars based on severity
   - Shows séquelle types and health state effects

### Key Methods

#### `SouffranceHealthSystem.applySouffranceFromFailure()`
```typescript
applySouffranceFromFailure(
  souffrance: Souffrance,
  failures: number,  // Number of failures on the competence check
  usedCompetence: Competence
): number  // Returns actual DS applied (after resistance)
```

**What it does:**
1. Each failure = 1 mark on the used competence
2. Each failure = 1 DS of suffering (before resistance)
3. Calculates resistance from resistance competence (absorbs DS equal to resistance level)
4. Applies remaining damage as DS
5. Gains marks on resistance competence equal to **actual damage taken** (after resistance)

**Example:**
```typescript
// Character uses [Pas] (walking) vs DC +5, rolls -2 = 7 failures
// Character has R[Blessures] Niv 2
healthSystem.applySouffranceFromFailure(
  Souffrance.BLESSURES,
  7,  // 7 failures
  Competence.PAS
);
// Result:
// - 7 marks gained on [Pas] (1 per failure)
// - 7 failures = 7 Blessures (before resistance)
// - 2 DS absorbed by R[Blessures] Niv 2
// - 5 DS applied to Blessures (actual damage)
// - 5 marks gained on R[Blessures] (equal to actual damage)
```

#### `SouffranceHealthSystem.applyCriticalFailure()`
```typescript
applyCriticalFailure(
  souffrance: Souffrance,
  failures: number,  // Number of failures (but marks are 5 regardless for critical)
  usedCompetence: Competence
): number  // Returns actual DS applied (after resistance)
```

**What it does:**
- **5 marks** on the used competence (regardless of number of failures) - Page 63: "Lors d'un Échec Critique vous obtiendrez 5 M d'un coup"
- Suffering is still calculated from the number of failures
- Resistance and marks on resistance competence work the same as normal failure

### Health State Calculations

- `getTotalSouffrance()` - Sums all 8 souffrance dice counts
- `getHealthState()` - Returns current HealthState enum
- `getSequeleType(souffrance)` - Returns séquelle type for a specific souffrance
- `getSouffranceLevel(souffrance)` - Returns Niv 0-5 for a souffrance (same as competence level)

## UI Integration

### Usage in Character Sheet

```tsx
import { SouffranceHealthSystem } from '@/game/character/SouffranceHealthSystem';
import SouffranceHealthBars from '@/components/ui/SouffranceHealthBars';

// In your component:
const [healthSystem] = useState(() => 
  new SouffranceHealthSystem(characterSheetManager)
);

// Render:
<SouffranceHealthBars healthSystem={healthSystem} />
```

### What the UI Shows

1. **Total Health Bar** (top)
   - Shows overall health state (0-26 DS, inverted)
   - Color-coded: Green → Yellow → Orange → Red → Dark Red
   - Displays current health state name and effects

2. **8 Individual Souffrance Bars**
   - One bar per souffrance type
   - Shows dice count (0-26+)
   - Color-coded based on severity level
   - Shows attribute abbreviation
   - Shows séquelle type badge (if applicable)
   - Shows level (Niv 0-5)
   - Threshold markers at 3, 10, 15, 21, 26 DS

3. **Health State Effects** (when applicable)
   - Explains current health state effects
   - Shows what rolls are needed to act

## Integration with Gameplay

### When to Call `applySouffranceFromFailure()`

Call this method whenever a character:
1. Uses a competence
2. Fails the action
3. Takes damage/suffering

**Example in combat:**
```typescript
// Character attacks with [Armé] vs DC +3, rolls -1 = 4 failures
const result = rollCombatCheck(competence: Competence.ARME, difficulty: 3);
if (result.success === false) {
  const failures = result.failures; // e.g., 4 failures
  // Determine souffrance type (usually based on context)
  // Physical combat failure → Blessures
  healthSystem.applySouffranceFromFailure(
    Souffrance.BLESSURES,
    failures,  // Number of failures (4 failures = 4 marks on [Armé], 4 DS before resistance)
    Competence.ARME
  );
  // Result: 4 marks on [Armé], actual Blessures after resistance, marks on R[Blessures]
}
```

**Example in social interaction:**
```typescript
// Character negotiates with [Négociation] vs DC +2, rolls 0 = 2 failures
const result = rollSocialCheck(competence: Competence.NEGOCIATION, difficulty: 2);
if (result.success === false) {
  const failures = result.failures; // e.g., 2 failures
  // Social failure → Rancœurs (resentment)
  healthSystem.applySouffranceFromFailure(
    Souffrance.RANCOEURS,
    failures,  // Number of failures (2 failures = 2 marks on [Négociation], 2 DS before resistance)
    Competence.NEGOCIATION
  );
}
```

## TODO: Resistance Competences

The following resistance competences need to be added to `src/game/character/data/CompetenceData.ts`:

- `ROBUSTESSE` - [Robustesse] (for Blessures)
- `SATIETE` - [Satiété] (for Fatigues and Disettes)
- `RECTITUDE` - [Rectitude] (for Entraves, Addictions, Folies, Rancœurs)
- `IMMUNITE` - [Immunité] (for Maladies)

Currently, the system uses placeholder mappings with existing competences to allow compilation. Once these are added, update `SOUFFRANCE_RESISTANCE` in `SouffranceHealthSystem.ts`.

## Design Philosophy

This system embodies the TTRPG's core philosophy:

> **"Suffering is how you learn and grow"**

- Every failure teaches you (1 mark per failure on used competence)
- The more you suffer, the more you learn (actual damage = marks on resistance competence)
- Health is multifaceted (8 different types, not just HP)
- High suffering changes behavior (Rage, Unconscious, etc.)
- Death is meaningful (26+ DS = true consequences)

The health bars provide immediate visual feedback:
- See which type of suffering is most severe
- Understand total health state at a glance
- Know when you're entering dangerous territory (Rage, Unconscious, etc.)

---

**Last Updated:** 2026-01-10

## Corrections (2026-01-10)

Updated XP mark gain system to match TTRPG rules:
- **Each failure** on competence check = **1 mark** on the competence used (not just 1 mark total)
- Suffering = number of failures (typically 1 DS per failure)
- Resistance absorbs DS equal to resistance level (flat, not percentage)
- Marks on resistance competence = **actual damage taken** (after resistance), not absorbed amount


