#pragma once
#include <cstdint>
#include <cstddef>

namespace Arena {

struct BinaryData {
    uint8_t* data;
    size_t size;
    
    BinaryData() : data(nullptr), size(0) {}
    ~BinaryData() { Free(); }
    
    void Free();
};

class AssetLoader {
public:
    // Binary file loading
    static bool LoadBinary(const char* path, BinaryData& outData);
    
    // Image loading (returns RGBA8 data)
    static bool LoadImage(const char* path, uint8_t*& outData, int& outWidth, int& outHeight, int& outChannels);
    static void FreeImage(uint8_t* data);
    
    // WAV file loading (simple header parser)
    struct WavData {
        uint8_t* samples;
        uint32_t sampleCount;
        uint32_t sampleRate;
        uint16_t channels;
        uint16_t bitsPerSample;
        
        WavData() : samples(nullptr), sampleCount(0), sampleRate(0), channels(0), bitsPerSample(0) {}
        ~WavData() { Free(); }
        
        void Free();
    };
    
    static bool LoadWav(const char* path, WavData& outData);
    
    // Asset path management
    static void SetAssetRoot(const char* root);
    static const char* GetAssetPath(const char* relativePath);
};

} // namespace Arena
