#pragma once
#include "framework/math/Vec2.h"
#include "framework/math/Vec3.h"

namespace Arena {

class RaycastCamera {
public:
    RaycastCamera();
    
    void SetPosition(const Vec2& pos) { m_position = pos; }
    void SetPosition(float x, float y) { m_position = Vec2(x, y); }
    const Vec2& GetPosition() const { return m_position; }
    
    void SetRotation(float angle) { m_rotation = angle; }
    float GetRotation() const { return m_rotation; }
    
    void SetFieldOfView(float fov) { m_fov = fov; }
    float GetFieldOfView() const { return m_fov; }
    
    // Movement
    void MoveForward(float distance);
    void MoveBackward(float distance);
    void StrafeLeft(float distance);
    void StrafeRight(float distance);
    void Rotate(float angle);
    
    // Ray calculation
    Vec2 GetDirection() const;
    Vec2 GetRightVector() const;
    
    // For raycasting
    Vec2 GetRayDirection(float screenX, int screenWidth) const;

private:
    Vec2 m_position;
    float m_rotation; // Angle in radians
    float m_fov; // Field of view in radians
};

} // namespace Arena
