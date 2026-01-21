#include "framework/core/Window.h"
#include "framework/core/Input.h"
#include "framework/core/Time.h"
#include "framework/utils/Log.h"
#include "framework/renderer/Raycaster.h"
#include "framework/renderer/Renderer2D.h"
#include "framework/renderer/Font.h"
#include "framework/renderer/UIRenderer.h"
#include "framework/utils/DebugOverlay.h"
#include "game/actors/Player.h"
#include "game/world/GridMap.h"
#include "game/world/Chunk.h"
#include "game/world/MapGenerator.h"
#define WIN32_LEAN_AND_MEAN
#include <SDL2/SDL_opengl.h>
#undef DrawText  // Undefine Windows macro if present
#include <SDL2/SDL.h>
#include <cstdio>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

using namespace Arena;

Window* g_window = nullptr;
bool g_running = true;
Player* g_player = nullptr;
ChunkManager* g_world = nullptr;
GridMap* g_testMap = nullptr;
Font* g_font = nullptr;
bool g_showDebug = false;

void GameLoop() {
    if (!g_window || !g_running) {
        return;
    }
    
    // Update systems
    Time::Update();
    Input::Update();
    g_window->PollEvents();
    
    if (g_window->ShouldClose()) {
        g_running = false;
        return;
    }
    
    // Handle ESC to exit or toggle debug
    static bool escPressed = false;
    if (Input::IsKeyPressed(SDLK_ESCAPE)) {
        if (SDL_GetRelativeMouseMode()) {
            // Release mouse if captured
            SDL_SetRelativeMouseMode(SDL_FALSE);
        } else {
            // Exit if mouse not captured
            g_running = false;
            return;
        }
    }
    
    // Toggle debug overlay with F1
    if (Input::IsKeyPressed(SDLK_F1)) {
        g_showDebug = !g_showDebug;
        DebugOverlay::SetVisible(g_showDebug);
    }
    
    // Capture mouse for first-person controls (click to capture)
    static bool mouseCaptured = false;
    if (Input::IsMousePressed(0) && !mouseCaptured) {
        SDL_CaptureMouse(SDL_TRUE);
        SDL_SetRelativeMouseMode(SDL_TRUE);
        mouseCaptured = true;
    }
    // Update mouse captured state
    mouseCaptured = SDL_GetRelativeMouseMode() != SDL_FALSE;
    
    // Update player (use GridMap for collision since that's what we're rendering)
    if (g_player && g_testMap) {
        g_player->Update(Time::GetDeltaTime(), *g_testMap);
    }
    
    // Clear screen
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    
    // Render raycaster
    if (g_player && g_testMap) {
        int width = g_window->GetWidth();
        int height = g_window->GetHeight();
        Raycaster::RenderFrame(g_player->GetCamera(), *g_testMap, width, height);
        
        // Render UI overlay
        if (g_font) {
            UIRenderer::Begin();
            
            // Instructions (if mouse not captured)
            if (!mouseCaptured) {
                UIRenderer::DrawTextCentered(*g_font, "Click to start - WASD to move, Mouse to look", 
                    width / 2.0f, height - 80.0f, width, 0xFFFFFFFF, 1.0f);
                UIRenderer::DrawTextCentered(*g_font, "F1: Debug | ESC: Exit", 
                    width / 2.0f, height - 50.0f, width, 0xCCCCCCFF, 0.9f);
            } else {
                // Show controls hint when playing
                UIRenderer::DrawText(*g_font, "F1: Debug | ESC: Release Mouse", 10.0f, height - 30.0f, 0xCCCCCCFF, 0.7f);
            }
            
            // Position info (top left)
            char posText[128];
            Vec2 playerPos = g_player->GetPosition();
            float rot = g_player->GetCamera().GetRotation();
            snprintf(posText, sizeof(posText), "Pos: (%.1f, %.1f) Rot: %.1f", playerPos.x, playerPos.y, rot * 57.2958f);
            UIRenderer::DrawText(*g_font, posText, 10.0f, 10.0f, 0xFFFFFFFF, 0.8f);
            
            // FPS (top right)
            char fpsText[64];
            snprintf(fpsText, sizeof(fpsText), "FPS: %.0f", Time::GetFPS());
            float fpsWidth = g_font->GetTextWidth(fpsText, 0.8f);
            UIRenderer::DrawText(*g_font, fpsText, width - fpsWidth - 10.0f, 10.0f, 0x00FF00FF, 0.8f);
            
            // Simple minimap (top right, below FPS)
            float minimapSize = 150.0f;
            float minimapX = width - minimapSize - 10.0f;
            float minimapY = 40.0f;
            float minimapScale = minimapSize / 64.0f; // Map is 64x64
            
            // Minimap background
            UIRenderer::DrawPanel(minimapX, minimapY, minimapSize, minimapSize, 0x00000080, 0xFFFFFFFF);
            
            // Draw map tiles
            for (int y = 0; y < 64; y++) {
                for (int x = 0; x < 64; x++) {
                    if (g_testMap->IsSolid(x, y)) {
                        float px = minimapX + x * minimapScale;
                        float py = minimapY + y * minimapScale;
                        Renderer2D::DrawRect(px, py, minimapScale, minimapScale, 0x808080FF, true);
                    }
                }
            }
            
            // Draw player position
            float playerMapX = minimapX + playerPos.x * minimapScale;
            float playerMapY = minimapY + playerPos.y * minimapScale;
            Renderer2D::DrawCircle(playerMapX, playerMapY, 3.0f, 0x00FF00FF, true);
            
            // Draw player direction
            Vec2 dir = g_player->GetCamera().GetDirection();
            Renderer2D::DrawLine(playerMapX, playerMapY, 
                playerMapX + dir.x * 8.0f, playerMapY + dir.y * 8.0f, 0x00FF00FF);
            
            // Crosshair (center of screen)
            if (mouseCaptured) {
                float crosshairSize = 10.0f;
                float centerX = width / 2.0f;
                float centerY = height / 2.0f;
                Renderer2D::DrawLine(centerX - crosshairSize, centerY, centerX + crosshairSize, centerY, 0xFFFFFFFF);
                Renderer2D::DrawLine(centerX, centerY - crosshairSize, centerX, centerY + crosshairSize, 0xFFFFFFFF);
            }
            
            // Debug overlay
            if (g_showDebug) {
                DebugOverlay::Render(*g_font, width, height);
            }
            
            UIRenderer::End();
        }
    }
    
    // Swap buffers
    g_window->SwapBuffers();
    
    // Log FPS every second
    static float lastLogTime = 0.0f;
    if (Time::GetTotalTime() - lastLogTime >= 1.0f) {
        Log::Info("FPS: %.2f, Delta: %.4f", Time::GetFPS(), Time::GetDeltaTime());
        lastLogTime = Time::GetTotalTime();
    }
}

#ifdef __EMSCRIPTEN__
void EmscriptenMainLoop() {
    GameLoop();
}
#endif

int main(int argc, char* argv[]) {
    Log::Info("Arena Framework - Starting");
    
    // Initialize systems
    Time::Init();
    Input::Init();
    Renderer2D::Init(1280, 720);
    UIRenderer::Init(1280, 720);
    DebugOverlay::Init();
    
    // Create window
    WindowConfig config;
    config.width = 1280;
    config.height = 720;
    config.title = "Arena Framework - Raycaster Demo";
    config.fullscreen = false;
    config.vsync = true;
    
    g_window = new Window();
    if (!g_window->Create(config)) {
        Log::Error("Failed to create window");
        delete g_window;
        return 1;
    }
    
    // Create test map
    g_testMap = new GridMap();
    if (!g_testMap->Create(64, 64)) {
        Log::Error("Failed to create map");
        return 1;
    }
    
    // Generate a simple dungeon
    MapGenerator::GenerateRoomsAndCorridors(*g_testMap, 15, 12345);
    
    // Create player at a safe spawn point (find an open tile)
    g_player = new Player();
    // Find a good spawn point (non-solid tile)
    Vec2 spawnPos(10.0f, 10.0f);
    for (int y = 5; y < 60; y++) {
        for (int x = 5; x < 60; x++) {
            if (!g_testMap->IsSolid(x, y)) {
                spawnPos = Vec2((float)x + 0.5f, (float)y + 0.5f);
                break;
            }
        }
        if (spawnPos.x != 10.0f) break;
    }
    g_player->SetPosition(spawnPos);
    g_player->GetCamera().SetRotation(0.0f);
    Log::Info("Player spawned at: (%.2f, %.2f)", spawnPos.x, spawnPos.y);
    
    // Create chunk manager (for future use with streaming)
    g_world = new ChunkManager();
    g_world->Initialize(64);
    
    // Set raycaster options
    Raycaster::SetWallHeight(1.0f);
    Raycaster::SetFloorColor(0x303030FF);  // Darker floor
    Raycaster::SetCeilingColor(0x505050FF); // Lighter ceiling
    
    // Create font for UI
    g_font = new Font();
    if (!g_font->Load("", 16)) {
        Log::Warn("Failed to load font, UI text may not display");
    }
    
    Log::Info("Game loop starting");
    Log::Info("Controls: Click to capture mouse, WASD to move, Mouse to look, F1 for debug, ESC to exit");
    
#ifdef __EMSCRIPTEN__
    // Emscripten main loop
    emscripten_set_main_loop(EmscriptenMainLoop, 0, 1);
#else
    // Native main loop
    while (g_running) {
        GameLoop();
    }
#endif
    
    // Cleanup
    if (g_font) {
        g_font->Free();
        delete g_font;
    }
    if (g_world) {
        g_world->Shutdown();
        delete g_world;
    }
    if (g_player) {
        delete g_player;
    }
    if (g_testMap) {
        g_testMap->Destroy();
        delete g_testMap;
    }
    if (g_window) {
        g_window->Destroy();
        delete g_window;
    }
    
    DebugOverlay::Shutdown();
    UIRenderer::Shutdown();
    Renderer2D::Shutdown();
    Log::Info("Shutting down");
    return 0;
}
