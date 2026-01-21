#include "Player.h"
#include "framework/core/Input.h"
#include "framework/utils/Log.h"
#include "framework/renderer/Raycaster.h"
#include "game/world/GridMap.h"
#include "game/world/Door.h"
#include <SDL2/SDL.h>
#include <cmath>

namespace Arena {

Player::Player()
    : m_moveSpeed(3.0f)
    , m_runMultiplier(2.0f)
    , m_isRunning(false)
    , m_interactionCooldown(0.0f)
    , m_interactionRange(2.0f)
{
    m_position = Vec2(5.0f, 5.0f);
    m_camera.SetPosition(m_position);
    m_camera.SetRotation(0.0f);
}

void Player::SetPosition(const Vec2& pos) {
    m_position = pos;
    m_camera.SetPosition(pos);
}

void Player::Update(float deltaTime, const ChunkManager& world) {
    // Update interaction cooldown
    if (m_interactionCooldown > 0.0f) {
        m_interactionCooldown -= deltaTime;
    }
    
    // Handle input
    const InputState& input = Input::GetState();
    HandleInput(input, deltaTime, world);
    
    // Update camera position
    m_camera.SetPosition(m_position);
}

void Player::Update(float deltaTime, const GridMap& map) {
    // Update interaction cooldown
    if (m_interactionCooldown > 0.0f) {
        m_interactionCooldown -= deltaTime;
    }
    
    // Handle input
    const InputState& input = Input::GetState();
    HandleInput(input, deltaTime, map);
    
    // Update camera position
    m_camera.SetPosition(m_position);
}

void Player::HandleInput(const InputState& input, float deltaTime, const ChunkManager& world) {
    // Movement
    Vec2 moveDir(0.0f, 0.0f);
    
    if (Input::IsKeyDown(SDLK_w)) {
        moveDir = moveDir + m_camera.GetDirection();
    }
    if (Input::IsKeyDown(SDLK_s)) {
        moveDir = moveDir - m_camera.GetDirection();
    }
    if (Input::IsKeyDown(SDLK_a)) {
        moveDir = moveDir - m_camera.GetRightVector();
    }
    if (Input::IsKeyDown(SDLK_d)) {
        moveDir = moveDir + m_camera.GetRightVector();
    }
    
    // Running
    m_isRunning = Input::IsKeyDown(SDLK_LSHIFT) || Input::IsKeyDown(SDLK_RSHIFT);
    
    // Normalize and move
    if (moveDir.LengthSq() > 0.0001f) {
        moveDir = moveDir.Normalized();
        float speed = m_moveSpeed;
        if (m_isRunning) {
            speed *= m_runMultiplier;
        }
        Move(moveDir * speed, deltaTime, world);
    }
    
    // Mouse look (only if relative mouse mode is enabled)
    if (SDL_GetRelativeMouseMode()) {
        float mouseDeltaX, mouseDeltaY;
        Input::GetMouseDelta(mouseDeltaX, mouseDeltaY);
        HandleMouseLook(mouseDeltaX, mouseDeltaY);
    }
    
    // Interaction
    if (Input::IsKeyPressed(SDLK_e) && CanInteract()) {
        Interact(world);
    }
}

void Player::HandleInput(const InputState& input, float deltaTime, const GridMap& map) {
    // Normal gameplay mode
    Vec2 moveDir(0.0f, 0.0f);
    
    if (Input::IsKeyDown(SDLK_w)) {
        moveDir = moveDir + m_camera.GetDirection();
    }
    if (Input::IsKeyDown(SDLK_s)) {
        moveDir = moveDir - m_camera.GetDirection();
    }
    if (Input::IsKeyDown(SDLK_a)) {
        moveDir = moveDir - m_camera.GetRightVector();
    }
    if (Input::IsKeyDown(SDLK_d)) {
        moveDir = moveDir + m_camera.GetRightVector();
    }
    
    // Running
    m_isRunning = Input::IsKeyDown(SDLK_LSHIFT) || Input::IsKeyDown(SDLK_RSHIFT);
    
    // Normalize and move
    if (moveDir.LengthSq() > 0.0001f) {
        moveDir = moveDir.Normalized();
        float speed = m_moveSpeed;
        if (m_isRunning) {
            speed *= m_runMultiplier;
        }
        Move(moveDir * speed, deltaTime, map);
    }
    
    // Mouse look (only if relative mouse mode is enabled)
    if (SDL_GetRelativeMouseMode()) {
        float mouseDeltaX, mouseDeltaY;
        Input::GetMouseDelta(mouseDeltaX, mouseDeltaY);
        HandleMouseLook(mouseDeltaX, mouseDeltaY);
    }
    
    // Interaction
    if (Input::IsKeyPressed(SDLK_e) && CanInteract()) {
        Interact(map);
    }
}

void Player::Move(const Vec2& direction, float deltaTime, const ChunkManager& world) {
    Vec2 desiredPos = m_position + direction * deltaTime;
    m_position = Collision::MoveWithCollision(world, m_position, desiredPos, 0.3f);
}

void Player::Move(const Vec2& direction, float deltaTime, const GridMap& map) {
    Vec2 desiredPos = m_position + direction * deltaTime;
    m_position = Collision::MoveWithCollision(map, m_position, desiredPos, 0.3f);
}

void Player::HandleMouseLook(float deltaX, float deltaY) {
    float sensitivity = 0.002f;
    m_camera.Rotate(-deltaX * sensitivity);
    
    // Note: For full 3D, you'd also handle pitch (up/down)
    // For 2.5D raycaster, we only handle yaw (left/right)
}

void Player::Interact(const ChunkManager& world) {
    Vec2 direction = m_camera.GetDirection();
    Vec2 origin = m_position;
    
    Collision::InteractionHit hit = Collision::RaycastInteraction(world, origin, direction, m_interactionRange);
    
    if (hit.hit) {
        // Check what we hit (door, item, etc.)
        // For now, just log
        Log::Info("Interacted with tile at (%d, %d)", hit.tileX, hit.tileY);
        
        m_interactionCooldown = 0.5f; // Prevent spam
    }
}

void Player::Interact(const GridMap& map) {
    Vec2 direction = m_camera.GetDirection();
    Vec2 origin = m_position;
    
    // Cast ray to find what we're looking at
    RaycastHit hit = Raycaster::CastRay(origin, direction, map, m_interactionRange);
    
    if (hit.hit) {
        // Check for door at this position
        Door* door = const_cast<GridMap&>(map).GetDoorAt(hit.mapX, hit.mapY);
        if (door) {
            // Try to open/close door
            if (DoorSystem::IsOpen(*door)) {
                DoorSystem::Close(*door);
                Log::Info("Closed door at (%d, %d)", hit.mapX, hit.mapY);
            } else if (DoorSystem::CanOpen(*door)) {
                // Check if locked (for now, assume no key needed - can add inventory check later)
                int keyId = 0; // TODO: Get from inventory
                if (DoorSystem::TryOpen(*door, keyId)) {
                    Log::Info("Opened door at (%d, %d)", hit.mapX, hit.mapY);
                } else {
                    Log::Info("Door is locked at (%d, %d)", hit.mapX, hit.mapY);
                }
            } else if (DoorSystem::IsLocked(*door)) {
                Log::Info("Door is locked at (%d, %d)", hit.mapX, hit.mapY);
            }
            
            m_interactionCooldown = 0.5f; // Prevent spam
        } else {
            // Other interactions (items, etc.) can be added here
            Log::Info("Interacted with tile at (%d, %d)", hit.mapX, hit.mapY);
            m_interactionCooldown = 0.5f;
        }
    }
}

} // namespace Arena
