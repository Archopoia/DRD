cmake_minimum_required(VERSION 3.20)
project(ArenaFramework VERSION 0.1.0 LANGUAGES CXX)

# C++17 standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Build options
option(TARGET_PLATFORM_WASM "Build for WebAssembly" OFF)

# Output directories
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)
set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)

# Include directories
include_directories(${CMAKE_SOURCE_DIR}/src)
include_directories(${CMAKE_SOURCE_DIR})

# Platform-specific setup
if(TARGET_PLATFORM_WASM)
    # Emscripten-specific settings
    set(CMAKE_EXECUTABLE_SUFFIX ".html")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -s USE_SDL=2 -s USE_WEBGL2=1 -s WASM=1")
    set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -s USE_SDL=2 -s USE_WEBGL2=1 -s WASM=1 --preload-file assets")
else()
    # Native build - find packages via vcpkg
    find_package(SDL2 REQUIRED)
    # stb is header-only, find include directory
    find_path(STB_INCLUDE_DIR 
        NAMES stb_image.h
        PATHS 
            ${CMAKE_BINARY_DIR}/vcpkg_installed/x64-windows/include
            ${CMAKE_SOURCE_DIR}/vcpkg_installed/x64-windows/include
            ${VCPKG_ROOT}/installed/x64-windows/include
    )
    if(STB_INCLUDE_DIR)
        include_directories(${STB_INCLUDE_DIR})
        message(STATUS "Found stb at: ${STB_INCLUDE_DIR}")
    else()
        message(WARNING "stb not found, image loading may not work")
    endif()
endif()

# Framework source files
set(FRAMEWORK_SOURCES
    src/framework/core/Window.cpp
    src/framework/core/Input.cpp
    src/framework/core/Time.cpp
    src/framework/utils/Log.cpp
    src/framework/math/Mat4.cpp
    src/framework/assets/AssetLoader.cpp
    src/framework/renderer/Renderer2D.cpp
    src/framework/renderer/Sprite.cpp
    src/framework/renderer/Font.cpp
    src/framework/renderer/RaycastCamera.cpp
    src/framework/renderer/Raycaster.cpp
)

# Game source files
set(GAME_SOURCES
    src/game/main.cpp
    src/game/world/GridMap.cpp
    src/game/world/Chunk.cpp
    src/game/world/MapGenerator.cpp
    src/game/world/Collision.cpp
    src/game/world/Door.cpp
    src/game/actors/Actor.cpp
    src/game/actors/Player.cpp
    src/game/items/Item.cpp
    src/game/simulation/Combat.cpp
    src/framework/renderer/UIRenderer.cpp
    src/game/ui/Inventory.cpp
    src/game/ui/HUD.cpp
    src/game/ui/Dialogue.cpp
    src/game/ui/Menu.cpp
    src/game/data/GameData.cpp
    src/game/systems/SaveSystem.cpp
    src/game/systems/QuestSystem.cpp
    src/framework/utils/DebugOverlay.cpp
)

# Create executable
add_executable(${PROJECT_NAME} ${FRAMEWORK_SOURCES} ${GAME_SOURCES})

# Link libraries
if(TARGET_PLATFORM_WASM)
    # Emscripten handles linking automatically
else()
    target_link_libraries(${PROJECT_NAME} 
        SDL2::SDL2
        SDL2::SDL2main
    )
    target_include_directories(${PROJECT_NAME} PRIVATE ${SDL2_INCLUDE_DIRS})
    
    # Link OpenGL
    if(WIN32)
        # Windows: link opengl32.lib directly
        target_link_libraries(${PROJECT_NAME} opengl32)
    else()
        find_package(OpenGL REQUIRED)
        target_link_libraries(${PROJECT_NAME} OpenGL::GL)
    endif()
endif()

# Compiler-specific options
if(MSVC)
    target_compile_options(${PROJECT_NAME} PRIVATE /W4 /WX-)
else()
    target_compile_options(${PROJECT_NAME} PRIVATE -Wall -Wextra -Wpedantic)
endif()

# Copy assets to build directory (native only)
if(NOT TARGET_PLATFORM_WASM)
    file(COPY ${CMAKE_SOURCE_DIR}/assets DESTINATION ${CMAKE_BINARY_DIR})
endif()
