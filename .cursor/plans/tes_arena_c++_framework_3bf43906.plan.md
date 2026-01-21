---
name: TES Arena C++ Framework
overview: "Build a minimal TES Arena-style C++ framework that compiles to both native desktop and WebAssembly, following vibecoding principles: build only what you need, start with the game, let it shape the framework."
todos: []
---

# TES Arena-Style C++ Framework Plan

## Project Structure

```
/arena-framework/
  /src/
    /framework/          # Core framework (minimal, engine-like)
      /core/            # Window, input, time, bootstrap
      /renderer/        # Raycaster, 2D blitter, sprite batcher
      /assets/          # Asset loading (binary, sprites, sounds)
      /math/            # Vector, matrix, math utilities
      /utils/           # Logging, file I/O, helpers
    /game/              # Your game code (this is where you build)
      /world/           # GridMap, chunk streaming, generation
      /actors/          # NPCs, enemies, player
      /items/           # Items, inventory
      /ui/              # UI rendering (2D overlay)
      /simulation/      # Gameplay systems (combat, dialogue, etc.)
    /platform/          # Platform-specific code
      /native/          # SDL2/GLFW for desktop
      /wasm/            # Emscripten bindings for web
  /assets/              # Game assets (sprites, sounds, data)
  /tools/               # Optional debug tools
  /build/               # CMake build output
  CMakeLists.txt        # Main CMake config
  vcpkg.json            # Dependency management
  README.md
```

## Phase 1: Bootstrap Skeleton (Days 1-3)

### Files to Create

**`CMakeLists.txt`** (root)

- CMake 3.20+ requirement
- C++17 standard
- vcpkg integration
- Options for native/WASM builds
- SDL2 dependency via vcpkg

**`vcpkg.json`** (root)

- SDL2 (desktop)
- stb_image (sprite loading)
- Optional: GLFW alternative to SDL2

**`src/framework/core/Window.h`** and **`Window.cpp`**

- SDL2 window creation
- OpenGL context setup
- Window resize handling
- Platform abstraction (native vs WASM)

**`src/framework/core/Input.h`** and **`Input.cpp`**

- Simple `InputState` struct (keys, mouse)
- Poll-based input (no callbacks)
- WASM-compatible input handling

**`src/framework/core/Time.h`** and **`Time.cpp`**

- Delta time calculation
- Frame timing utilities
- Simple timer class

**`src/framework/utils/Log.h`** and **`Log.cpp`**

- Console logging (printf-style)
- Log levels (INFO, WARN, ERROR)
- WASM console.log integration

**`src/framework/math/Vec2.h`**, **`Vec3.h`**, **`Vec4.h`**

- Simple vector structs
- Basic operations (add, sub, mul, dot, cross)
- No external math library dependency

**`src/framework/math/Mat4.h`** and **`Mat4.cpp`**

- 4x4 matrix for transforms
- Basic operations (multiply, inverse, perspective, look-at)

**`src/game/main.cpp`**

- Entry point
- Window creation
- Basic game loop skeleton
- Clear screen test

### Implementation Notes

- Keep everything header-only where possible (except platform code)
- Use `#ifdef __EMSCRIPTEN__` for WASM-specific code
- No exceptions in framework code (use error codes/optional)
- All framework code should compile to WASM without modification

## Phase 2: 2D Renderer (Days 4-8)

### Files to Create

**`src/framework/renderer/Renderer2D.h`** and **`Renderer2D.cpp`**

- OpenGL 2.0/ES 2.0 compatible (for WASM)
- Pixel buffer management
- Draw pixel, line, rectangle functions
- Simple sprite blitting
- Text rendering (bitmap fonts)

**`src/framework/renderer/Sprite.h`** and **`Sprite.cpp`**

- Sprite struct (texture ID, width, height, UVs)
- Sprite batch renderer (optional optimization)
- Texture loading via stb_image

**`src/framework/renderer/Font.h`** and **`Font.cpp`**

- Bitmap font loader
- Text rendering utilities
- Character width/height tracking

**`src/framework/assets/AssetLoader.h`** and **`AssetLoader.cpp`**

- Binary file reading
- Sprite loading (BMP/PNG/TGA via stb_image)
- WAV sound loading (simple header parser)
- Asset path management

### Implementation Notes

- Use immediate mode rendering (no VBOs initially)
- Keep shaders simple (flat colors, textures)
- WASM: Use Emscripten's file system API for assets
- Native: Direct file I/O

## Phase 3: Raycaster (Days 9-22)

### Files to Create

**`src/framework/renderer/Raycaster.h`** and **`Raycaster.cpp`**

- DDA (Digital Differential Analyzer) grid traversal
- Wall rendering (vertical columns)
- Floor/ceiling rendering
- Texture mapping for walls
- Sprite billboarding (NPCs, items)

**`src/framework/renderer/RaycastCamera.h`** and **`RaycastCamera.cpp`**

- First-person camera for raycaster
- Position, rotation (yaw only for 2.5D)
- Field of view management
- Ray direction calculation

**`src/game/world/GridMap.h`** and **`GridMap.cpp`**

- 2D tile array (`uint8_t tiles[W][H]`)
- Tile metadata (wall type, floor, ceiling)
- Collision checking (tile-based)
- Map loading/saving

### Implementation Notes

- Classic Wolf3D-style raycaster algorithm
- Render one vertical column per screen pixel
- Use fixed-point math for performance (optional)
- Keep wall height constant (no variable heights initially)

## Phase 4: Map System (Days 23-30)

### Files to Create

**`src/game/world/Chunk.h`** and **`Chunk.cpp`**

- Chunk struct (tile data, position, loaded state)
- Chunk loading/unloading
- Memory management

**`src/game/world/ChunkManager.h`** and **`ChunkManager.cpp`**

- Chunk streaming system
- Load chunks around player
- Distance-based chunk priority
- WASM: Async loading support

**`src/game/world/MapGenerator.h`** and **`MapGenerator.cpp`**

- Procedural city layout
- Building template system
- Dungeon room + corridor generator
- Random seed support

**`src/game/world/Collision.h`** and **`Collision.cpp`**

- Tile-based collision detection
- Player movement collision
- Raycast for interaction (doors, items)

### Implementation Notes

- Chunks are 64x64 or 128x128 tiles
- Load chunks in a radius around player
- Unload chunks beyond threshold distance
- Keep generation deterministic (seed-based)

## Phase 5: Basic Gameplay (Days 31-40)

### Files to Create

**`src/game/actors/Actor.h`** and **`Actor.cpp`**

- Actor struct (position, sprite ID, stats)
- Basic AI (patrol, chase, idle)
- Update loop integration

**`src/game/actors/Player.h`** and **`Player.cpp`**

- Player controller
- Movement (WASD)
- Mouse look
- Interaction system (E key)

**`src/game/items/Item.h`** and **`Item.cpp`**

- Item struct (type, sprite, properties)
- Item spawning
- Pickup system

**`src/game/simulation/Combat.h`** and **`Combat.cpp`**

- Simple hit/miss calculation
- Damage application
- Health system

**`src/game/world/Door.h`** and **`Door.cpp`**

- Door state (open/closed/locked)
- Interaction handling
- Animation (optional)

### Implementation Notes

- Keep systems simple (no ECS yet)
- Use structs + functions, not classes where possible
- Add complexity only when game needs it

## Phase 6: UI Layer (Days 41-50)

### Files to Create

**`src/framework/renderer/UIRenderer.h`** and **`UIRenderer.cpp`**

- UI overlay rendering (2D on top of raycaster)
- Panel/rectangle drawing
- Text rendering for UI
- Input focus management

**`src/game/ui/Inventory.h`** and **`Inventory.cpp`**

- Inventory data structure
- Item storage
- UI rendering (grid of items)

**`src/game/ui/HUD.h`** and **`HUD.cpp`**

- Health bar
- Minimap (optional)
- Crosshair
- Status indicators

**`src/game/ui/Dialogue.h`** and **`Dialogue.cpp`**

- Dialogue tree system
- Text display
- Choice selection

**`src/game/ui/Menu.h`** and **`Menu.cpp`**

- Main menu
- Settings menu
- Pause menu

### Implementation Notes

- UI is pure 2D rendering (no 3D)
- Use simple state machines for menus
- Keep UI code separate from game logic

## Phase 7: Content Pipeline (Days 51-60)

### Files to Create

**`src/game/data/GameData.h`** and **`GameData.cpp`**

- Data definitions (enemies, items, spells)
- Load from JSON or custom binary format
- Runtime data access

**`src/game/systems/SaveSystem.h`** and **`SaveSystem.cpp`**

- Save game format (binary or JSON)
- Player state serialization
- World state serialization
- WASM: Use IndexedDB for saves

**`src/game/systems/QuestSystem.h`** and **`QuestSystem.cpp`**

- Quest data structure
- Quest state tracking
- Quest completion logic

### Implementation Notes

- Use simple binary formats (no complex serialization)
- Keep save files small (compress if needed)
- WASM: Use Emscripten's IDBFS for persistent storage

## Phase 8: Tools & Polish (Days 61+)

### Files to Create

**`src/framework/utils/DebugOverlay.h`** and **`DebugOverlay.cpp`**

- FPS counter
- Memory usage display
- Wireframe mode toggle
- Tile inspector
- Teleport to coordinates

**`tools/map_viewer/`** (optional)

- Simple external tool to visualize maps
- Debug map generation
- Export/import maps

**`src/framework/core/HotReload.h`** and **`HotReload.cpp`** (optional)

- Asset hot reload (reload sprites on keypress)
- Code hot reload via shared libraries (native only)

### Implementation Notes

- Debug tools are in-game overlays (no external editor)
- Keep tools minimal (only what you need)
- Hot reload is nice-to-have, not required

## WASM Integration Strategy

### Emscripten Setup

- Use Emscripten SDK for WASM compilation
- CMake toolchain file: `emscripten.toolchain.cmake`
- Build target: `arena-framework.js` + `arena-framework.wasm`

### Key WASM Considerations

- File system: Use Emscripten's `--preload-file` or fetch API
- Input: Use Emscripten's HTML5 input API
- Rendering: Use WebGL (same as native OpenGL ES 2.0)
- Audio: Use Web Audio API or SDL2_mixer (Emscripten port)
- Storage: Use IndexedDB via Emscripten's IDBFS

### Build Commands

```bash
# Native build
mkdir build && cd build
cmake .. -DCMAKE_TOOLCHAIN_FILE=[vcpkg-root]/scripts/buildsystems/vcpkg.cmake
cmake --build .

# WASM build
mkdir build-wasm && cd build-wasm
emcmake cmake .. -DCMAKE_TOOLCHAIN_FILE=[vcpkg-root]/scripts/buildsystems/vcpkg.cmake -DTARGET_PLATFORM=WASM
cmake --build .
```

## Development Workflow

1. **Start with Phase 1**: Get window + input working
2. **Test in browser**: Compile to WASM early to catch issues
3. **Build incrementally**: Add one feature at a time
4. **Let game drive framework**: Only add framework features when game needs them
5. **Commit often**: Git history helps Cursor understand context
6. **Use Cursor for implementation**: Write design docs, let Cursor generate code

## Key Principles

- **No ECS until needed**: Start with structs + functions
- **No scripting language**: Game logic is C++ code
- **No asset pipeline**: Load raw files directly
- **No scene graph**: Simple arrays of actors/items
- **Minimal dependencies**: SDL2, stb_image, maybe GLFW
- **WASM-first mindset**: Code should work in both native and WASM

## Success Criteria

- Framework compiles to both native and WASM
- Can render a simple raycaster dungeon
- Player can move and interact with doors
- Basic UI (inventory, HUD) works
- Assets load from files
- Game can save/load state
- Debug overlay provides useful information