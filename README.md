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

## Future Expansion

Planned features for future development:

- Physics integration (Cannon.js or Rapier)
- Sprite billboards for enemies
- Procedural dungeon generation
- UI components (inventory, menus, dialogue)
- Save system (localStorage/IndexedDB)
- Texture loading system
- Audio system
- Character stats and progression
- Combat system

## License

MIT



