#pragma once
#include "framework/math/Vec2.h"
#include "Sprite.h"
#include <cstdint>

namespace Arena {
    class RaycastCamera;
}

namespace Arena {

struct SpriteEntity {
    Vec2 position;      // World position (x, y)
    float worldHeight;  // Height above ground (for 3D effect)
    uint32_t textureId; // Texture ID
    int spriteWidth;    // Sprite width
    int spriteHeight;   // Sprite height
    float scale;        // Scale factor
    bool visible;       // Is visible
    
    SpriteEntity() 
        : position(0.0f, 0.0f)
        , worldHeight(0.0f)
        , textureId(0)
        , spriteWidth(64)
        , spriteHeight(64)
        , scale(1.0f)
        , visible(true)
    {
    }
};

struct SpriteRenderInfo {
    SpriteEntity* entity;
    float distance;     // Distance from camera
    float screenX;      // Screen X position
    float screenY;      // Screen Y position
    float screenSize;   // Screen size (height)
};

class SpriteRenderer {
public:
    // Render billboard sprites in 3D space
    // Sprites are sorted by distance and rendered back-to-front
    static void RenderSprites(SpriteEntity* sprites, int count, 
                              const RaycastCamera& camera, 
                              int screenWidth, int screenHeight);
    
    // Project 3D world position to 2D screen coordinates
    static bool ProjectToScreen(const Vec2& worldPos, float worldHeight,
                                const RaycastCamera& camera,
                                int screenWidth, int screenHeight,
                                float& outScreenX, float& outScreenY, float& outScreenSize,
                                float& outDistance);

private:
    // Sort sprites by distance (farthest first for painter's algorithm)
    static void SortSpritesByDistance(SpriteRenderInfo* renderInfos, int count);
};

} // namespace Arena
