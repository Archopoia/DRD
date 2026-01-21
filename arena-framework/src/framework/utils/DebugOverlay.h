#pragma once
#include "framework/renderer/UIRenderer.h"
#include "framework/renderer/Font.h"
#include "framework/core/Time.h"
#include <cstdint>

namespace Arena {

class DebugOverlay {
public:
    static void Init();
    static void Shutdown();
    
    static void Update(float deltaTime);
    static void Render(Font& font, int screenWidth, int screenHeight);
    
    // Toggles
    static void Toggle() { s_visible = !s_visible; }
    static void SetVisible(bool visible) { s_visible = visible; }
    static bool IsVisible() { return s_visible; }
    
    // Debug modes
    static void ToggleWireframe() { s_wireframe = !s_wireframe; }
    static bool IsWireframe() { return s_wireframe; }
    
    // Tile inspector
    static void SetInspectedTile(int x, int y) { s_inspectedTileX = x; s_inspectedTileY = y; }
    static void GetInspectedTile(int& x, int& y) { x = s_inspectedTileX; y = s_inspectedTileY; }
    
    // Teleport
    static void SetTeleportTarget(float x, float y) { s_teleportX = x; s_teleportY = y; s_teleportEnabled = true; }
    static bool GetTeleportTarget(float& x, float& y) {
        if (s_teleportEnabled) {
            x = s_teleportX;
            y = s_teleportY;
            s_teleportEnabled = false;
            return true;
        }
        return false;
    }

private:
    static bool s_visible;
    static bool s_wireframe;
    static int s_inspectedTileX;
    static int s_inspectedTileY;
    static float s_teleportX;
    static float s_teleportY;
    static bool s_teleportEnabled;
    
    static void DrawFPS(Font& font, float x, float y);
    static void DrawMemoryUsage(Font& font, float x, float y);
    static void DrawTileInfo(Font& font, float x, float y);
};

} // namespace Arena
