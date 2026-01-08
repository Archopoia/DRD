# Implementation Status Report

**Date:** 2026-01-08  
**Comparison:** PROJECT_OVERVIEW.md / README.md vs Actual Implementation

---

## ✅ **Actually Completed (Beyond Documentation)**

### 1. **Physics Integration (Rapier)** - ✅ **FULLY IMPLEMENTED**
**Status:** ✅ Complete (docs say "In Progress")

**Files:**
- `src/game/physics/PhysicsWorld.ts` - Complete Rapier world with static/dynamic/kinematic body support
- `src/game/physics/CharacterController.ts` - Full character controller with:
  - Capsule collision detection
  - Ground detection
  - Jump mechanics
  - Block pushing/interaction
  - Sliding collision handling
  - Vertical/horizontal movement separation

**What's Working:**
- Rapier physics engine fully integrated (`@dimforge/rapier3d@0.19.3`)
- Physics world with fixed timestep simulation
- Character controller with proper collision detection
- Movement system with collision response
- Jump mechanics
- Block pushing mechanics

**What's Missing:**
- Connection to character stats (still uses hardcoded `GAME_CONFIG.MOVE_SPEED`)
- Environmental condition effects on movement

---

### 2. **Core Game Engine** - ✅ **COMPLETE**
**Status:** ✅ Matches documentation

- Three.js renderer with retro shaders
- First-person camera with mouse look
- WASD movement with run modifier
- Game loop with FPS tracking
- Debug utilities
- Window resize handling

---

### 3. **Character Sheet System** - ✅ **COMPLETE**
**Status:** ✅ Matches documentation

- All data definitions (Attributes, Aptitudes, Actions, Competences, Souffrances)
- CharacterSheetManager with full state management
- React UI component with:
  - 8-attribute input grid
  - 8-aptitude columns (calculated from attributes)
  - Expandable Actions and Competences
  - Souffrance tracking
  - Free marks display
  - Competence revelation system
  - Competence realization (when 10 marks reached)
  - Mastery system (unlock/upgrade/remove)
  - Mastery points (MT) tracking

---

### 4. **Basic 3D Scene** - ✅ **COMPLETE**
**Status:** ✅ Basic implementation (docs say "test geometry only")

- `src/game/world/Scene.ts` - Scene setup with physics integration
- Test geometry for environment

---

## ❌ **Documented as Complete but Actually Missing**

**None!** Everything documented as complete is actually implemented.

---

## 🚧 **In Progress / Planned (Accurate)**

### 1. **Stat-to-Gameplay Modifier System** - ❌ **NOT IMPLEMENTED**
**Status:** ❌ Critical Missing Piece

**What's Needed:**
- Create `CharacterStats` class similar to Godot template (`character_stats.gd`)
- Bridge between `CharacterSheetManager` and gameplay systems
- Translation layer from Attributes/Aptitudes/Competences → gameplay modifiers
- Integration with CharacterController, future combat system, etc.

**Reference Files (Godot Template):**
- `Godot RPG Template/scripts/character_stats.gd` - Runtime stats structure
- `Godot RPG Template/scripts/stat_layer_roles.gd` - Action → Stat mapping
- `Godot RPG Template/scripts/stat_math_mapping.gd` - Attribute/Action/Competence → Stat formulas

**This is the #1 priority** - Without this, character stats have no effect on gameplay.

---

### 2. **Environmental Conditions System** - ❌ **NOT IMPLEMENTED**
**Status:** ❌ Not started

**What's Needed:**
- 8 environmental condition axes:
  - **FLU (Flow)**: Embourbement (Mud) ↔ Emportement (Currents)
  - **MOI (Moisture)**: Humidité (Humidity) ↔ Aridité (Aridity)
  - **TER (Terrain)**: Glissements (Slippery) ↔ Escarpements (Steep)
  - **TEM (Temperature)**: Froids (Cold) ↔ Chaleurs (Heat)
  - **RES (Respiration)**: Étouffement (Suffocation) ↔ Soufflement (Wind)
  - **RAD (Radiation)**: Irriliation (Disorientation) ↔ Irradiation (Radiation)
  - **LUM (Luminance)**: Obscurité (Darkness) ↔ Luminosité (Brightness)
  - **PRE (Pressure)**: Apesanteur (Zero G) ↔ Écrasement (Crushing)

**Files to Create:**
- `src/game/environmental/EnvironmentalConditions.ts` - Condition tracking
- `src/game/environmental/EnvironmentalEffects.ts` - Effects on gameplay
- Integration with character stats and movement system

**Reference:**
- `Des Récits Discordants 2025/book_extracted/page_092.md` - Environmental condition rules

---

### 3. **Enhanced Movement System** - 🟡 **PARTIALLY IMPLEMENTED**
**Status:** 🟡 Basic physics working, but not stat-driven

**What's Working:**
- Basic WASD movement
- Physics-based collision
- Jump mechanics
- Block pushing

**What's Missing:**
- Stat-driven movement speed (should read from CharacterStats)
- Stat-driven jump height (should read from CharacterStats)
- Stamina system
- Environmental condition effects on movement
- Different movement types (walk/run/sprint/crouch) affected by stats

---

### 4. **Combat System** - ❌ **NOT IMPLEMENTED**
**Status:** ❌ Not started

**What's Needed:**
- Action-based combat mechanics
- Stat-driven modifiers (weapon sway, attack speed, damage, accuracy)
- Integration with environmental conditions
- Weapon/equipment system

---

### 5. **Tool/Equipment System** - ❌ **NOT IMPLEMENTED**
**Status:** ❌ Not started

**What's Needed:**
- Tools that resist environmental conditions
- Equipment that affects character stats
- Maintenance/wear system
- Inventory management

---

### 6. **Character System Enhancements** - 🟡 **PARTIALLY COMPLETE**
**Status:** 🟡 Core system done, enhancements missing

**What's Complete:**
- Character sheet with all stats
- Mastery system
- Experience/marks system

**What's Missing:**
- Full character creation flow
- Découvertes (Discoveries) system
- Complete progression tracking UI

---

## 🎯 **Next Steps (Prioritized)**

### **Priority 1: Stat-to-Gameplay Modifier System** (CRITICAL)

This is the foundation for all gameplay. Without it, character stats don't affect gameplay at all.

**Tasks:**
1. Create `src/game/character/CharacterStats.ts` - Runtime stats structure
   - Copy structure from Godot template's `character_stats.gd`
   - Define all gameplay-relevant stats (movement, combat, stealth, etc.)

2. Create `src/game/character/StatCalculator.ts` - Calculation engine
   - Port formulas from Godot template's `stat_math_mapping.gd`
   - Map Attributes → CharacterStats
   - Map Actions → CharacterStats
   - Map Competences → CharacterStats (using hook tags system)

3. Integrate with CharacterController
   - Read movement speed from CharacterStats instead of GAME_CONFIG
   - Read jump height from CharacterStats
   - Add stamina system

4. Create bridge between CharacterSheetManager and CharacterStats
   - Update CharacterStats whenever character sheet changes
   - Provide CharacterStats instance to all gameplay systems

**Files to Create:**
- `src/game/character/CharacterStats.ts`
- `src/game/character/StatCalculator.ts`
- `src/game/character/StatBridge.ts` (connects CharacterSheetManager → CharacterStats)

**Reference:**
- `Godot RPG Template/scripts/character_stats.gd`
- `Godot RPG Template/scripts/stat_math_mapping.gd`
- `Godot RPG Template/scripts/stat_layer_roles.gd`

---

### **Priority 2: Enhanced Movement System** (HIGH)

Make movement respond to character stats and environmental conditions.

**Tasks:**
1. Integrate CharacterStats into CharacterController
   - Replace hardcoded speeds with stat-driven values
   - Add walk/run/sprint/crouch modes
   - Add stamina consumption

2. Create basic environmental conditions system (simplified)
   - Start with just 2-3 conditions (e.g., TER for terrain, TEM for temperature)
   - Apply effects to movement speed/stamina

---

### **Priority 3: Environmental Conditions System** (MEDIUM)

Full implementation of 8 environmental condition axes.

**Tasks:**
1. Create EnvironmentalConditions class
2. Create EnvironmentalEffects class
3. Integrate with movement system
4. Create UI indicators for active conditions

---

### **Priority 4: Combat System** (MEDIUM)

Action-based combat with stat-driven modifiers.

**Tasks:**
1. Design combat mechanics
2. Create combat system using CharacterStats
3. Add weapon/equipment support
4. Integrate environmental conditions

---

## 📊 **Summary**

### **Completion Status:**
- ✅ **Core Systems:** 100% Complete (better than documented!)
- ✅ **Character Sheet:** 100% Complete
- ✅ **Physics:** 100% Complete (was listed as "in progress")
- ❌ **Stat-to-Gameplay Bridge:** 0% Complete (CRITICAL MISSING PIECE)
- 🟡 **Movement System:** 60% Complete (basic physics done, needs stats)
- ❌ **Environmental Conditions:** 0% Complete
- ❌ **Combat System:** 0% Complete
- ❌ **Tool/Equipment System:** 0% Complete

### **Overall Progress:**
**~40% Complete** - Core engine and character sheet are solid, but gameplay systems need the stat-to-gameplay bridge to function.

---

## 🔍 **Key Insight**

**The biggest gap is the Stat-to-Gameplay Modifier System.** 

Currently:
- ✅ Character sheet exists and works perfectly
- ✅ Physics system exists and works perfectly
- ❌ But character stats have **zero effect** on gameplay

The character sheet is completely disconnected from actual gameplay. This is the critical missing piece that needs to be implemented first before any other gameplay features will make sense.

---

## 📝 **Files That Need to Be Created**

1. `src/game/character/CharacterStats.ts` - Runtime gameplay stats
2. `src/game/character/StatCalculator.ts` - Calculate stats from character sheet
3. `src/game/character/StatBridge.ts` - Bridge CharacterSheetManager → CharacterStats
4. `src/game/environmental/EnvironmentalConditions.ts` - Environmental condition tracking
5. `src/game/environmental/EnvironmentalEffects.ts` - Effects on gameplay
6. `src/game/combat/CombatSystem.ts` - Combat mechanics (future)
7. `src/game/equipment/EquipmentSystem.ts` - Equipment/tools (future)

---

**Last Updated:** 2026-01-08
