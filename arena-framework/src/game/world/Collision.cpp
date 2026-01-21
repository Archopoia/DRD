#include "Collision.h"
#include <cmath>
#include <algorithm>

namespace Arena {

bool Collision::IsPointSolid(const GridMap& map, float x, float y) {
    int tileX = (int)floorf(x);
    int tileY = (int)floorf(y);
    return map.IsSolid(tileX, tileY);
}

bool Collision::IsPointSolid(const ChunkManager& chunks, float x, float y) {
    return chunks.IsSolidAtWorldPos(x, y);
}

bool Collision::IsCircleColliding(const GridMap& map, float x, float y, float radius) {
    // Check corners and center
    float checkPoints[5][2] = {
        {x, y}, // Center
        {x - radius, y - radius}, // Top-left
        {x + radius, y - radius}, // Top-right
        {x - radius, y + radius}, // Bottom-left
        {x + radius, y + radius}  // Bottom-right
    };
    
    for (int i = 0; i < 5; i++) {
        if (IsPointSolid(map, checkPoints[i][0], checkPoints[i][1])) {
            return true;
        }
    }
    
    return false;
}

bool Collision::IsCircleColliding(const ChunkManager& chunks, float x, float y, float radius) {
    float checkPoints[5][2] = {
        {x, y},
        {x - radius, y - radius},
        {x + radius, y - radius},
        {x - radius, y + radius},
        {x + radius, y + radius}
    };
    
    for (int i = 0; i < 5; i++) {
        if (IsPointSolid(chunks, checkPoints[i][0], checkPoints[i][1])) {
            return true;
        }
    }
    
    return false;
}

Vec2 Collision::MoveWithCollision(const GridMap& map, const Vec2& from, const Vec2& to, float radius) {
    Vec2 result = to;
    
    // Try X movement first
    Vec2 testX(to.x, from.y);
    if (!IsCircleColliding(map, testX.x, testX.y, radius)) {
        result.x = to.x;
    } else {
        result.x = from.x;
    }
    
    // Try Y movement
    Vec2 testY(result.x, to.y);
    if (!IsCircleColliding(map, testY.x, testY.y, radius)) {
        result.y = to.y;
    } else {
        result.y = from.y;
    }
    
    return result;
}

Vec2 Collision::MoveWithCollision(const ChunkManager& chunks, const Vec2& from, const Vec2& to, float radius) {
    Vec2 result = to;
    
    Vec2 testX(to.x, from.y);
    if (!IsCircleColliding(chunks, testX.x, testX.y, radius)) {
        result.x = to.x;
    } else {
        result.x = from.x;
    }
    
    Vec2 testY(result.x, to.y);
    if (!IsCircleColliding(chunks, testY.x, testY.y, radius)) {
        result.y = to.y;
    } else {
        result.y = from.y;
    }
    
    return result;
}

Collision::InteractionHit Collision::RaycastInteraction(const GridMap& map, const Vec2& origin, const Vec2& direction, float maxDistance) {
    InteractionHit hit;
    
    // Simple DDA raycast
    Vec2 dir = direction.Normalized();
    float stepSize = 0.1f;
    float distance = 0.0f;
    
    Vec2 current = origin;
    
    while (distance < maxDistance) {
        int tileX = (int)floorf(current.x);
        int tileY = (int)floorf(current.y);
        
        if (!map.IsValid(tileX, tileY)) {
            break;
        }
        
        if (map.IsSolid(tileX, tileY)) {
            hit.hit = true;
            hit.hitPoint = current;
            hit.distance = distance;
            hit.tileX = tileX;
            hit.tileY = tileY;
            break;
        }
        
        current.x += dir.x * stepSize;
        current.y += dir.y * stepSize;
        distance += stepSize;
    }
    
    return hit;
}

Collision::InteractionHit Collision::RaycastInteraction(const ChunkManager& chunks, const Vec2& origin, const Vec2& direction, float maxDistance) {
    InteractionHit hit;
    
    Vec2 dir = direction.Normalized();
    float stepSize = 0.1f;
    float distance = 0.0f;
    
    Vec2 current = origin;
    
    while (distance < maxDistance) {
        if (chunks.IsSolidAtWorldPos(current.x, current.y)) {
            hit.hit = true;
            hit.hitPoint = current;
            hit.distance = distance;
            hit.tileX = (int)floorf(current.x);
            hit.tileY = (int)floorf(current.y);
            break;
        }
        
        current.x += dir.x * stepSize;
        current.y += dir.y * stepSize;
        distance += stepSize;
    }
    
    return hit;
}

} // namespace Arena
