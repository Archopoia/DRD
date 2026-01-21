#include "Font.h"
#include "framework/utils/Log.h"
#define WIN32_LEAN_AND_MEAN
#include <SDL2/SDL_opengl.h>
#undef DrawText  // Undefine Windows macro if present
#include <cstring>
#include <cstdio>

namespace Arena {

Font::Font() 
    : m_textureId(0)
    , m_fontSize(16)
    , m_atlasWidth(256)
    , m_atlasHeight(256)
{
    memset(m_glyphs, 0, sizeof(m_glyphs));
}

Font::~Font() {
    Free();
}

void Font::Free() {
    if (m_textureId != 0) {
        glDeleteTextures(1, &m_textureId);
        m_textureId = 0;
    }
}

bool Font::Load(const char* path, int fontSize) {
    // For now, generate a simple bitmap font
    // In a real implementation, you'd load a TTF/OTF font and rasterize it
    // For simplicity, we'll create a basic monospace font texture
    
    m_fontSize = fontSize;
    GenerateBitmapFont();
    
    return m_textureId != 0;
}

void Font::GenerateBitmapFont() {
    // Create a simple 8x8 pixel font texture
    // This is a placeholder - in production you'd use stb_truetype or similar
    
    const int charWidth = 8;
    const int charHeight = 8;
    const int charsPerRow = 16;
    const int charsPerCol = 16;
    
    m_atlasWidth = charWidth * charsPerRow;
    m_atlasHeight = charHeight * charsPerCol;
    
    uint8_t* pixels = new uint8_t[m_atlasWidth * m_atlasHeight * 4];
    memset(pixels, 0, m_atlasWidth * m_atlasHeight * 4);
    
    // Generate simple glyph data
    for (int i = 0; i < 256; i++) {
        int charX = (i % charsPerRow) * charWidth;
        int charY = (i / charsPerRow) * charHeight;
        
        m_glyphs[i].u0 = (float)charX / m_atlasWidth;
        m_glyphs[i].v0 = (float)charY / m_atlasHeight;
        m_glyphs[i].u1 = (float)(charX + charWidth) / m_atlasWidth;
        m_glyphs[i].v1 = (float)(charY + charHeight) / m_atlasHeight;
        m_glyphs[i].width = charWidth;
        m_glyphs[i].height = charHeight;
        m_glyphs[i].advance = charWidth;
        m_glyphs[i].bearingX = 0;
        m_glyphs[i].bearingY = charHeight;
        
        // Draw a simple rectangle for each character (placeholder)
        for (int y = 0; y < charHeight; y++) {
            for (int x = 0; x < charWidth; x++) {
                int px = charX + x;
                int py = charY + y;
                int idx = (py * m_atlasWidth + px) * 4;
                
                // Simple pattern based on character code
                uint8_t val = (i + x + y) % 256;
                pixels[idx + 0] = 255; // R
                pixels[idx + 1] = 255; // G
                pixels[idx + 2] = 255; // B
                pixels[idx + 3] = val > 128 ? 255 : 0; // A
            }
        }
    }
    
    // Create OpenGL texture
    glGenTextures(1, &m_textureId);
    glBindTexture(GL_TEXTURE_2D, m_textureId);
    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, m_atlasWidth, m_atlasHeight, 0, GL_RGBA, GL_UNSIGNED_BYTE, pixels);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
    
    delete[] pixels;
    
    Log::Info("Generated bitmap font texture: %dx%d", m_atlasWidth, m_atlasHeight);
}

void Font::DrawText(const char* text, float x, float y, float scale) {
    if (!IsLoaded() || !text) return;
    
    glEnable(GL_TEXTURE_2D);
    glBindTexture(GL_TEXTURE_2D, m_textureId);
    glEnable(GL_BLEND);
    glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
    
    float currentX = x;
    float currentY = y;
    
    glBegin(GL_QUADS);
    
    for (const char* c = text; *c; c++) {
        if (*c == '\n') {
            currentX = x;
            currentY += m_fontSize * scale;
            continue;
        }
        
        const Glyph& glyph = m_glyphs[(unsigned char)*c];
        
        float w = glyph.width * scale;
        float h = glyph.height * scale;
        float gx = currentX + glyph.bearingX * scale;
        float gy = currentY - glyph.bearingY * scale;
        
        glTexCoord2f(glyph.u0, glyph.v0);
        glVertex2f(gx, gy);
        
        glTexCoord2f(glyph.u1, glyph.v0);
        glVertex2f(gx + w, gy);
        
        glTexCoord2f(glyph.u1, glyph.v1);
        glVertex2f(gx + w, gy + h);
        
        glTexCoord2f(glyph.u0, glyph.v1);
        glVertex2f(gx, gy + h);
        
        currentX += glyph.advance * scale;
    }
    
    glEnd();
    
    glDisable(GL_BLEND);
}

float Font::GetTextWidth(const char* text, float scale) const {
    if (!text) return 0.0f;
    
    float width = 0.0f;
    for (const char* c = text; *c; c++) {
        if (*c == '\n') break;
        width += m_glyphs[(unsigned char)*c].advance * scale;
    }
    return width;
}

float Font::GetTextHeight(float scale) const {
    return m_fontSize * scale;
}

} // namespace Arena
