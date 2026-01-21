#pragma once
#include "framework/math/Vec2.h"
#include "framework/renderer/RaycastCamera.h"
#include "framework/core/Input.h"
#include "game/world/Collision.h"
#include "Actor.h"
#include <cstdint>

namespace Arena {
    class GridMap;
    class ChunkManager;

class Player {
public:
    Player();
    
    // Update with ChunkManager (for streaming worlds)
    void Update(float deltaTime, const ChunkManager& world);
    // Update with GridMap (for simple maps)
    void Update(float deltaTime, const GridMap& map);
    
    // Movement
    void HandleInput(const InputState& input, float deltaTime, const ChunkManager& world);
    void HandleInput(const InputState& input, float deltaTime, const GridMap& map);
    void Move(const Vec2& direction, float deltaTime, const ChunkManager& world);
    void Move(const Vec2& direction, float deltaTime, const GridMap& map);
    
    // Camera
    RaycastCamera& GetCamera() { return m_camera; }
    const RaycastCamera& GetCamera() const { return m_camera; }
    
    // Position
    const Vec2& GetPosition() const { return m_position; }
    void SetPosition(const Vec2& pos);
    
    // Stats
    Stats& GetStats() { return m_stats; }
    const Stats& GetStats() const { return m_stats; }
    
    // Interaction
    void Interact(const ChunkManager& world);
    void Interact(const GridMap& map);
    bool CanInteract() const { return m_interactionCooldown <= 0.0f; }
    
    // Mouse look
    void HandleMouseLook(float deltaX, float deltaY);

private:
    RaycastCamera m_camera;
    Vec2 m_position;
    Stats m_stats;
    float m_moveSpeed;
    float m_runMultiplier;
    bool m_isRunning;
    float m_interactionCooldown;
    float m_interactionRange;
};

} // namespace Arena
