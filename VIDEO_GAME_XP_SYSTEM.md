# Video Game XP System - Multi-Competence Distribution

## Overview

The video game adaptation implements a **multi-competence XP distribution system** where all competences used within their XP timeframes receive XP when you fail.

## How It Works

### Active Competences Tracking

**CTs (Competences) are marked as "active" WHEN THEY ARE BEING USED IN GAMEPLAY**, not just on failure. This includes:
- **Swinging a weapon** → marks [Armé] or [Désarmé] as active
- **Running/walking** → marks [Pas] as active
- **Jumping** → marks [Saut] as active
- **Drawing a weapon** → marks relevant competence as active
- **Talking** → marks [Négociation], [Séduction], etc. as active
- **Tracking** → marks [Vision], [Investigation], etc. as active
- **Any gameplay action** → marks the relevant competence(s) as active

**XP Timeframe Mechanism:**
- **Each CT has its own independent 2-second XP timeframe** (default: 2000ms)
- When a CT is used (marked active), it can gain XP for 2 seconds
- **If the CT is used again within that 2 seconds, the timer RESETS** (extends to another 2 seconds from that point)
- Multiple CTs can be active simultaneously, each with their own independent XP timeframe

**Example:**
- Jumping uses [Saut] → becomes active for 2s (can gain XP)
- After 1s, you jump again → [Saut]'s XP timeframe resets to another 2s from that point (now has 2s remaining)
- Running while swinging weapon → [Pas] and [Armé] both become active, each with their own independent 2s XP timeframe

When you fail an action, XP is distributed among **all competences that are currently within their XP timeframes**.

### XP Distribution Rules

**Per Failure:**
- **Maximum 3 marks per failure** distributed among active competences
- **1 CT active**: 3 marks to that CT
- **2 CTs active**: 1.5 marks each (3 marks total)
- **3 CTs active**: 1 mark each (3 marks total)
- **More than 3 CTs active**: Prioritize those with **lowest degree count** (up to 3 CTs receive XP)

**Example:**
- Fighting while running ([Pas]), jumping ([Saut]), and attacking ([Armé])
- 7 failures occur
- All 3 competences are active → Each receives 7 marks (1 mark × 7 failures each)
- Total: 21 marks distributed (7 × 3 CTs)

### Critical Failure

**Critical failures** give **5 marks per failure** (instead of 3), distributed the same way:
- **1 CT**: 5 marks per failure
- **2 CTs**: 2.5 marks each per failure
- **3 CTs**: ~1.67 marks each per failure

## Implementation

### Files

1. **`src/game/character/ActiveCompetencesTracker.ts`**
   - Tracks competences that are currently within their XP timeframes
   - Each CT has its own independent XP timeframe (default: 2 seconds)
   - When a CT is used, its XP timeframe resets (can gain XP for another 2 seconds)
   - Automatically cleans up competences whose XP timeframes have expired

2. **`src/game/character/CharacterSheetManager.ts`**
   - `addPartialMarks()`: Adds fractional marks (0.0-0.99), converts to full marks when >= 1.0
   - `distributeMarksToActiveCompetences()`: Distributes 3 marks per failure among active competences

3. **`src/game/character/SouffranceHealthSystem.ts`**
   - Updated to use `ActiveCompetencesTracker` for XP distribution
   - Automatically marks the used competence as active when applying suffering

### Integration in Gameplay

**IMPORTANT**: CTs should be marked as active **WHEN THEY ARE USED IN GAMEPLAY**, not just when failures occur. The structure is ready for this, but the actual marking during gameplay actions is not yet implemented.

**To mark competences as active during gameplay actions:**

```typescript
// Get the active competences tracker from health system
const activeTracker = healthSystem.getActiveCompetencesTracker();

// Mark competences as active WHEN THEY ARE BEING USED:
activeTracker.markActive(Competence.PAS, currentTime);      // When walking/running
activeTracker.markActive(Competence.SAUT, currentTime);     // When jumping
activeTracker.markActive(Competence.ARME, currentTime);     // When swinging/attacking
activeTracker.markActive(Competence.DESARME, currentTime);  // When drawing weapon
activeTracker.markActive(Competence.NEGOCIATION, currentTime); // When talking/negotiating

// Or mark multiple at once (e.g., running while swinging weapon)
activeTracker.markActiveMultiple([Competence.PAS, Competence.ARME], currentTime);
```

**Future Integration Points (To Be Implemented):**

1. **Character Movement (CharacterController)**
   - When walking/running: `markActive(Competence.PAS)`
   - When jumping: `markActive(Competence.SAUT)`
   - When climbing: `markActive(Competence.GRIMPE)`

2. **Combat System**
   - When swinging weapon: `markActive(Competence.ARME)` or `markActive(Competence.DESARME)`
   - When drawing weapon: `markActive(Competence.DESARME)`
   - When dodging: `markActive(Competence.ESQUIVE)`

3. **Social/Interaction Systems**
   - When talking: `markActive(Competence.NEGOCIATION)` or `markActive(Competence.SEDUCTION)`

4. **Exploration/Investigation Systems**
   - When tracking: `markActive(Competence.VISION)` or `markActive(Competence.INVESTIGATION)`

**The structure is ready** - when you implement actual CT usage affecting gameplay variables (e.g., weapon swing uses [Armé] degrees, movement uses [Pas] degrees), simply call `markActive()` on the relevant competences during those actions.

**The system automatically:**
- Tracks competences within their individual XP timeframes (each CT has its own independent 2-second timeframe)
- Resets a CT's XP timeframe when it's used again (extends to another 2 seconds from that point)
- Distributes XP when `applySouffranceFromFailure()` is called among all CTs within their XP timeframes
- Prioritizes competences with lowest degree count if more than 3 are active
- Converts fractional marks to full marks automatically
- **Shows all active CTs in the event log** when XP is distributed (even if none are active yet)

**Event Log Display:**
- Shows "Active CTs: [list of all active competences]" in XP gain events
- If more than 3 CTs active, shows which ones were selected (prioritized by lowest degree)
- Example: "Active CTs: [Pas], [Armé], [Saut]. Gained 21 marks distributed - 7 marks per CT"

## Design Rationale

**Why 3 marks per failure instead of 1?**
- Video games benefit from more granular feedback
- Multiple competences used simultaneously (combat + movement + jumping) should all gain XP
- Creates more dynamic character progression

**Why up to 3 competences?**
- Balances the system - too many competences receiving XP would be overpowered
- 3 competences represents typical simultaneous actions (e.g., running + jumping + attacking)

**Why prioritize by lowest degree count?**
- Rewards players for using less-developed competences
- Encourages diversification of character builds

---

**Last Updated:** 2026-01-10

