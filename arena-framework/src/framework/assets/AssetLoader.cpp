#include "AssetLoader.h"
#include "framework/utils/Log.h"
#include <cstring>
#include <cstdlib>

#define STB_IMAGE_IMPLEMENTATION
#include <stb_image.h>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#include <cstdio>
#else
#include <cstdio>
#include <fstream>
#endif

namespace Arena {

static char s_assetRoot[256] = "assets/";

void BinaryData::Free() {
    if (data) {
        free(data);
        data = nullptr;
        size = 0;
    }
}

void AssetLoader::SetAssetRoot(const char* root) {
    strncpy(s_assetRoot, root, sizeof(s_assetRoot) - 1);
    s_assetRoot[sizeof(s_assetRoot) - 1] = '\0';
}

const char* AssetLoader::GetAssetPath(const char* relativePath) {
    static char fullPath[512];
    snprintf(fullPath, sizeof(fullPath), "%s%s", s_assetRoot, relativePath);
    return fullPath;
}

bool AssetLoader::LoadBinary(const char* path, BinaryData& outData) {
    const char* fullPath = GetAssetPath(path);
    
#ifdef __EMSCRIPTEN__
    FILE* file = fopen(fullPath, "rb");
    if (!file) {
        Log::Error("Failed to open file: %s", fullPath);
        return false;
    }
    
    fseek(file, 0, SEEK_END);
    size_t size = ftell(file);
    fseek(file, 0, SEEK_SET);
    
    outData.data = (uint8_t*)malloc(size);
    if (!outData.data) {
        fclose(file);
        Log::Error("Failed to allocate memory for file: %s", fullPath);
        return false;
    }
    
    size_t read = fread(outData.data, 1, size, file);
    fclose(file);
    
    if (read != size) {
        free(outData.data);
        outData.data = nullptr;
        Log::Error("Failed to read entire file: %s", fullPath);
        return false;
    }
    
    outData.size = size;
#else
    FILE* file = fopen(fullPath, "rb");
    if (!file) {
        Log::Error("Failed to open file: %s", fullPath);
        return false;
    }
    
    fseek(file, 0, SEEK_END);
    size_t size = ftell(file);
    fseek(file, 0, SEEK_SET);
    
    outData.data = (uint8_t*)malloc(size);
    if (!outData.data) {
        fclose(file);
        Log::Error("Failed to allocate memory for file: %s", fullPath);
        return false;
    }
    
    size_t read = fread(outData.data, 1, size, file);
    fclose(file);
    
    if (read != size) {
        free(outData.data);
        outData.data = nullptr;
        Log::Error("Failed to read entire file: %s", fullPath);
        return false;
    }
    
    outData.size = size;
#endif
    
    return true;
}

bool AssetLoader::LoadImage(const char* path, uint8_t*& outData, int& outWidth, int& outHeight, int& outChannels) {
    const char* fullPath = GetAssetPath(path);
    
    int width, height, channels;
    stbi_set_flip_vertically_on_load(0);
    uint8_t* data = stbi_load(fullPath, &width, &height, &channels, 4); // Force RGBA
    
    if (!data) {
        Log::Error("Failed to load image: %s - %s", fullPath, stbi_failure_reason());
        return false;
    }
    
    outData = data;
    outWidth = width;
    outHeight = height;
    outChannels = 4; // Always RGBA
    
    return true;
}

void AssetLoader::FreeImage(uint8_t* data) {
    if (data) {
        stbi_image_free(data);
    }
}

void AssetLoader::WavData::Free() {
    if (samples) {
        free(samples);
        samples = nullptr;
        sampleCount = 0;
    }
}

bool AssetLoader::LoadWav(const char* path, WavData& outData) {
    const char* fullPath = GetAssetPath(path);
    
    FILE* file = fopen(fullPath, "rb");
    if (!file) {
        Log::Error("Failed to open WAV file: %s", fullPath);
        return false;
    }
    
    // Read RIFF header
    char riff[4];
    if (fread(riff, 1, 4, file) != 4 || memcmp(riff, "RIFF", 4) != 0) {
        fclose(file);
        Log::Error("Invalid WAV file (not RIFF): %s", fullPath);
        return false;
    }
    
    uint32_t fileSize;
    fread(&fileSize, 4, 1, file);
    
    char wave[4];
    if (fread(wave, 1, 4, file) != 4 || memcmp(wave, "WAVE", 4) != 0) {
        fclose(file);
        Log::Error("Invalid WAV file (not WAVE): %s", fullPath);
        return false;
    }
    
    // Find fmt chunk
    bool foundFmt = false;
    while (!foundFmt) {
        char chunkId[4];
        if (fread(chunkId, 1, 4, file) != 4) {
            fclose(file);
            Log::Error("Failed to find fmt chunk in WAV: %s", fullPath);
            return false;
        }
        
        uint32_t chunkSize;
        fread(&chunkSize, 4, 1, file);
        
        if (memcmp(chunkId, "fmt ", 4) == 0) {
            foundFmt = true;
            uint16_t audioFormat, numChannels, bitsPerSample;
            uint32_t sampleRate, byteRate;
            uint16_t blockAlign;
            
            fread(&audioFormat, 2, 1, file);
            fread(&numChannels, 2, 1, file);
            fread(&sampleRate, 4, 1, file);
            fread(&byteRate, 4, 1, file);
            fread(&blockAlign, 2, 1, file);
            fread(&bitsPerSample, 2, 1, file);
            
            outData.sampleRate = sampleRate;
            outData.channels = numChannels;
            outData.bitsPerSample = bitsPerSample;
            
            // Skip remaining bytes in fmt chunk
            if (chunkSize > 16) {
                fseek(file, chunkSize - 16, SEEK_CUR);
            }
        } else {
            // Skip this chunk
            fseek(file, chunkSize, SEEK_CUR);
        }
    }
    
    // Find data chunk
    bool foundData = false;
    while (!foundData) {
        char chunkId[4];
        if (fread(chunkId, 1, 4, file) != 4) {
            fclose(file);
            Log::Error("Failed to find data chunk in WAV: %s", fullPath);
            return false;
        }
        
        uint32_t chunkSize;
        fread(&chunkSize, 4, 1, file);
        
        if (memcmp(chunkId, "data", 4) == 0) {
            foundData = true;
            outData.sampleCount = chunkSize / (outData.bitsPerSample / 8) / outData.channels;
            
            outData.samples = (uint8_t*)malloc(chunkSize);
            if (!outData.samples) {
                fclose(file);
                Log::Error("Failed to allocate memory for WAV samples: %s", fullPath);
                return false;
            }
            
            if (fread(outData.samples, 1, chunkSize, file) != chunkSize) {
                free(outData.samples);
                outData.samples = nullptr;
                fclose(file);
                Log::Error("Failed to read WAV data: %s", fullPath);
                return false;
            }
        } else {
            // Skip this chunk
            fseek(file, chunkSize, SEEK_CUR);
        }
    }
    
    fclose(file);
    return true;
}

} // namespace Arena
