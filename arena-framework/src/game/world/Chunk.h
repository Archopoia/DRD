#pragma once
#include "GridMap.h"
#include "framework/math/Vec2.h"

namespace Arena {

struct Chunk {
    GridMap map;
    Vec2 position; // World position (in chunks)
    bool loaded;
    bool dirty; // Needs saving
    
    Chunk() : loaded(false), dirty(false), position(0.0f, 0.0f) {}
};

class ChunkManager {
public:
    ChunkManager();
    ~ChunkManager();
    
    bool Initialize(int chunkSize = 64);
    void Shutdown();
    
    // Chunk management
    Chunk* GetChunk(int chunkX, int chunkY);
    Chunk* GetChunkAtWorldPos(float worldX, float worldY);
    const Chunk* GetChunk(int chunkX, int chunkY) const;
    const Chunk* GetChunkAtWorldPos(float worldX, float worldY) const;
    
    // Loading/Unloading
    void LoadChunk(int chunkX, int chunkY);
    void UnloadChunk(int chunkX, int chunkY);
    void UnloadAllChunks();
    
    // Streaming
    void UpdateStreaming(const Vec2& playerPos, float loadRadius = 3.0f, float unloadRadius = 5.0f);
    
    // Tile access (world coordinates)
    Tile& GetTileAtWorldPos(float worldX, float worldY);
    const Tile& GetTileAtWorldPos(float worldX, float worldY) const;
    bool IsSolidAtWorldPos(float worldX, float worldY) const;
    
    // Chunk properties
    int GetChunkSize() const { return m_chunkSize; }
    int GetLoadedChunkCount() const { return m_loadedChunks; }

private:
    static const int MAX_CHUNKS = 256;
    Chunk m_chunks[MAX_CHUNKS];
    int m_chunkSize;
    int m_loadedChunks;
    
    int GetChunkIndex(int chunkX, int chunkY) const;
    void GenerateChunk(Chunk* chunk, int chunkX, int chunkY);
};

} // namespace Arena
