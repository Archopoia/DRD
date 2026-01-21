#pragma once
#include "framework/math/Vec2.h"
#include "GridMap.h"
#include "Chunk.h"

namespace Arena {

class Collision {
public:
    // Check if a point is solid
    static bool IsPointSolid(const GridMap& map, float x, float y);
    static bool IsPointSolid(const ChunkManager& chunks, float x, float y);
    
    // Check if a circle collides
    static bool IsCircleColliding(const GridMap& map, float x, float y, float radius);
    static bool IsCircleColliding(const ChunkManager& chunks, float x, float y, float radius);
    
    // Move with collision (sliding)
    static Vec2 MoveWithCollision(const GridMap& map, const Vec2& from, const Vec2& to, float radius);
    static Vec2 MoveWithCollision(const ChunkManager& chunks, const Vec2& from, const Vec2& to, float radius);
    
    // Raycast for interaction (doors, items)
    struct InteractionHit {
        Vec2 hitPoint;
        float distance;
        int tileX, tileY;
        bool hit;
        
        InteractionHit() : hit(false), distance(0.0f), tileX(0), tileY(0) {}
    };
    
    static InteractionHit RaycastInteraction(const GridMap& map, const Vec2& origin, const Vec2& direction, float maxDistance = 2.0f);
    static InteractionHit RaycastInteraction(const ChunkManager& chunks, const Vec2& origin, const Vec2& direction, float maxDistance = 2.0f);
};

} // namespace Arena
