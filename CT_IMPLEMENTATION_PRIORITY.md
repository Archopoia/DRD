# CT Implementation Priority - Easiest to Hardest

Based on the current implementation and available systems, here are the CTs organized by implementation difficulty.

## ✅ Already Implemented (3 CTs)
1. **PAS** (Pas) - Walking/Running ✅
2. **SAUT** (Saut) - Jumping ✅
3. **POID** (Poid) - Pushing Blocks ✅

---

## 🟢 VERY EASY - Can Implement Immediately (5 CTs)

### 1. **VISION** (Vision) - Looking Around
- **What it does**: Using eyes to observe and track surroundings
- **Implementation**: Mark active whenever mouse/camera is rotating (looking around)
- **Location**: `FPSCamera.ts` - `updateRotation()` method
- **Trigger**: When `mouseState.deltaX !== 0 || mouseState.deltaY !== 0`
- **Reason**: Mouse look is already implemented, just need to mark CT when camera rotates
- **Complexity**: ⭐ Very Easy (1 line of code: check if mouse moved, mark active)

### 2. **ACROBATIE** (Acrobatie) - Air Control / Falling
- **What it does**: Maintaining control and balance while airborne
- **Implementation**: Mark active when character is airborne/falling
- **Location**: `CharacterController.ts` - `update()` method
- **Trigger**: When `!isGrounded` (character is in the air)
- **Reason**: Ground detection already exists, just mark when airborne
- **Complexity**: ⭐ Very Easy (1 line: `if (!this.isGrounded) markActive(ACROBATIE)`)

### 3. **EQUILIBRE** (Équilibre) - Balance
- **What it does**: Maintaining balance, especially on narrow surfaces or while moving
- **Implementation**: Mark active when moving AND not grounded (balancing/precision movement)
- **Location**: `CharacterController.ts` or `FPSCamera.ts`
- **Trigger**: When moving (`direction.length() > 0`) while in a balancing state, OR could be active during all movement (balance is required for movement)
- **Reason**: Simple state check - could mark during all movement as "maintaining balance"
- **Complexity**: ⭐ Very Easy (treat as always active during movement, similar to PAS)

### 4. **FLUIDITE** (Fluidité) - Movement Fluidity
- **What it does**: Smooth, fluid movement
- **Implementation**: Mark active when moving smoothly (when movement direction changes smoothly, no abrupt stops)
- **Location**: `FPSCamera.ts` - `updatePosition()`
- **Trigger**: When `direction.length() > 0` AND movement is continuous (same as PAS, essentially)
- **Reason**: Could be marked same as PAS - represents fluid movement
- **Complexity**: ⭐ Very Easy (mark same as PAS, or treat as movement-related)

### 5. **AUDITION** (Audition) - Listening/Hearing
- **What it does**: Using hearing to detect sounds and audio cues
- **Implementation**: Could mark as active when audio events occur, OR always active (passive sense like vision)
- **Location**: Audio system (to be created) OR always active
- **Trigger**: Option 1: Always active while game is running (passive). Option 2: When sound events occur
- **Reason**: Simple - can treat as passive sense that's always "active" like vision
- **Complexity**: ⭐ Very Easy (always active, or mark on audio events)

---

## 🟡 EASY - Requires Simple Systems (8 CTs)

### 6. **GRIMPE** (Grimpe) - Climbing
- **What it does**: Climbing walls, surfaces, ladders
- **Implementation**: Detect when character is moving upward while touching a wall
- **Location**: `CharacterController.ts` - collision detection
- **Trigger**: When `verticalVelocity > 0` AND colliding with wall AND moving upward
- **Complexity**: ⭐⭐ Easy (needs wall detection logic, but collision system exists)

### 7. **NATATION** (Natation) - Swimming
- **What it does**: Swimming through water
- **Implementation**: Detect when character is in water zone
- **Location**: `CharacterController.ts` or `Scene.ts`
- **Trigger**: When character position is within a water zone (needs water detection)
- **Complexity**: ⭐⭐ Easy (requires water zones/volumes to be defined)

### 8. **ESQUIVE** (Esquive) - Dodging
- **What it does**: Dodging attacks, quick evasive movement
- **Implementation**: Add a dodge key (e.g., Ctrl or Q)
- **Location**: `FPSCamera.ts` - keyboard input handler
- **Trigger**: When dodge key is pressed (similar to jump)
- **Complexity**: ⭐⭐ Easy (just add key binding like jump, could be quick lateral movement)

### 9. **EVASION** (Évasion) - Evading
- **What it does**: Evading threats, getting away
- **Implementation**: Mark when moving backward/retreating from enemies or threats
- **Location**: `FPSCamera.ts` - movement direction check
- **Trigger**: When `moveBackward` is true (retreating movement)
- **Complexity**: ⭐⭐ Easy (simple movement direction check)

### 10. **HABILETE** (Habileté) - Manual Dexterity / Lockpicking
- **What it does**: Fine manipulation, lockpicking, precise hand movements
- **Implementation**: Add interact key (e.g., E) for picking locks/objects
- **Location**: `FPSCamera.ts` - keyboard input
- **Trigger**: When interact key is pressed on a lockable object
- **Complexity**: ⭐⭐ Easy (requires simple interaction system)

### 11. **MINUTIE** (Minutie) - Precision / Fine Gestures
- **What it does**: Precise, careful movements
- **Implementation**: Could be active when using HABILETE (lockpicking), or during slow/precise movement
- **Location**: Same as HABILETE, or when movement speed is slow
- **Trigger**: When interacting with precision tasks, or when crouched/slow moving
- **Complexity**: ⭐⭐ Easy (tied to interaction system)

### 12. **VISEE** (Visée) - Aiming
- **What it does**: Aiming ranged weapons, precision targeting
- **Implementation**: Mark active when aiming (right mouse button, or when weapon is drawn)
- **Location**: `FPSCamera.ts` - mouse button handler
- **Trigger**: When right mouse button is held (aiming down sights)
- **Complexity**: ⭐⭐ Easy (just add right mouse button detection)

### 13. **GESTUELLE** (Gestuelle) - Gestures / Performance
- **What it does**: Using body language, gestures, performance
- **Implementation**: Could be active during certain interactions or animations
- **Location**: Interaction system
- **Trigger**: When performing gestures/emotes (if implemented) or during social interactions
- **Complexity**: ⭐⭐ Easy (requires simple interaction/emote system)

---

## 🟠 MEDIUM - Requires More Systems (15 CTs)

### 14. **ARME** / **DESARME** (Armé / Désarmé) - Armed/Unarmed Combat
- **What it does**: Using weapons in combat
- **Implementation**: Mark when attacking with weapon (left mouse button)
- **Location**: `FPSCamera.ts` - mouse button handler
- **Trigger**: When left mouse button is clicked (swinging weapon)
- **Complexity**: ⭐⭐⭐ Medium (requires combat system, but attack input is simple)

### 15. **IMPROVISE** (Improvisé) - Improvised Weapons
- **What it does**: Using improvised objects as weapons
- **Implementation**: Same as ARME, but when no proper weapon equipped
- **Location**: Combat system
- **Trigger**: When attacking without proper weapon
- **Complexity**: ⭐⭐⭐ Medium (requires weapon inventory check)

### 16. **BANDE** / **PROPULSE** / **JETE** (Bandé / Propulsé / Jeté) - Ranged Weapons
- **What it does**: Using ranged weapons (bows, crossbows, thrown weapons)
- **Implementation**: Mark when firing ranged weapon
- **Location**: Combat system - ranged attack handler
- **Trigger**: When firing bow/crossbow/throwing weapon
- **Complexity**: ⭐⭐⭐ Medium (requires ranged weapon system)

### 17. **LUTTE** / **BOTTES** / **RUSES** (Lutte / Bottes / Ruses) - Melee Combat Variants
- **What it does**: Wrestling, kicks, combat tricks
- **Implementation**: Different combat actions (grab, kick, special moves)
- **Location**: Combat system
- **Trigger**: Different combat moves (grab key, kick key, etc.)
- **Complexity**: ⭐⭐⭐ Medium (requires expanded combat system)

### 18. **DISSIMULATION** (Dissimulation) - Hiding / Stealth
- **What it does**: Hiding, sneaking, remaining undetected
- **Implementation**: Mark when crouching/sneaking
- **Location**: `FPSCamera.ts` - keyboard input
- **Trigger**: When crouch key is pressed (e.g., Ctrl)
- **Complexity**: ⭐⭐⭐ Medium (requires crouch/sneak state)

### 19. **ESCAMOTAGE** (Escamotage) - Pickpocketing / Theft
- **What it does**: Stealing, pickpocketing
- **Implementation**: Mark when pickpocketing/interacting with NPCs
- **Location**: Interaction system
- **Trigger**: When performing pickpocket action on NPC/object
- **Complexity**: ⭐⭐⭐ Medium (requires NPC/interaction system)

### 20. **INVESTIGATION** (Investigation) - Investigating
- **What it does**: Examining objects, searching, investigating
- **Implementation**: Mark when examining objects (interact key + look at object)
- **Location**: Interaction system
- **Trigger**: When interacting with objects while looking at them
- **Complexity**: ⭐⭐⭐ Medium (requires interaction + object detection)

### 21. **ESTIMATION** (Estimation) - Estimating
- **What it does**: Judging distances, sizes, quantities
- **Implementation**: Mark when player "examines" objects (same as investigation but for measurements)
- **Location**: Interaction system
- **Trigger**: When examining objects for size/distance
- **Complexity**: ⭐⭐⭐ Medium (tied to investigation system)

### 22. **TOUCHER** (Toucher) - Touch / Tactile Sense
- **What it does**: Using touch to examine objects
- **Implementation**: Mark when interacting with objects (physical contact)
- **Location**: Interaction system
- **Trigger**: When picking up/touching objects
- **Complexity**: ⭐⭐⭐ Medium (requires object interaction)

---

## 🔴 HARD - Requires Complex Systems (Remaining ~50 CTs)

These require significant gameplay systems that don't exist yet:
- **Social CTs** (SEDUCTION, NEGOCIATION, etc.) - Need dialogue/NPC system
- **Knowledge CTs** (SOCIETE, GEOGRAPHIE, etc.) - Need knowledge/experience system  
- **Crafting CTs** (ARTISANAT, BRICOLAGE, etc.) - Need crafting system
- **Animal CTs** (APPRIVOISEMENT, DRESSAGE, etc.) - Need animal system
- **Specialized CTs** (VOL, FOUISSAGE, etc.) - Need specialized movement systems

---

## Recommended Next Steps (Easiest First)

### Phase 1: Very Easy (5 CTs)
1. **VISION** - Mouse/camera movement (⭐ Very Easy)
2. **ACROBATIE** - Airborne state (⭐ Very Easy)
3. **EQUILIBRE** - Balance during movement (⭐ Very Easy)
4. **FLUIDITE** - Movement fluidity (⭐ Very Easy) - Note: Could be same as PAS, might skip
5. **AUDITION** - Hearing (⭐ Very Easy - always active or on audio events)

### Phase 2: Easy (8 CTs)
6. **ESQUIVE** - Dodge key (add Ctrl/Q key) (⭐⭐ Easy)
7. **EVASION** - Retreating/moving backward (⭐⭐ Easy)
8. **VISEE** - Right mouse button (aiming) (⭐⭐ Easy)
9. **GRIMPE** - Climbing detection (⭐⭐ Easy - needs wall collision check)
10. **NATATION** - Swimming (⭐⭐ Easy - needs water zones)
11. **HABILETE** - Interact key for lockpicking (⭐⭐ Easy)
12. **MINUTIE** - Precision tasks (⭐⭐ Easy - tied to HABILETE)

### Phase 3: Medium (Combat)
13. **ARME/DESARME** - Left mouse button attack (⭐⭐⭐ Medium - combat system needed)
14. **IMPROVISE** - Unarmed/improvised attacks (⭐⭐⭐ Medium)

---

## Summary: Top 5 Easiest CTs to Implement Next

1. **VISION** - Just mark when mouse moves (camera rotation)
2. **ACROBATIE** - Mark when `!isGrounded` (airborne)
3. **EQUILIBRE** - Mark during movement (or same as PAS)
4. **ESQUIVE** - Add dodge key (Ctrl/Q) - one key binding
5. **VISEE** - Add right mouse button (aiming) - one mouse button

All of these can be implemented with minimal changes and no new gameplay systems!

