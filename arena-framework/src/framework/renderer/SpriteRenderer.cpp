#include "SpriteRenderer.h"
#include "RaycastCamera.h"
#include "Sprite.h"
#include <SDL2/SDL_opengl.h>
#include <cmath>
#include <algorithm>

namespace Arena {

bool SpriteRenderer::ProjectToScreen(const Vec2& worldPos, float worldHeight,
                                     const RaycastCamera& camera,
                                     int screenWidth, int screenHeight,
                                     float& outScreenX, float& outScreenY, float& outScreenSize,
                                     float& outDistance) {
    Vec2 cameraPos = camera.GetPosition();
    float cameraRot = camera.GetRotation();
    
    // Calculate distance from camera
    Vec2 toSprite = worldPos - cameraPos;
    outDistance = toSprite.Length();
    
    if (outDistance < 0.01f) {
        return false; // Too close or same position
    }
    
    // Calculate angle from camera forward direction
    Vec2 cameraDir = camera.GetDirection();
    Vec2 spriteDir = toSprite.Normalized();
    
    // Dot product to get angle
    float dot = cameraDir.x * spriteDir.x + cameraDir.y * spriteDir.y;
    float angle = acosf(dot);
    
    // Check if sprite is behind camera (angle > 90 degrees)
    if (angle > 1.5708f) { // PI/2
        return false;
    }
    
    // Calculate screen X position using perspective projection
    // Use perpendicular vector to calculate side angle
    Vec2 right = Vec2(cameraDir.y, -cameraDir.x); // Perpendicular to forward
    float sideDot = right.x * spriteDir.x + right.y * spriteDir.y;
    float sideAngle = asinf(sideDot);
    
    // Project to screen X (using FOV approximation)
    float fov = 0.66f; // Approximate FOV (60 degrees)
    float screenX = screenWidth / 2.0f + (sideAngle / fov) * (screenWidth / 2.0f);
    
    // Calculate screen Y position (center of screen, adjusted for height)
    float screenY = screenHeight / 2.0f;
    
    // Adjust for sprite height above ground
    float heightOffset = (worldHeight / outDistance) * (screenHeight / 2.0f);
    screenY -= heightOffset;
    
    // Calculate sprite size based on distance
    float spriteScale = 1.0f / outDistance;
    outScreenSize = spriteScale * screenHeight * 0.5f; // Base size
    
    outScreenX = screenX;
    outScreenY = screenY;
    
    return true;
}

void SpriteRenderer::SortSpritesByDistance(SpriteRenderInfo* renderInfos, int count) {
    // Simple bubble sort (fine for small numbers of sprites)
    for (int i = 0; i < count - 1; i++) {
        for (int j = 0; j < count - i - 1; j++) {
            if (renderInfos[j].distance < renderInfos[j + 1].distance) {
                // Swap
                SpriteRenderInfo temp = renderInfos[j];
                renderInfos[j] = renderInfos[j + 1];
                renderInfos[j + 1] = temp;
            }
        }
    }
}

void SpriteRenderer::RenderSprites(SpriteEntity* sprites, int count,
                                   const RaycastCamera& camera,
                                   int screenWidth, int screenHeight) {
    if (!sprites || count <= 0) {
        return;
    }
    
    // Project all sprites to screen space
    SpriteRenderInfo renderInfos[256]; // Max 256 sprites
    int visibleCount = 0;
    
    for (int i = 0; i < count && visibleCount < 256; i++) {
        if (!sprites[i].visible || sprites[i].textureId == 0) {
            continue;
        }
        
        float screenX, screenY, screenSize, distance;
        if (ProjectToScreen(sprites[i].position, sprites[i].worldHeight, camera,
                           screenWidth, screenHeight,
                           screenX, screenY, screenSize, distance)) {
            renderInfos[visibleCount].entity = &sprites[i];
            renderInfos[visibleCount].distance = distance;
            renderInfos[visibleCount].screenX = screenX;
            renderInfos[visibleCount].screenY = screenY;
            renderInfos[visibleCount].screenSize = screenSize * sprites[i].scale;
            visibleCount++;
        }
    }
    
    if (visibleCount == 0) {
        return;
    }
    
    // Sort by distance (farthest first for painter's algorithm)
    SortSpritesByDistance(renderInfos, visibleCount);
    
    // Setup for sprite rendering
    glEnable(GL_TEXTURE_2D);
    glEnable(GL_BLEND);
    glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
    glDisable(GL_DEPTH_TEST);
    
    // Render each sprite
    for (int i = 0; i < visibleCount; i++) {
        SpriteRenderInfo& info = renderInfos[i];
        SpriteEntity* entity = info.entity;
        
        // Calculate sprite dimensions
        float spriteW = (float)entity->spriteWidth * (info.screenSize / (float)entity->spriteHeight);
        float spriteH = info.screenSize;
        
        // Center sprite on screen position
        float x = info.screenX - spriteW * 0.5f;
        float y = info.screenY - spriteH;
        
        // Apply distance-based brightness
        float brightness = 1.0f / (1.0f + info.distance * 0.1f);
        brightness = std::max(0.3f, std::min(1.0f, brightness));
        glColor4f(brightness, brightness, brightness, 1.0f);
        
        // Draw sprite quad
        glBindTexture(GL_TEXTURE_2D, entity->textureId);
        glBegin(GL_QUADS);
        glTexCoord2f(0.0f, 0.0f);
        glVertex2f(x, y);
        glTexCoord2f(1.0f, 0.0f);
        glVertex2f(x + spriteW, y);
        glTexCoord2f(1.0f, 1.0f);
        glVertex2f(x + spriteW, y + spriteH);
        glTexCoord2f(0.0f, 1.0f);
        glVertex2f(x, y + spriteH);
        glEnd();
    }
    
    glDisable(GL_BLEND);
    glDisable(GL_TEXTURE_2D);
    glEnable(GL_DEPTH_TEST);
}

} // namespace Arena
