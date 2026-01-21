#pragma once
#include <cstdint>

namespace Arena {

struct Sprite {
    uint32_t textureId;
    int width;
    int height;
    float u0, v0; // Top-left UV
    float u1, v1; // Bottom-right UV
    
    Sprite() : textureId(0), width(0), height(0), u0(0.0f), v0(0.0f), u1(1.0f), v1(1.0f) {}
    Sprite(uint32_t texId, int w, int h) 
        : textureId(texId), width(w), height(h), u0(0.0f), v0(0.0f), u1(1.0f), v1(1.0f) {}
};

class SpriteBatch {
public:
    static void Init();
    static void Shutdown();
    
    static void Begin();
    static void End();
    
    static void DrawSprite(const Sprite& sprite, float x, float y, float scaleX = 1.0f, float scaleY = 1.0f);
    static void DrawSpriteRotated(const Sprite& sprite, float x, float y, float angle, float scaleX = 1.0f, float scaleY = 1.0f);
    
private:
    static bool s_initialized;
    static uint32_t s_quadVBO;
    static uint32_t s_quadVAO;
};

} // namespace Arena
