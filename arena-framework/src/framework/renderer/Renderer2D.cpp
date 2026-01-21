#include "Renderer2D.h"
#include <SDL2/SDL_opengl.h>
#include <cmath>

namespace Arena {

bool Renderer2D::s_initialized = false;
int Renderer2D::s_viewportX = 0;
int Renderer2D::s_viewportY = 0;
int Renderer2D::s_viewportWidth = 0;
int Renderer2D::s_viewportHeight = 0;

void Renderer2D::Init(int width, int height) {
    if (s_initialized) return;
    
    s_viewportWidth = width;
    s_viewportHeight = height;
    s_viewportX = 0;
    s_viewportY = 0;
    
    glViewport(0, 0, width, height);
    
    s_initialized = true;
}

void Renderer2D::Shutdown() {
    s_initialized = false;
}

void Renderer2D::BeginFrame() {
    glDisable(GL_DEPTH_TEST);
    glMatrixMode(GL_PROJECTION);
    glPushMatrix();
    glLoadIdentity();
    glOrtho(0, s_viewportWidth, s_viewportHeight, 0, -1, 1);
    
    glMatrixMode(GL_MODELVIEW);
    glPushMatrix();
    glLoadIdentity();
}

void Renderer2D::EndFrame() {
    glMatrixMode(GL_MODELVIEW);
    glPopMatrix();
    
    glMatrixMode(GL_PROJECTION);
    glPopMatrix();
    
    glEnable(GL_DEPTH_TEST);
}

uint32_t Renderer2D::Color(uint8_t r, uint8_t g, uint8_t b, uint8_t a) {
    return (a << 24) | (b << 16) | (g << 8) | r;
}

void Renderer2D::GetColor(uint32_t color, uint8_t& r, uint8_t& g, uint8_t& b, uint8_t& a) {
    r = (color >> 0) & 0xFF;
    g = (color >> 8) & 0xFF;
    b = (color >> 16) & 0xFF;
    a = (color >> 24) & 0xFF;
}

void Renderer2D::SetViewport(int x, int y, int width, int height) {
    s_viewportX = x;
    s_viewportY = y;
    s_viewportWidth = width;
    s_viewportHeight = height;
    glViewport(x, y, width, height);
}

void Renderer2D::GetViewport(int& x, int& y, int& width, int& height) {
    x = s_viewportX;
    y = s_viewportY;
    width = s_viewportWidth;
    height = s_viewportHeight;
}

void Renderer2D::Clear(uint32_t color) {
    uint8_t r, g, b, a;
    GetColor(color, r, g, b, a);
    glClearColor(r / 255.0f, g / 255.0f, b / 255.0f, a / 255.0f);
    glClear(GL_COLOR_BUFFER_BIT);
}

void Renderer2D::DrawPixel(int x, int y, uint32_t color) {
    uint8_t r, g, b, a;
    GetColor(color, r, g, b, a);
    
    glDisable(GL_TEXTURE_2D);
    glColor4ub(r, g, b, a);
    glBegin(GL_POINTS);
    glVertex2i(x, y);
    glEnd();
}

void Renderer2D::DrawLine(float x0, float y0, float x1, float y1, uint32_t color) {
    uint8_t r, g, b, a;
    GetColor(color, r, g, b, a);
    
    glDisable(GL_TEXTURE_2D);
    glColor4ub(r, g, b, a);
    glBegin(GL_LINES);
    glVertex2f(x0, y0);
    glVertex2f(x1, y1);
    glEnd();
}

void Renderer2D::DrawRect(float x, float y, float width, float height, uint32_t color, bool filled) {
    uint8_t r, g, b, a;
    GetColor(color, r, g, b, a);
    
    glDisable(GL_TEXTURE_2D);
    glColor4ub(r, g, b, a);
    
    if (filled) {
        glBegin(GL_QUADS);
    } else {
        glBegin(GL_LINE_LOOP);
    }
    
    glVertex2f(x, y);
    glVertex2f(x + width, y);
    glVertex2f(x + width, y + height);
    glVertex2f(x, y + height);
    
    glEnd();
}

void Renderer2D::DrawCircle(float x, float y, float radius, uint32_t color, bool filled) {
    uint8_t r, g, b, a;
    GetColor(color, r, g, b, a);
    
    glDisable(GL_TEXTURE_2D);
    glColor4ub(r, g, b, a);
    
    const int segments = 32;
    const float angleStep = 2.0f * 3.14159f / segments;
    
    if (filled) {
        glBegin(GL_TRIANGLE_FAN);
        glVertex2f(x, y); // Center
        for (int i = 0; i <= segments; i++) {
            float angle = i * angleStep;
            glVertex2f(x + cosf(angle) * radius, y + sinf(angle) * radius);
        }
    } else {
        glBegin(GL_LINE_LOOP);
        for (int i = 0; i < segments; i++) {
            float angle = i * angleStep;
            glVertex2f(x + cosf(angle) * radius, y + sinf(angle) * radius);
        }
    }
    
    glEnd();
}

} // namespace Arena
