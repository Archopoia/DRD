# Daggerfall-like RPG

A browser-based first-person RPG inspired by Daggerfall, built with Three.js, Next.js, and TypeScript.

## Features

- Retro 3D rendering with custom shaders
- First-person camera controls with mouse look
- WASD movement with run modifier
- Basic 3D scene with test geometry
- TypeScript throughout for type safety
- Next.js App Router structure
- Ready for expansion (physics, UI, saves)

## Tech Stack

- **Rendering**: Three.js with custom retro shaders
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Build System**: Next.js dev server

## Getting Started

### Prerequisites

- Node.js 18+ and npm (or yarn/pnpm)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Controls

- **Click** - Lock/unlock mouse pointer
- **WASD** - Move forward/backward/left/right
- **Shift** - Run (hold while moving)
- **Mouse** - Look around (when pointer is locked)

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
├── game/            # Game logic
│   ├── core/        # Core game systems
│   ├── renderer/    # Rendering and shaders
│   ├── camera/      # Camera controls
│   ├── world/       # Scene setup
│   └── utils/       # Utilities and types
└── lib/             # Constants and shared code
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Testing and Debugging

The game includes comprehensive debugging and error handling:

- **Debug Logging**: All major operations are logged to the console in development mode
- **FPS Counter**: Displayed in the top-right corner during development
- **Error Handling**: User-friendly error messages displayed if initialization fails
- **Performance Monitoring**: Warnings logged for slow operations (>16ms)
- **WebGL Support Check**: Automatically checks and reports WebGL compatibility

To test the game:

1. Start the dev server: `npm run dev`
2. Open the browser console to see debug logs
3. Check the FPS counter (top-right) for performance
4. Test all controls (WASD, mouse look, pointer lock)
5. Resize the window to test responsive behavior
6. Check for any console errors or warnings

### Debug Utility

The game uses a centralized `Debug` utility (`src/game/utils/debug.ts`) for all logging:

- `Debug.log()` - Informational messages
- `Debug.error()` - Error conditions
- `Debug.warn()` - Warnings
- `Debug.startMeasure()` / `Debug.endMeasure()` - Performance tracking

All debug output is automatically disabled in production builds.

## Game Design Philosophy

This is an **immersive sim** (like Deus Ex, System Shock, Prey) combined with **action-RPG** mechanics (like Daggerfall/Morrowind/Oblivion), not a TTRPG simulator. The character stats from "Des Récits Discordants" are translated into **direct gameplay modifiers** that affect gameplay variables in real-time:

- **No dice rolling** - Stats directly modify gameplay mechanics
- **Environmental systems** - 8 environmental condition axes (pressure, wind, radiation, temperature, moisture, terrain, light, respiration) create dynamic, systemic challenges
- **Physics-based interactions** - Using Rapier physics engine for realistic environmental responses
- **Immersive minigames** - Each gameplay aspect (combat, social, stealth, exploration, etc.) is an integrated "minigame" that feels natural
- **Direct stat impact** - Attributes, aptitudes, and competences affect:
  - Movement speed and agility (affected by terrain, pressure, etc.)
  - Weapon sway and accuracy (affected by wind, temperature, etc.)
  - Social interaction success rates
  - Stealth detection and visibility (affected by light conditions)
  - Exploration and discovery mechanics (affected by environmental conditions)
  - Knowledge and investigation systems
  - Environmental resistance and habituation
  - And more...
- **Systemic design** - Tools, equipment, and player actions interact with environmental conditions in meaningful, emergent ways

## Future Expansion

Planned features for future development:

### Core Systems (Priority)
- **Physics integration (Rapier)** - Required for movement, combat, environmental interactions
- **Stat-to-Gameplay Modifier System** - Translate character stats into gameplay variables
- **Environmental Conditions System** - 8 condition axes (FLU/MOI/TER/TEM/RES/RAD/LUM/PRE) affecting gameplay
- **Tool/Equipment System** - Tools that resist environmental conditions, require maintenance
- **Combat system** - Action-based combat with stat-driven modifiers (weapon sway, attack speed, damage)
- **Movement system** - Stat-driven movement speed, jump height, stamina, affected by environmental conditions

### Gameplay Systems (8 Types of Conflicts/Gameplay)

The game features **8 distinct types of gameplay** directly connected to the 8 Aptitudes, replacing the traditional combat/stealth/social division with a more nuanced approach:

1. **Bataille (Puissance)** - Direct frontal combat; kill/destroy to take or pass
2. **Infiltration (Aisance)** - Stealth and evasion; steal/sneak past undetected
3. **Artisanat (Précision)** - Subterfuge and crafting; create diversions/alternative paths through cunning
4. **Prouesse (Athlétisme)** - Physical feats; overcome obstacles through strength and athleticism
5. **Corrompre (Charisme)** - Social manipulation; exploit vices/interests to get what you want
6. **Énigme (Réflexion)** - Puzzle-solving; find rare solutions through logic and creativity
7. **Enquête (Détection)** - Investigation; discover secrets and hidden flaws
8. **Débat (Domination)** - Persuasion and debate; convince through will and argumentation

Each gameplay type can be used for two scenarios: obtaining a guarded object or overcoming a guarding obstacle. Multiple solutions are encouraged for any given conflict.

### World & Content
- Sprite billboards for enemies and NPCs
- Procedural dungeon generation
- Texture loading system
- Audio system

### Technical
- UI components (inventory, menus, dialogue)
- Save system (localStorage/IndexedDB)

## License

MIT



