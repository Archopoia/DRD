#pragma once
#include "framework/math/Vec2.h"
#include <cstdint>

// Forward declaration
namespace Arena {
    class GridMap;
    class RaycastCamera;
}

namespace Arena {

struct RaycastHit {
    float distance;
    Vec2 hitPoint;
    int mapX, mapY;
    int side; // 0 = x-side, 1 = y-side
    float wallX; // Where on the wall (0-1)
    uint8_t wallType;
    
    bool hit;
    
    RaycastHit() : hit(false), distance(0.0f), mapX(0), mapY(0), side(0), wallX(0.0f), wallType(0) {}
};

class Raycaster {
public:
    Raycaster();
    
    // Cast a ray from origin in direction
    static RaycastHit CastRay(const Vec2& origin, const Vec2& direction, const Arena::GridMap& map, float maxDistance = 100.0f);
    
    // Render a frame using raycaster
    static void RenderFrame(const RaycastCamera& camera, const Arena::GridMap& map, int screenWidth, int screenHeight);
    
    // Render sprites (call after RenderFrame)
    static void RenderSprites(class SpriteEntity* sprites, int count, const RaycastCamera& camera, int screenWidth, int screenHeight);
    
    // Set rendering options
    static void SetWallHeight(float height) { s_wallHeight = height; }
    static float GetWallHeight() { return s_wallHeight; }
    
    static void SetFloorColor(uint32_t color) { s_floorColor = color; }
    static void SetCeilingColor(uint32_t color) { s_ceilingColor = color; }
    static uint32_t GetFloorColor() { return s_floorColor; }
    static uint32_t GetCeilingColor() { return s_ceilingColor; }
    
    // Texture management
    static void SetWallTexture(uint8_t wallType, uint32_t textureId);
    static uint32_t GetWallTexture(uint8_t wallType);

private:
    static float s_wallHeight;
    static uint32_t s_floorColor;
    static uint32_t s_ceilingColor;
    static uint32_t s_wallTextures[4]; // One texture per wall type (0-3)
};

} // namespace Arena
