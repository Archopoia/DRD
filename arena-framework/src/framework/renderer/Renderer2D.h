#pragma once
#include "framework/math/Vec2.h"
#include "framework/math/Vec3.h"
#include <cstdint>

namespace Arena {

class Renderer2D {
public:
    static void Init(int width, int height);
    static void Shutdown();
    
    static void BeginFrame();
    static void EndFrame();
    
    // Primitive drawing
    static void DrawPixel(int x, int y, uint32_t color);
    static void DrawLine(float x0, float y0, float x1, float y1, uint32_t color);
    static void DrawRect(float x, float y, float width, float height, uint32_t color, bool filled = true);
    static void DrawCircle(float x, float y, float radius, uint32_t color, bool filled = true);
    
    // Color utilities
    static uint32_t Color(uint8_t r, uint8_t g, uint8_t b, uint8_t a = 255);
    static void GetColor(uint32_t color, uint8_t& r, uint8_t& g, uint8_t& b, uint8_t& a);
    
    // Viewport
    static void SetViewport(int x, int y, int width, int height);
    static void GetViewport(int& x, int& y, int& width, int& height);
    
    // Clear
    static void Clear(uint32_t color);
    
private:
    static bool s_initialized;
    static int s_viewportX, s_viewportY, s_viewportWidth, s_viewportHeight;
};

} // namespace Arena
