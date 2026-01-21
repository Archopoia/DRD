#pragma once
#include <cmath>

namespace Arena {

struct Vec4 {
    float x, y, z, w;

    Vec4() : x(0.0f), y(0.0f), z(0.0f), w(0.0f) {}
    Vec4(float x, float y, float z, float w) : x(x), y(y), z(z), w(w) {}
    Vec4(const Vec3& v, float w) : x(v.x), y(v.y), z(v.z), w(w) {}

    Vec4 operator+(const Vec4& other) const { return Vec4(x + other.x, y + other.y, z + other.z, w + other.w); }
    Vec4 operator-(const Vec4& other) const { return Vec4(x - other.x, y - other.y, z - other.z, w - other.w); }
    Vec4 operator*(float scalar) const { return Vec4(x * scalar, y * scalar, z * scalar, w * scalar); }
    Vec4 operator/(float scalar) const { return Vec4(x / scalar, y / scalar, z / scalar, w / scalar); }

    Vec4& operator+=(const Vec4& other) { x += other.x; y += other.y; z += other.z; w += other.w; return *this; }
    Vec4& operator-=(const Vec4& other) { x -= other.x; y -= other.y; z -= other.z; w -= other.w; return *this; }
    Vec4& operator*=(float scalar) { x *= scalar; y *= scalar; z *= scalar; w *= scalar; return *this; }
    Vec4& operator/=(float scalar) { x /= scalar; y /= scalar; z /= scalar; w /= scalar; return *this; }

    float Dot(const Vec4& other) const { return x * other.x + y * other.y + z * other.z + w * other.w; }
    float LengthSq() const { return x * x + y * y + z * z + w * w; }
    float Length() const;
    Vec4 Normalized() const;
};

inline float Vec4::Length() const {
    return sqrtf(x * x + y * y + z * z + w * w);
}

inline Vec4 Vec4::Normalized() const {
    float len = Length();
    if (len > 0.0001f) {
        return Vec4(x / len, y / len, z / len, w / len);
    }
    return Vec4(0.0f, 0.0f, 0.0f, 0.0f);
}

} // namespace Arena
