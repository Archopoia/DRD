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

**Core Rule**: When you use a competence and **fail**, you:
1. **Suffer** (gain DS in one of the 8 types)
2. **Gain 1 mark** on the competence you were using
3. If you **resist** (via resistance competence), you gain marks on the resistance competence too

### Resistance System

Each Souffrance has a **Resistance Competence**:

**Resistance Calculation:**
- Resistance level = Competence Level (Niv) of resistance competence
- Each level of resistance absorbs 1 DS passively
- Example: If you have [Robustesse] Niv 2 and take 5 DS of Blessures, 2 are absorbed, 3 go through
- The resistance competence gains marks equal to the amount absorbed

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
  diceAmount: number,
  usedCompetence: Competence
): number
```

**What it does:**
1. Calculates resistance from resistance competence
2. Absorbs damage equal to resistance level
3. Applies remaining damage as DS
4. Gains 1 mark on the used competence (for the failure)
5. Gains marks on resistance competence (equal to absorbed amount)

**Example:**
```typescript
// Character uses [Armé] and fails, takes 5 DS of Blessures
// Character has [Robustesse] Niv 2
healthSystem.applySouffranceFromFailure(
  Souffrance.BLESSURES,
  5,
  Competence.ARME
);
// Result:
// - 2 DS absorbed by resistance (Robustesse Niv 2)
// - 3 DS applied to Blessures
// - 1 mark gained on [Armé] (for the failure)
// - 2 marks gained on [Robustesse] (for absorbing 2 DS)
```

#### `SouffranceHealthSystem.applyCriticalFailure()`
```typescript
applyCriticalFailure(
  souffrance: Souffrance,
  diceAmount: number,
  usedCompetence: Competence
): number
```

**What it does:**
- Same as normal failure, but gains **5 marks** instead of 1 on the used competence

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
// Character attacks with [Armé]
const result = rollCombatCheck(competence: Competence.ARME, difficulty: 3);
if (result.success === false) {
  // Determine souffrance type (usually based on context)
  // Physical combat failure → Blessures
  const damageDice = calculateFailureDamage(result);
  healthSystem.applySouffranceFromFailure(
    Souffrance.BLESSURES,
    damageDice,
    Competence.ARME
  );
}
```

**Example in social interaction:**
```typescript
// Character negotiates with [Négociation]
const result = rollSocialCheck(competence: Competence.NEGOCIATION, difficulty: 2);
if (result.success === false) {
  // Social failure → Rancœurs (resentment)
  healthSystem.applySouffranceFromFailure(
    Souffrance.RANCOEURS,
    2, // Moderate failure = 2 DS
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

- Every failure teaches you (marks on used competence)
- Resistance makes you stronger (marks on resistance competence)
- Health is multifaceted (8 different types, not just HP)
- High suffering changes behavior (Rage, Unconscious, etc.)
- Death is meaningful (26+ DS = true consequences)

The health bars provide immediate visual feedback:
- See which type of suffering is most severe
- Understand total health state at a glance
- Know when you're entering dangerous territory (Rage, Unconscious, etc.)

---

**Last Updated:** 2026-01-08

