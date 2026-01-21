# Build Instructions for Windows (PowerShell)

## Quick Start

### Step 1: Install Prerequisites

1. **Install CMake**:
   ```powershell
   winget install Kitware.CMake
   ```
   Or download from: https://cmake.org/download/

2. **Install Visual Studio** (includes C++ compiler):
   - Download Visual Studio Community: https://visualstudio.microsoft.com/
   - During installation, select "Desktop development with C++" workload

3. **Install vcpkg**:
   ```powershell
   cd C:\
   git clone https://github.com/Microsoft/vcpkg.git
   cd vcpkg
   .\bootstrap-vcpkg.bat
   .\vcpkg integrate install
   ```

4. **Install SDL2 via vcpkg**:
   ```powershell
   cd C:\vcpkg
   .\vcpkg install sdl2:x64-windows
   .\vcpkg install stb:x64-windows
   ```

### Step 2: Build the Project

```powershell
# Navigate to the framework directory
cd D:\Toys\WEBSITE\DRD-Webgame\arena-framework

# Create build directory
if (-not (Test-Path build)) { New-Item -ItemType Directory -Path build }
cd build

# Configure CMake (adjust vcpkg path if different)
cmake .. -DCMAKE_TOOLCHAIN_FILE=C:\vcpkg\scripts\buildsystems\vcpkg.cmake

# Build
cmake --build . --config Release

# Run the executable
.\bin\Release\ArenaFramework.exe
```

## Alternative: Using Visual Studio

1. Open Visual Studio
2. File → Open → CMake...
3. Select `arena-framework/CMakeLists.txt`
4. Visual Studio will automatically configure and build

## Troubleshooting

### "cmake is not recognized"
- Add CMake to your PATH, or use the full path:
  ```powershell
  & "C:\Program Files\CMake\bin\cmake.exe" ..
  ```

### "vcpkg not found"
- Make sure you've cloned vcpkg and run bootstrap-vcpkg.bat
- Update the path in the cmake command to match your vcpkg location

### "SDL2 not found"
- Install SDL2 via vcpkg:
  ```powershell
  cd C:\vcpkg
  .\vcpkg install sdl2:x64-windows
  ```

### Build Errors
- Make sure you have Visual Studio C++ tools installed
- Try cleaning and rebuilding:
  ```powershell
  cd build
  Remove-Item -Recurse -Force *
  cmake .. -DCMAKE_TOOLCHAIN_FILE=C:\vcpkg\scripts\buildsystems\vcpkg.cmake
  cmake --build . --config Release
  ```
