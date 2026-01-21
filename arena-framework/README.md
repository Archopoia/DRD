# Arena Framework

A minimal TES Arena-style C++ framework that compiles to both native desktop and WebAssembly.

## Philosophy

This is **not a game engine**. It's a minimal framework following vibecoding principles:
- Build only what you need
- Start with the game, let it shape the framework
- No premature abstractions
- Keep it simple

## Building

### Prerequisites

1. **CMake 3.20+** - Download from https://cmake.org/download/ or install via:
   ```powershell
   winget install Kitware.CMake
   ```
   Or via Chocolatey:
   ```powershell
   choco install cmake
   ```

2. **C++17 compatible compiler**:
   - **Visual Studio 2019+** (includes MSVC compiler)
   - Or **MinGW-w64** (GCC)
   - Or **Clang**

3. **vcpkg** (for dependency management):
   ```powershell
   git clone https://github.com/Microsoft/vcpkg.git C:\vcpkg
   cd C:\vcpkg
   .\bootstrap-vcpkg.bat
   .\vcpkg integrate install
   ```

4. **SDL2** will be installed automatically via vcpkg

### Native Build (PowerShell)

```powershell
# Navigate to project directory
cd arena-framework

# Create build directory
if (-not (Test-Path build)) { mkdir build }
cd build

# Configure with CMake (replace C:\vcpkg with your vcpkg path)
cmake .. -DCMAKE_TOOLCHAIN_FILE=C:\vcpkg\scripts\buildsystems\vcpkg.cmake

# Build the project
cmake --build . --config Release
```

### Native Build (Command Prompt / Bash)

```cmd
mkdir build
cd build
cmake .. -DCMAKE_TOOLCHAIN_FILE=C:\vcpkg\scripts\buildsystems\vcpkg.cmake
cmake --build . --config Release
```

### WASM Build

Requires Emscripten SDK (https://emscripten.org/docs/getting_started/downloads.html):

```powershell
# Install Emscripten SDK first, then:
if (-not (Test-Path build-wasm)) { mkdir build-wasm }
cd build-wasm
emcmake cmake .. -DCMAKE_TOOLCHAIN_FILE=C:\vcpkg\scripts\buildsystems\vcpkg.cmake -DTARGET_PLATFORM_WASM=ON
cmake --build .
```

### Troubleshooting

- **CMake not found**: Add CMake to your PATH or use full path to cmake.exe
- **vcpkg not found**: Update the `-DCMAKE_TOOLCHAIN_FILE` path to your vcpkg installation
- **SDL2 not found**: Run `vcpkg install sdl2` in your vcpkg directory

## Project Structure

```
/arena-framework/
  /src/
    /framework/          # Core framework (minimal)
      /core/            # Window, input, time
      /renderer/        # Rendering systems
      /assets/          # Asset loading
      /math/            # Math utilities
      /utils/           # Logging, helpers
    /game/              # Your game code
  /assets/              # Game assets
```

## Current Status

**✅ ALL 8 PHASES COMPLETE** - Framework is fully functional!

### Working Demo
The framework includes a **playable raycaster demo**:
- Procedurally generated dungeon
- First-person movement (WASD)
- Mouse look controls
- Minimap display
- UI overlay with position/FPS
- Debug overlay (F1)

### Run the Demo
```powershell
.\build\bin\Release\ArenaFramework.exe
```

**Controls:**
- Click to capture mouse
- WASD to move (Shift to run)
- Mouse to look around
- ESC to release mouse/exit
- F1 for debug overlay

## Implementation Status

See `IMPLEMENTATION_STATUS.md` for complete details of all implemented systems.

## Next Steps

The framework is ready for game development! You can now:
1. Add textures to walls
2. Create sprites for NPCs/items
3. Implement gameplay features
4. Build your game content

See the plan in `.cursor/plans/` for the original roadmap.
