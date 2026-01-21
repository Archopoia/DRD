#pragma once
#include <cstdint>
#include <cstddef>

namespace Arena {

struct Glyph {
    float u0, v0; // Top-left UV
    float u1, v1; // Bottom-right UV
    int width;
    int height;
    int advance; // Horizontal advance
    int bearingX;
    int bearingY;
};

class Font {
public:
    Font();
    ~Font();
    
    bool Load(const char* path, int fontSize = 16);
    void Free();
    
    void DrawText(const char* text, float x, float y, float scale = 1.0f);
    float GetTextWidth(const char* text, float scale = 1.0f) const;
    float GetTextHeight(float scale = 1.0f) const;
    
    bool IsLoaded() const { return m_textureId != 0; }

private:
    uint32_t m_textureId;
    int m_fontSize;
    int m_atlasWidth;
    int m_atlasHeight;
    Glyph m_glyphs[256]; // ASCII only for now
    
    void GenerateBitmapFont();
};

} // namespace Arena
