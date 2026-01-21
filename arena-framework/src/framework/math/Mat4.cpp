#include "Mat4.h"
#include <cmath>
#include <cstring>

namespace Arena {

Mat4::Mat4() {
    memset(m, 0, sizeof(m));
}

Mat4::Mat4(float diagonal) {
    memset(m, 0, sizeof(m));
    m[0] = m[5] = m[10] = m[15] = diagonal;
}

Mat4 Mat4::Identity() {
    Mat4 result;
    result.m[0] = result.m[5] = result.m[10] = result.m[15] = 1.0f;
    return result;
}

Mat4 Mat4::Zero() {
    return Mat4(0.0f);
}

Mat4 Mat4::operator*(const Mat4& other) const {
    Mat4 result;
    for (int i = 0; i < 4; i++) {
        for (int j = 0; j < 4; j++) {
            result.m[i * 4 + j] = 0.0f;
            for (int k = 0; k < 4; k++) {
                result.m[i * 4 + j] += m[i * 4 + k] * other.m[k * 4 + j];
            }
        }
    }
    return result;
}

Vec4 Mat4::operator*(const Vec4& v) const {
    return Vec4(
        m[0] * v.x + m[4] * v.y + m[8] * v.z + m[12] * v.w,
        m[1] * v.x + m[5] * v.y + m[9] * v.z + m[13] * v.w,
        m[2] * v.x + m[6] * v.y + m[10] * v.z + m[14] * v.w,
        m[3] * v.x + m[7] * v.y + m[11] * v.z + m[15] * v.w
    );
}

Mat4 Mat4::Transposed() const {
    Mat4 result;
    for (int i = 0; i < 4; i++) {
        for (int j = 0; j < 4; j++) {
            result.m[i * 4 + j] = m[j * 4 + i];
        }
    }
    return result;
}

Mat4 Mat4::Inverted() const {
    // Simple inversion for common cases (identity, translation, scale)
    // For full inversion, use more complex algorithm if needed
    Mat4 result = Identity();
    // TODO: Implement full matrix inversion if needed
    return result;
}

Mat4 Mat4::Perspective(float fov, float aspect, float near, float far) {
    Mat4 result = Zero();
    float f = 1.0f / tanf(fov * 0.5f);
    
    result.m[0] = f / aspect;
    result.m[5] = f;
    result.m[10] = (far + near) / (near - far);
    result.m[11] = -1.0f;
    result.m[14] = (2.0f * far * near) / (near - far);
    
    return result;
}

Mat4 Mat4::Orthographic(float left, float right, float bottom, float top, float near, float far) {
    Mat4 result = Identity();
    
    result.m[0] = 2.0f / (right - left);
    result.m[5] = 2.0f / (top - bottom);
    result.m[10] = -2.0f / (far - near);
    result.m[12] = -(right + left) / (right - left);
    result.m[13] = -(top + bottom) / (top - bottom);
    result.m[14] = -(far + near) / (far - near);
    
    return result;
}

Mat4 Mat4::LookAt(const Vec3& eye, const Vec3& target, const Vec3& up) {
    Vec3 f = (target - eye).Normalized();
    Vec3 s = f.Cross(up).Normalized();
    Vec3 u = s.Cross(f);
    
    Mat4 result = Identity();
    result.m[0] = s.x;
    result.m[4] = s.y;
    result.m[8] = s.z;
    result.m[1] = u.x;
    result.m[5] = u.y;
    result.m[9] = u.z;
    result.m[2] = -f.x;
    result.m[6] = -f.y;
    result.m[10] = -f.z;
    result.m[12] = -s.Dot(eye);
    result.m[13] = -u.Dot(eye);
    result.m[14] = f.Dot(eye);
    
    return result;
}

Mat4 Mat4::Translate(const Vec3& translation) {
    Mat4 result = Identity();
    result.m[12] = translation.x;
    result.m[13] = translation.y;
    result.m[14] = translation.z;
    return result;
}

Mat4 Mat4::Rotate(float angle, const Vec3& axis) {
    Mat4 result = Identity();
    float c = cosf(angle);
    float s = sinf(angle);
    float t = 1.0f - c;
    Vec3 n = axis.Normalized();
    
    result.m[0] = t * n.x * n.x + c;
    result.m[1] = t * n.x * n.y + s * n.z;
    result.m[2] = t * n.x * n.z - s * n.y;
    result.m[4] = t * n.x * n.y - s * n.z;
    result.m[5] = t * n.y * n.y + c;
    result.m[6] = t * n.y * n.z + s * n.x;
    result.m[8] = t * n.x * n.z + s * n.y;
    result.m[9] = t * n.y * n.z - s * n.x;
    result.m[10] = t * n.z * n.z + c;
    
    return result;
}

Mat4 Mat4::Scale(const Vec3& scale) {
    Mat4 result = Identity();
    result.m[0] = scale.x;
    result.m[5] = scale.y;
    result.m[10] = scale.z;
    return result;
}

} // namespace Arena
