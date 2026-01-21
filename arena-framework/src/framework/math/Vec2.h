#pragma once
#include <cmath>

namespace Arena {

struct Vec2 {
    float x, y;

    Vec2() : x(0.0f), y(0.0f) {}
    Vec2(float x, float y) : x(x), y(y) {}

    Vec2 operator+(const Vec2& other) const { return Vec2(x + other.x, y + other.y); }
    Vec2 operator-(const Vec2& other) const { return Vec2(x - other.x, y - other.y); }
    Vec2 operator*(float scalar) const { return Vec2(x * scalar, y * scalar); }
    Vec2 operator/(float scalar) const { return Vec2(x / scalar, y / scalar); }

    Vec2& operator+=(const Vec2& other) { x += other.x; y += other.y; return *this; }
    Vec2& operator-=(const Vec2& other) { x -= other.x; y -= other.y; return *this; }
    Vec2& operator*=(float scalar) { x *= scalar; y *= scalar; return *this; }
    Vec2& operator/=(float scalar) { x /= scalar; y /= scalar; return *this; }

    float Dot(const Vec2& other) const { return x * other.x + y * other.y; }
    float LengthSq() const { return x * x + y * y; }
    float Length() const;
    Vec2 Normalized() const;
};

inline float Vec2::Length() const {
    return sqrtf(x * x + y * y);
}

inline Vec2 Vec2::Normalized() const {
    float len = Length();
    if (len > 0.0001f) {
        return Vec2(x / len, y / len);
    }
    return Vec2(0.0f, 0.0f);
}

} // namespace Arena
