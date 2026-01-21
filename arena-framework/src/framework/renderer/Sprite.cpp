#include "Sprite.h"
#include <SDL2/SDL_opengl.h>

namespace Arena {

bool SpriteBatch::s_initialized = false;
uint32_t SpriteBatch::s_quadVBO = 0;
uint32_t SpriteBatch::s_quadVAO = 0;

void SpriteBatch::Init() {
    if (s_initialized) return;
    
    // For now, we'll use immediate mode rendering
    // VBO/VAO setup can be added later if needed for optimization
    s_initialized = true;
}

void SpriteBatch::Shutdown() {
    s_initialized = false;
}

void SpriteBatch::Begin() {
    // Setup for 2D rendering
    glMatrixMode(GL_PROJECTION);
    glPushMatrix();
    glLoadIdentity();
    
    // Get viewport dimensions
    GLint viewport[4];
    glGetIntegerv(GL_VIEWPORT, viewport);
    glOrtho(0, viewport[2], viewport[3], 0, -1, 1);
    
    glMatrixMode(GL_MODELVIEW);
    glPushMatrix();
    glLoadIdentity();
    
    glDisable(GL_DEPTH_TEST);
    glEnable(GL_TEXTURE_2D);
    glEnable(GL_BLEND);
    glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
}

void SpriteBatch::End() {
    glDisable(GL_BLEND);
    glDisable(GL_TEXTURE_2D);
    glEnable(GL_DEPTH_TEST);
    
    glMatrixMode(GL_MODELVIEW);
    glPopMatrix();
    
    glMatrixMode(GL_PROJECTION);
    glPopMatrix();
}

void SpriteBatch::DrawSprite(const Sprite& sprite, float x, float y, float scaleX, float scaleY) {
    float w = sprite.width * scaleX;
    float h = sprite.height * scaleY;
    
    glBindTexture(GL_TEXTURE_2D, sprite.textureId);
    glBegin(GL_QUADS);
    
    glTexCoord2f(sprite.u0, sprite.v0);
    glVertex2f(x, y);
    
    glTexCoord2f(sprite.u1, sprite.v0);
    glVertex2f(x + w, y);
    
    glTexCoord2f(sprite.u1, sprite.v1);
    glVertex2f(x + w, y + h);
    
    glTexCoord2f(sprite.u0, sprite.v1);
    glVertex2f(x, y + h);
    
    glEnd();
}

void SpriteBatch::DrawSpriteRotated(const Sprite& sprite, float x, float y, float angle, float scaleX, float scaleY) {
    // Simple rotation around center
    float cx = x + sprite.width * scaleX * 0.5f;
    float cy = y + sprite.height * scaleY * 0.5f;
    
    glPushMatrix();
    glTranslatef(cx, cy, 0.0f);
    glRotatef(angle * 57.2958f, 0.0f, 0.0f, 1.0f); // Convert radians to degrees
    glTranslatef(-cx, -cy, 0.0f);
    
    DrawSprite(sprite, x, y, scaleX, scaleY);
    
    glPopMatrix();
}

} // namespace Arena
