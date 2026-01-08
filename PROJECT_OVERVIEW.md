# Project Overview: Des Récits Discordants - Digital Implementation

## Executive Summary

This project is a **browser-based action-RPG** (inspired by Daggerfall/Morrowind/Oblivion) that adapts the "Des Récits Discordants" (DRD) tabletop RPG system into direct gameplay mechanics. It combines:
- **Three.js** for 3D rendering (Daggerfall-inspired retro aesthetic)
- **Next.js** with TypeScript for the web framework
- **React** for UI components
- A complete character sheet system ported from a **Godot template**

**Key Design Philosophy**: This is an **immersive sim** (like Deus Ex, System Shock, Prey) combined with action-RPG mechanics. This is NOT a TTRPG simulator with dice rolling. Instead:

- **Character stats** (attributes, aptitudes, competences) are translated into **direct gameplay modifiers** that affect real-time gameplay variables
- **Environmental conditions** (pressure, wind, radiation, temperature, etc.) create dynamic, systemic gameplay challenges
- Each gameplay aspect (combat, social, stealth, exploration, etc.) becomes an immersive "minigame" integrated seamlessly into the action-RPG experience
- **Physics-based interactions** using Rapier physics engine for realistic environmental responses
- **Systemic design** where tools, equipment, and player actions interact with environmental conditions in meaningful ways

The game is being built iteratively using **Cursor.ai/ChatGPT** to translate the complex TTRPG stat system into action-RPG gameplay mechanics.

---

## Project Structure

### Technology Stack

```
Frontend Framework: Next.js 14+ (App Router)
Language: TypeScript (strict type safety)
3D Rendering: Three.js with custom retro shaders
Styling: Tailwind CSS
Build System: Next.js dev server
```

### Directory Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Main game page
│   ├── layout.tsx         # Root layout
│   └── globals.css         # Global styles
├── components/             # React components
│   ├── GameCanvas.tsx     # Three.js game wrapper
│   └── CharacterSheet.tsx # Character sheet UI
├── game/                   # Core game logic
│   ├── core/              # Game engine
│   │   ├── Game.ts        # Main game orchestrator
│   │   └── GameLoop.ts    # Game loop management
│   ├── renderer/          # 3D rendering
│   │   ├── RetroRenderer.ts
│   │   └── RetroShader.ts
│   ├── camera/            # First-person camera
│   │   └── FPSCamera.ts
│   ├── world/             # Scene setup
│   │   └── Scene.ts
│   ├── character/         # Character system
│   │   ├── CharacterSheetManager.ts
│   │   └── data/          # All TTRPG data definitions
│   │       ├── AttributeData.ts    # 8 Attributes
│   │       ├── AptitudeData.ts     # 8 Aptitudes
│   │       ├── ActionData.ts       # 24 Actions
│   │       ├── CompetenceData.ts   # 72 Competences
│   │       ├── SouffranceData.ts   # 8 Souffrances
│   │       └── MasteryRegistry.ts  # Masteries/Spécialités
│   └── utils/             # Utilities
│       ├── debug.ts       # Debug logging system
│       └── types.ts       # TypeScript types
└── lib/                   # Constants
    └── constants.ts       # Game configuration
```

---

## Development Approach: Using Cursor.ai/ChatGPT

### Strategy

The project uses an **iterative, component-based approach** where:

1. **Small, Focused Tasks**: Each feature is broken into manageable pieces
2. **Type Safety First**: All data structures are strongly typed with TypeScript
3. **Data-Driven Design**: The TTRPG rules are encoded as data structures first
4. **Progressive Enhancement**: Start with core systems, add features incrementally

### Best Practices Applied

1. **Clear File Structure**: Each system has its own directory and clear responsibilities
2. **Separation of Concerns**: 
   - Data definitions (`data/` folder)
   - Business logic (`CharacterSheetManager.ts`)
   - UI components (`components/`)
   - Game engine (`core/`)
3. **Type Safety**: Enums and interfaces for all game entities
4. **Debug Utilities**: Centralized logging system for development
5. **Documentation**: Inline comments explaining TTRPG rule translations

### Example: How a Feature Gets Built

1. **Read TTRPG Rules**: Understand the mechanic from `systeme_drd/` files
2. **Define Data Structures**: Create TypeScript enums/interfaces
3. **Implement Logic**: Build the manager/calculator classes
4. **Create UI**: Build React components that use the logic
5. **Test & Iterate**: Use debug tools to verify correctness

---

## The Original TTRPG System: "Des Récits Discordants"

### Core Concepts

**Des Récits Discordants** is a French tabletop RPG with these key features:

#### 1. **Dice System (dD - Dés Discordants)**
- 3-sided dice: `+`, `-`, `0`
- Result = number of `+` minus number of `-`
- Used for all skill checks

#### 2. **Character Structure**
```
8 Attributes (ATB) → 8 Aptitudes (APT) → 24 Actions → 72 Competences (CT)
```

**Hierarchy:**
- **Attributes** (8): FOR, AGI, DEX, VIG, EMP, PER, CRE, VOL
- **Aptitudes** (8): Calculated from 3 Attributes with weights (+3, +2, +1)
- **Actions** (24): 3 per Aptitude
- **Competences** (72): 3 per Action
- **Masteries** (Spécialités): Specializations within Competences

#### 3. **Experience System**
- **Marks**: Gained from failures (1 mark per failure, 5 for critical failure)
- **Éprouver**: 10 marks (minus eternal marks) = can "Realize" a competence
- **Réalisation**: +1 dice to competence, gain free marks, +1 to attribute
- **Distinction**: +10 to an attribute = special abilities

#### 4. **Souffrances (Sufferings)**
- 8 types tied to each Attribute
- Dice count determines severity (1-2 = light, 21+ = death)
- Applied as negative dice to related checks
- Can be healed through rest, treatment, or food

#### 5. **Key Documents**
- `01_Systeme_General.md`: Core mechanics
- `02_Creation_Personnage.md`: Character creation
- `03_Attributs_Aptitudes_Competences.md`: Full skill tree
- `04_Experience_Progression.md`: Progression system
- `05_Souffrances_Guérison.md`: Health/injury system
- Plus extensive lore and world-building documents

---

## The Godot Template

### What Was Extracted

The **Godot RPG Template** (`Godot RPG Template/`) contains a complete character sheet implementation in GDScript. Key files:

#### Structure
```
scenes/
├── character_sheet.tscn          # Main UI scene
├── sections/
│   └── aptitudes_section.tscn    # Aptitudes layout
└── components/
    ├── aptitude_column.tscn      # One column per aptitude
    ├── action_node.tscn          # Action containers
    ├── competence_node.tscn      # Competence UI
    └── souffrance_node.tscn      # Souffrance display

scripts/
├── character_sheet.gd            # Main controller
├── aptitude_column.gd            # Aptitude logic
├── competence_node.gd            # Competence management
├── attribute_calculator.gd       # Attribute → Aptitude math
└── character_stats.gd           # Runtime stats bridge

resources/
├── attribute_data.gd             # Attribute definitions
├── aptitude_data.gd              # Aptitude definitions
├── action_data.gd                # Action definitions
├── competence_data.gd             # Competence definitions
└── souffrance_data.gd            # Souffrance definitions
```

### Porting Strategy

The Godot implementation was used as a **reference** for:
1. **UI Layout**: 8-column grid for aptitudes
2. **Data Structure**: How attributes/aptitudes/actions/competences relate
3. **Calculations**: Attribute → Aptitude formulas
4. **User Flow**: How players interact with the sheet

**Key Differences:**
- **Godot**: GDScript, scene-based, node tree
- **This Project**: TypeScript, React components, functional approach
- **Same Logic**: The mathematical relationships are identical

---

## Current Implementation Status

### ✅ Completed

1. **Core Game Engine**
   - Three.js renderer with retro shaders
   - First-person camera with mouse look
   - WASD movement with run modifier
   - Game loop with FPS tracking
   - Debug utilities

2. **Character Sheet System**
   - All data definitions (Attributes, Aptitudes, Actions, Competences, Souffrances)
   - CharacterSheetManager with state management
   - React UI component with:
     - 8-attribute input grid
     - 8-aptitude columns (calculated from attributes)
     - Expandable Actions and Competences
     - Souffrance tracking
     - Free marks display
   - Competence revelation system
   - Competence realization (when 10 marks reached)

3. **Data Structures**
   - Complete enum definitions for all game entities
   - Type-safe mappings between entities
   - Helper functions for names/abbreviations

### 🚧 In Progress / Planned

1. **Game World & Environmental Systems**
   - Basic 3D scene (test geometry only)
   - **Physics integration (Rapier)** - Required for environmental interactions
   - **Environmental Conditions System** - 8 condition axes (FLU, MOI, TER, TEM, RES, RAD, LUM, PRE)
   - **Tool/Equipment System** - Tools that resist environmental conditions
   - **Habituation System** - Character adaptation to environmental conditions over time
   - Procedural dungeon generation

2. **Character System**
   - Full character creation flow
   - Masteries/Spécialités system
   - Découvertes (Discoveries) system
   - Complete progression tracking

3. **Gameplay Systems** (Immersive Sim + Action-RPG Mechanics)
   - **Stat-to-Gameplay Modifier System** - Translate character stats into gameplay variables
   - **Environmental Conditions System** - 8 axes affecting gameplay:
     - **FLU (Flow)**: Mud/bog vs being carried by currents
     - **MOI (Moisture)**: Humidity vs aridity
     - **TER (Terrain)**: Slippery surfaces vs steep cliffs
     - **TEM (Temperature)**: Cold vs heat
     - **RES (Respiration)**: Suffocation vs strong winds
     - **RAD (Radiation)**: Disorientation vs irradiation
     - **LUM (Luminance)**: Darkness vs brightness
     - **PRE (Pressure)**: Zero gravity vs crushing pressure
   - **Combat system** - Action-based with stat-driven modifiers (weapon sway, attack speed, damage)
   - **Movement system** - Stat-driven movement speed, jump height, stamina, affected by environmental conditions
   - **Social system** - Dialogue and persuasion with stat-driven success windows
   - **Stealth system** - Visibility, detection, and hiding mechanics (affected by LUM conditions)
   - **Exploration system** - Discovery, investigation, and knowledge mechanics
   - **Tool/Equipment System** - Tools that resist environmental conditions, require maintenance
   - **Souffrance application** - Injuries affect gameplay variables (movement, accuracy, etc.), can be caused by environmental failures

4. **UI/UX**
   - Inventory system
   - Dialogue system
   - Save/load system
   - Settings menu

---

## Key Implementation Details

### Attribute → Aptitude Calculation

From `CharacterSheetManager.ts`:
```typescript
// Each Aptitude uses 3 Attributes with weights:
// ATB1 (weight +3): 6/10 of value
// ATB2 (weight +2): 3/10 of value  
// ATB3 (weight +1): 1/10 of value

const atb3Contribution = Math.floor(atb1Value * 6 / 10);
const atb2Contribution = Math.floor(atb2Value * 3 / 10);
const atb1Contribution = Math.floor(atb3Value * 1 / 10);

aptitudeLevel = atb3Contribution + atb2Contribution + atb1Contribution;
```

### Competence Level Calculation

From `CharacterSheetManager.ts`:
```typescript
// Competence level based on dice count:
// 0 dice = Niv 0
// 1-2 dice = Niv 1
// 3-5 dice = Niv 2
// 6-9 dice = Niv 3
// 10-14 dice = Niv 4
// 15+ dice = Niv 5
```

### Experience System

- **Marks**: Tracked per competence (10 marks array)
- **Eternal Marks**: Never cleared, reduce mark requirement
- **Realization**: When 10 marks (minus eternal) are reached:
  - +1 dice to competence
  - Clear non-eternal marks
  - Gain free marks = current level
  - +1 to linked attribute

---

## File-by-File Breakdown

### Core Game Files

**`src/game/core/Game.ts`**
- Main game orchestrator
- Initializes renderer, camera, scene
- Manages game loop
- Handles window resize

**`src/game/core/GameLoop.ts`**
- RequestAnimationFrame-based loop
- Delta time calculation
- Update/render separation

**`src/game/renderer/RetroRenderer.ts`**
- Three.js WebGLRenderer setup
- Custom retro shader application
- Color quantization and dithering

**`src/game/camera/FPSCamera.ts`**
- First-person camera controls
- Mouse look with pointer lock
- WASD movement with run modifier

### Character System Files

**`src/game/character/CharacterSheetManager.ts`**
- Central state management
- Attribute setting and validation
- Aptitude recalculation
- Competence revelation/realization
- Souffrance management
- Free marks tracking

**`src/game/character/data/*.ts`**
- Pure data definitions
- Enums for all game entities
- Mappings between entities
- Helper functions for names/abbreviations

### UI Files

**`src/components/GameCanvas.tsx`**
- React wrapper for Three.js canvas
- Game initialization and cleanup
- FPS display
- Character sheet toggle (C key)

**`src/components/CharacterSheet.tsx`**
- Full character sheet UI
- 8-attribute input grid
- 8-aptitude columns with expandable actions/competences
- Souffrance display
- Free marks counter

---

## Development Workflow

### Typical Development Cycle

1. **Read TTRPG Rules**: Understand mechanic from `systeme_drd/`
2. **Design Data Structure**: Create TypeScript interfaces/enums
3. **Implement Logic**: Add methods to managers/calculators
4. **Build UI**: Create React components
5. **Test**: Use debug tools and manual testing
6. **Iterate**: Refine based on testing

### Using Cursor.ai/ChatGPT Effectively

**Good Prompts:**
- "Implement the [feature] from the TTRPG rules in `systeme_drd/XX_File.md`"
- "Add [calculation] to CharacterSheetManager following the pattern in [existing method]"
- "Create a React component for [UI element] that uses [data structure]"

**Best Practices:**
- Reference specific files and line numbers
- Show examples of similar code
- Break complex features into smaller tasks
- Ask for type-safe implementations
- Request debug logging

---

## Next Steps

### Immediate Priorities

1. **Physics Integration (Rapier)**: Add Rapier physics engine for movement, collision, environmental interactions, and combat
2. **Stat-to-Gameplay Modifier System**: Create a system that translates character stats (attributes, aptitudes, competences) into gameplay variables (movement speed, weapon sway, etc.)
3. **Environmental Conditions System**: Implement the 8 environmental condition axes that dynamically affect gameplay:
   - Conditions affect movement, visibility, stamina drain, etc.
   - Tools/equipment provide resistance to conditions
   - Habituation system for long-term adaptation
4. **Enhanced Movement System**: Implement stat-driven movement (speed, jump, stamina) that responds to character stats AND environmental conditions
5. **Combat System**: Action-based combat with stat-driven modifiers (weapon sway, attack speed, damage, accuracy), affected by environmental conditions

### Future Features

1. **World Building**: Procedural dungeons, NPCs, quests
2. **Save System**: LocalStorage/IndexedDB for character saves
3. **Multiplayer**: Potential for online play
4. **Audio**: Sound effects and music
5. **Polish**: Animations, particle effects, UI improvements

---

## Resources

### Documentation
- **TTRPG Rules**: `Des Récits Discordants 2025/systeme_drd/`
- **Godot Template**: `Godot RPG Template/`
- **This README**: `PROJECT_OVERVIEW.md`
- **Game README**: `README.md`

### Key Concepts to Understand

1. **dD System**: 3-sided dice with +/0/- results
2. **Attribute Hierarchy**: ATB → APT → Actions → CT
3. **Experience**: Marks → Éprouver → Réalisation
4. **Souffrances**: Health/injury system tied to attributes
5. **Distinctions**: Special abilities at +10 attribute milestones

---

## Conclusion

This project represents a **faithful digital translation** of the "Des Récits Discordants" TTRPG system, built with modern web technologies. The iterative, type-safe approach ensures accuracy while maintaining flexibility for future expansion.

The combination of:
- **Clear TTRPG rules** (well-documented in markdown)
- **Reference implementation** (Godot template)
- **Modern tech stack** (Next.js, TypeScript, Three.js)
- **AI-assisted development** (Cursor.ai/ChatGPT)

...creates a powerful development environment for building a complex RPG system.



