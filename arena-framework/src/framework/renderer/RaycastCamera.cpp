#include "RaycastCamera.h"
#include <cmath>

namespace Arena {

RaycastCamera::RaycastCamera()
    : m_position(0.0f, 0.0f)
    , m_rotation(0.0f)
    , m_fov(1.0472f) // ~60 degrees
{
}

void RaycastCamera::MoveForward(float distance) {
    Vec2 dir = GetDirection();
    m_position.x += dir.x * distance;
    m_position.y += dir.y * distance;
}

void RaycastCamera::MoveBackward(float distance) {
    Vec2 dir = GetDirection();
    m_position.x -= dir.x * distance;
    m_position.y -= dir.y * distance;
}

void RaycastCamera::StrafeLeft(float distance) {
    Vec2 right = GetRightVector();
    m_position.x -= right.x * distance;
    m_position.y -= right.y * distance;
}

void RaycastCamera::StrafeRight(float distance) {
    Vec2 right = GetRightVector();
    m_position.x += right.x * distance;
    m_position.y += right.y * distance;
}

void RaycastCamera::Rotate(float angle) {
    m_rotation += angle;
    // Normalize rotation to [0, 2*PI)
    while (m_rotation < 0.0f) m_rotation += 2.0f * 3.14159f;
    while (m_rotation >= 2.0f * 3.14159f) m_rotation -= 2.0f * 3.14159f;
}

Vec2 RaycastCamera::GetDirection() const {
    return Vec2(cosf(m_rotation), sinf(m_rotation));
}

Vec2 RaycastCamera::GetRightVector() const {
    // Right vector is direction rotated 90 degrees counter-clockwise
    return Vec2(-sinf(m_rotation), cosf(m_rotation));
}

Vec2 RaycastCamera::GetRayDirection(float screenX, int screenWidth) const {
    // Calculate camera plane (perpendicular to direction)
    Vec2 plane = GetRightVector();
    
    // Calculate ray position on camera plane
    float cameraX = 2.0f * screenX / screenWidth - 1.0f; // -1 to 1
    Vec2 rayDir = GetDirection() + plane * (cameraX * tanf(m_fov * 0.5f));
    
    return rayDir.Normalized();
}

} // namespace Arena
