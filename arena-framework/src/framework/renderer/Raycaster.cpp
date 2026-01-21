#include "Raycaster.h"
#include "RaycastCamera.h"
#include "Renderer2D.h"
#include "SpriteRenderer.h"
#include "game/world/GridMap.h"
#include <SDL2/SDL_opengl.h>
#include <cmath>
#include <algorithm>

namespace Arena {

float Raycaster::s_wallHeight = 1.0f;
uint32_t Raycaster::s_floorColor = 0x404040FF;
uint32_t Raycaster::s_ceilingColor = 0x808080FF;
uint32_t Raycaster::s_wallTextures[4] = { 0, 0, 0, 0 };

RaycastHit Raycaster::CastRay(const Vec2& origin, const Vec2& direction, const GridMap& map, float maxDistance) {
    RaycastHit hit;
    
    // DDA algorithm (Digital Differential Analyzer)
    int mapX = (int)floorf(origin.x);
    int mapY = (int)floorf(origin.y);
    
    float deltaDistX = (direction.x == 0.0f) ? 1e30f : fabsf(1.0f / direction.x);
    float deltaDistY = (direction.y == 0.0f) ? 1e30f : fabsf(1.0f / direction.y);
    
    int stepX, stepY;
    float sideDistX, sideDistY;
    
    if (direction.x < 0.0f) {
        stepX = -1;
        sideDistX = (origin.x - mapX) * deltaDistX;
    } else {
        stepX = 1;
        sideDistX = (mapX + 1.0f - origin.x) * deltaDistX;
    }
    
    if (direction.y < 0.0f) {
        stepY = -1;
        sideDistY = (origin.y - mapY) * deltaDistY;
    } else {
        stepY = 1;
        sideDistY = (mapY + 1.0f - origin.y) * deltaDistY;
    }
    
    // Perform DDA
    bool hitWall = false;
    int side = 0;
    
    while (!hitWall) {
        if (sideDistX < sideDistY) {
            sideDistX += deltaDistX;
            mapX += stepX;
            side = 0;
        } else {
            sideDistY += deltaDistY;
            mapY += stepY;
            side = 1;
        }
        
        if (!map.IsValid(mapX, mapY)) {
            break; // Out of bounds
        }
        
        if (map.IsSolid(mapX, mapY)) {
            hitWall = true;
        }
    }
    
    if (!hitWall) {
        hit.hit = false;
        return hit;
    }
    
    // Calculate distance
    float perpWallDist;
    if (side == 0) {
        perpWallDist = sideDistX - deltaDistX;
    } else {
        perpWallDist = sideDistY - deltaDistY;
    }
    
    if (perpWallDist > maxDistance) {
        hit.hit = false;
        return hit;
    }
    
    // Calculate hit point
    float wallX;
    if (side == 0) {
        wallX = origin.y + perpWallDist * direction.y;
    } else {
        wallX = origin.x + perpWallDist * direction.x;
    }
    wallX -= floorf(wallX);
    
    hit.hit = true;
    hit.distance = perpWallDist;
    hit.mapX = mapX;
    hit.mapY = mapY;
    hit.side = side;
    hit.wallX = wallX;
    hit.hitPoint = Vec2(origin.x + direction.x * perpWallDist, origin.y + direction.y * perpWallDist);
    
    if (map.IsValid(mapX, mapY)) {
        hit.wallType = map.GetTile(mapX, mapY).wallType;
    }
    
    return hit;
}

void Raycaster::RenderFrame(const RaycastCamera& camera, const GridMap& map, int screenWidth, int screenHeight) {
    Renderer2D::BeginFrame();
    
    // Clear screen
    Renderer2D::Clear(s_ceilingColor);
    
    // Draw floor
    uint8_t floorR, floorG, floorB, floorA;
    Renderer2D::GetColor(s_floorColor, floorR, floorG, floorB, floorA);
    
    int floorStart = screenHeight / 2;
    Renderer2D::DrawRect(0, floorStart, screenWidth, screenHeight - floorStart, s_floorColor);
    
    // Cast rays for each column
    for (int x = 0; x < screenWidth; x++) {
        Vec2 rayDir = camera.GetRayDirection((float)x, screenWidth);
        RaycastHit hit = CastRay(camera.GetPosition(), rayDir, map);
        
        if (!hit.hit) {
            continue;
        }
        
        // Calculate line height
        float lineHeight = (float)screenHeight / hit.distance * s_wallHeight;
        int drawStart = (int)(screenHeight / 2.0f - lineHeight / 2.0f);
        int drawEnd = (int)(screenHeight / 2.0f + lineHeight / 2.0f);
        
        if (drawStart < 0) drawStart = 0;
        if (drawEnd >= screenHeight) drawEnd = screenHeight - 1;
        
        // Calculate color based on distance and wall type
        float brightness = 1.0f / (1.0f + hit.distance * 0.15f);
        brightness = std::max(0.15f, std::min(1.0f, brightness));
        
        // Different colors for different wall types
        uint8_t r, g, b;
        switch (hit.wallType) {
            case 0:
            default:
                r = (uint8_t)(80 * brightness);
                g = (uint8_t)(80 * brightness);
                b = (uint8_t)(80 * brightness);
                break;
            case 1:
                r = (uint8_t)(100 * brightness);
                g = (uint8_t)(80 * brightness);
                b = (uint8_t)(60 * brightness);
                break;
            case 2:
                r = (uint8_t)(70 * brightness);
                g = (uint8_t)(70 * brightness);
                b = (uint8_t)(90 * brightness);
                break;
        }
        
        // Darker for y-side walls (creates depth)
        if (hit.side == 1) {
            r = (uint8_t)(r * 0.6f);
            g = (uint8_t)(g * 0.6f);
            b = (uint8_t)(b * 0.6f);
        }
        
        uint32_t color = Renderer2D::Color(r, g, b, 255);
        
        // Draw wall - use texture if available, otherwise use solid color
        uint32_t wallTex = s_wallTextures[hit.wallType];
        if (wallTex != 0) {
            // Draw textured wall
            glEnable(GL_TEXTURE_2D);
            glBindTexture(GL_TEXTURE_2D, wallTex);
            glColor4f(brightness, brightness, brightness, 1.0f);
            
            float texU = hit.wallX; // Where on wall (0-1)
            float texV0 = 0.0f; // Top of texture
            float texV1 = 1.0f; // Bottom of texture
            
            glBegin(GL_QUADS);
            glTexCoord2f(texU, texV0);
            glVertex2i(x, drawStart);
            glTexCoord2f(texU, texV1);
            glVertex2i(x, drawEnd);
            glTexCoord2f(texU + 0.01f, texV1); // Small offset for next pixel
            glVertex2i(x + 1, drawEnd);
            glTexCoord2f(texU + 0.01f, texV0);
            glVertex2i(x + 1, drawStart);
            glEnd();
            
            glDisable(GL_TEXTURE_2D);
        } else {
            // Draw solid color line (fallback)
            Renderer2D::DrawLine((float)x, (float)drawStart, (float)x, (float)drawEnd, color);
        }
    }
    
    Renderer2D::EndFrame();
}

void Raycaster::SetWallTexture(uint8_t wallType, uint32_t textureId) {
    if (wallType < 4) {
        s_wallTextures[wallType] = textureId;
    }
}

uint32_t Raycaster::GetWallTexture(uint8_t wallType) {
    if (wallType < 4) {
        return s_wallTextures[wallType];
    }
    return 0;
}

void Raycaster::RenderSprites(SpriteEntity* sprites, int count, const RaycastCamera& camera, int screenWidth, int screenHeight) {
    SpriteRenderer::RenderSprites(sprites, count, camera, screenWidth, screenHeight);
}

} // namespace Arena
