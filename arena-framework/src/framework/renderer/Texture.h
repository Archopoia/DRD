#pragma once
#include <cstdint>
#include <cstddef>

namespace Arena {

class Texture {
public:
    Texture();
    ~Texture();
    
    // Load texture from file
    static uint32_t Load(const char* path);
    
    // Create texture from RGBA data
    static uint32_t CreateFromData(uint8_t* data, int width, int height, bool freeData = false);
    
    // Bind texture for rendering
    static void Bind(uint32_t textureId);
    
    // Get texture ID (for static Load function)
    static uint32_t GetId(const char* path);
    
    // Cleanup
    void Free();
    static void Shutdown(); // Cleanup all cached textures
    
    // Check if valid
    bool IsValid() const { return m_textureId != 0; }
    uint32_t GetId() const { return m_textureId; }

private:
    uint32_t m_textureId;
    
    // Static cache for loaded textures
    struct TextureCache {
        const char* path;
        uint32_t textureId;
    };
    static TextureCache s_cache[64];
    static int s_cacheCount;
    
    static uint32_t FindInCache(const char* path);
    static void AddToCache(const char* path, uint32_t textureId);
};

} // namespace Arena
