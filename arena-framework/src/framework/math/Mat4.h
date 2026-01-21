#pragma once
#include "Vec3.h"
#include "Vec4.h"

namespace Arena {

struct Mat4 {
    float m[16]; // Column-major order

    Mat4();
    Mat4(float diagonal);
    static Mat4 Identity();
    static Mat4 Zero();

    Mat4 operator*(const Mat4& other) const;
    Vec4 operator*(const Vec4& v) const;

    float& operator[](int index) { return m[index]; }
    const float& operator[](int index) const { return m[index]; }

    Mat4 Transposed() const;
    Mat4 Inverted() const;

    static Mat4 Perspective(float fov, float aspect, float near, float far);
    static Mat4 Orthographic(float left, float right, float bottom, float top, float near, float far);
    static Mat4 LookAt(const Vec3& eye, const Vec3& target, const Vec3& up);
    static Mat4 Translate(const Vec3& translation);
    static Mat4 Rotate(float angle, const Vec3& axis);
    static Mat4 Scale(const Vec3& scale);
};

} // namespace Arena
