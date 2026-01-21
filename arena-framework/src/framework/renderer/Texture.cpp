#include "Texture.h"
#include "framework/assets/AssetLoader.h"
#include "framework/utils/Log.h"
#include <SDL2/SDL_opengl.h>
#include <cstring>
#include <cstdlib>
#ifdef _WIN32
#undef LoadImage  // Undefine Windows macro that conflicts with AssetLoader::LoadImage
#endif

namespace Arena {

Texture::TextureCache Texture::s_cache[64];
int Texture::s_cacheCount = 0;

Texture::Texture() : m_textureId(0) {
}

Texture::~Texture() {
    Free();
}

uint32_t Texture::Load(const char* path) {
    // Check cache first
    uint32_t cached = FindInCache(path);
    if (cached != 0) {
        return cached;
    }
    
    // Load image data
    uint8_t* data = nullptr;
    int width, height, channels;
    
    if (!AssetLoader::LoadImage(path, data, width, height, channels)) {
        Log::Error("Failed to load texture: %s", path);
        return 0;
    }
    
    // Create OpenGL texture
    uint32_t textureId = CreateFromData(data, width, height, true);
    
    if (textureId != 0) {
        // Add to cache
        AddToCache(path, textureId);
    }
    
    return textureId;
}

uint32_t Texture::CreateFromData(uint8_t* data, int width, int height, bool freeData) {
    if (!data || width <= 0 || height <= 0) {
        return 0;
    }
    
    uint32_t textureId = 0;
    glGenTextures(1, &textureId);
    if (textureId == 0) {
        Log::Error("Failed to generate texture");
        if (freeData) {
            AssetLoader::FreeImage(data);
        }
        return 0;
    }
    
    glBindTexture(GL_TEXTURE_2D, textureId);
    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, width, height, 0, GL_RGBA, GL_UNSIGNED_BYTE, data);
    
    // Use nearest neighbor for retro pixelated look
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);
    
    if (freeData) {
        AssetLoader::FreeImage(data);
    }
    
    return textureId;
}

void Texture::Bind(uint32_t textureId) {
    if (textureId != 0) {
        glBindTexture(GL_TEXTURE_2D, textureId);
    } else {
        glBindTexture(GL_TEXTURE_2D, 0);
    }
}

uint32_t Texture::GetId(const char* path) {
    return FindInCache(path);
}

void Texture::Free() {
    if (m_textureId != 0) {
        glDeleteTextures(1, &m_textureId);
        m_textureId = 0;
    }
}

void Texture::Shutdown() {
    // Cleanup all cached textures
    for (int i = 0; i < s_cacheCount; i++) {
        if (s_cache[i].textureId != 0) {
            glDeleteTextures(1, &s_cache[i].textureId);
        }
        if (s_cache[i].path) {
            free((void*)s_cache[i].path);
        }
    }
    s_cacheCount = 0;
}

uint32_t Texture::FindInCache(const char* path) {
    for (int i = 0; i < s_cacheCount; i++) {
        if (s_cache[i].path && strcmp(s_cache[i].path, path) == 0) {
            return s_cache[i].textureId;
        }
    }
    return 0;
}

void Texture::AddToCache(const char* path, uint32_t textureId) {
    if (s_cacheCount >= 64) {
        Log::Warn("Texture cache full, not caching: %s", path);
        return;
    }
    
    // Allocate and copy path
    char* cachedPath = (char*)malloc(strlen(path) + 1);
    if (!cachedPath) {
        Log::Error("Failed to allocate memory for texture cache path");
        return;
    }
    strcpy(cachedPath, path);
    
    s_cache[s_cacheCount].path = cachedPath;
    s_cache[s_cacheCount].textureId = textureId;
    s_cacheCount++;
}

} // namespace Arena
