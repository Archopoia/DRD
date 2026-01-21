#include "DebugOverlay.h"
#include "framework/renderer/UIRenderer.h"
#include "framework/core/Time.h"
#include <cstdio>

namespace Arena {

bool DebugOverlay::s_visible = false;
bool DebugOverlay::s_wireframe = false;
int DebugOverlay::s_inspectedTileX = 0;
int DebugOverlay::s_inspectedTileY = 0;
float DebugOverlay::s_teleportX = 0.0f;
float DebugOverlay::s_teleportY = 0.0f;
bool DebugOverlay::s_teleportEnabled = false;

void DebugOverlay::Init() {
    s_visible = false;
    s_wireframe = false;
    s_inspectedTileX = 0;
    s_inspectedTileY = 0;
    s_teleportEnabled = false;
}

void DebugOverlay::Shutdown() {
    // Nothing to clean up
}

void DebugOverlay::Update(float deltaTime) {
    // Debug overlay doesn't need per-frame updates
}

void DebugOverlay::Render(Font& font, int screenWidth, int screenHeight) {
    if (!s_visible) return;
    
    UIRenderer::Begin();
    
    float x = 10.0f;
    float y = 10.0f;
    float lineHeight = 20.0f;
    
    // FPS
    DrawFPS(font, x, y);
    y += lineHeight;
    
    // Memory usage
    DrawMemoryUsage(font, x, y);
    y += lineHeight;
    
    // Tile info
    DrawTileInfo(font, x, y);
    y += lineHeight;
    
    // Wireframe mode status
    char wireframeText[64];
    snprintf(wireframeText, sizeof(wireframeText), "Wireframe: %s", s_wireframe ? "ON" : "OFF");
    UIRenderer::DrawText(font, wireframeText, x, y, 0xFFFFFFFF, 0.8f);
    y += lineHeight;
    
    // Instructions
    UIRenderer::DrawText(font, "Press F1 to toggle debug overlay", x, screenHeight - 40, 0x808080FF, 0.7f);
    
    UIRenderer::End();
}

void DebugOverlay::DrawFPS(Font& font, float x, float y) {
    char fpsText[64];
    snprintf(fpsText, sizeof(fpsText), "FPS: %.1f (%.3f ms)", Time::GetFPS(), Time::GetDeltaTime() * 1000.0f);
    UIRenderer::DrawText(font, fpsText, x, y, 0x00FF00FF, 0.8f);
}

void DebugOverlay::DrawMemoryUsage(Font& font, float x, float y) {
    char memText[64];
#ifdef __EMSCRIPTEN__
    // Emscripten memory info (simplified)
    snprintf(memText, sizeof(memText), "Memory: WASM");
#else
    // Native - would need platform-specific memory query
    snprintf(memText, sizeof(memText), "Memory: N/A");
#endif
    UIRenderer::DrawText(font, memText, x, y, 0xFFFFFFFF, 0.8f);
}

void DebugOverlay::DrawTileInfo(Font& font, float x, float y) {
    char tileText[64];
    snprintf(tileText, sizeof(tileText), "Inspected Tile: (%d, %d)", s_inspectedTileX, s_inspectedTileY);
    UIRenderer::DrawText(font, tileText, x, y, 0xFFFFFFFF, 0.8f);
}

} // namespace Arena
