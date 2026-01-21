#pragma once
#include <cmath>

namespace Arena {

struct Vec3 {
    float x, y, z;

    Vec3() : x(0.0f), y(0.0f), z(0.0f) {}
    Vec3(float x, float y, float z) : x(x), y(y), z(z) {}

    Vec3 operator+(const Vec3& other) const { return Vec3(x + other.x, y + other.y, z + other.z); }
    Vec3 operator-(const Vec3& other) const { return Vec3(x - other.x, y - other.y, z - other.z); }
    Vec3 operator*(float scalar) const { return Vec3(x * scalar, y * scalar, z * scalar); }
    Vec3 operator/(float scalar) const { return Vec3(x / scalar, y / scalar, z / scalar); }

    Vec3& operator+=(const Vec3& other) { x += other.x; y += other.y; z += other.z; return *this; }
    Vec3& operator-=(const Vec3& other) { x -= other.x; y -= other.y; z -= other.z; return *this; }
    Vec3& operator*=(float scalar) { x *= scalar; y *= scalar; z *= scalar; return *this; }
    Vec3& operator/=(float scalar) { x /= scalar; y /= scalar; z /= scalar; return *this; }

    float Dot(const Vec3& other) const { return x * other.x + y * other.y + z * other.z; }
    Vec3 Cross(const Vec3& other) const {
        return Vec3(
            y * other.z - z * other.y,
            z * other.x - x * other.z,
            x * other.y - y * other.x
        );
    }
    float LengthSq() const { return x * x + y * y + z * z; }
    float Length() const;
    Vec3 Normalized() const;
};

inline float Vec3::Length() const {
    return sqrtf(x * x + y * y + z * z);
}

inline Vec3 Vec3::Normalized() const {
    float len = Length();
    if (len > 0.0001f) {
        return Vec3(x / len, y / len, z / len);
    }
    return Vec3(0.0f, 0.0f, 0.0f);
}

} // namespace Arena
