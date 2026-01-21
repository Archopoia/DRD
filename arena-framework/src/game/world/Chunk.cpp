#include "Chunk.h"
#include "framework/utils/Log.h"
#include <cmath>
#include <cstring>

namespace Arena {

ChunkManager::ChunkManager()
    : m_chunkSize(64)
    , m_loadedChunks(0)
{
    memset(m_chunks, 0, sizeof(m_chunks));
}

ChunkManager::~ChunkManager() {
    Shutdown();
}

bool ChunkManager::Initialize(int chunkSize) {
    if (chunkSize <= 0) {
        Log::Error("Invalid chunk size: %d", chunkSize);
        return false;
    }
    
    m_chunkSize = chunkSize;
    m_loadedChunks = 0;
    
    Log::Info("ChunkManager initialized with chunk size: %d", chunkSize);
    return true;
}

void ChunkManager::Shutdown() {
    UnloadAllChunks();
    m_loadedChunks = 0;
}

int ChunkManager::GetChunkIndex(int chunkX, int chunkY) const {
    // Simple hash-based index (can be improved)
    int hash = (chunkX * 73856093) ^ (chunkY * 19349663);
    return abs(hash) % MAX_CHUNKS;
}

Chunk* ChunkManager::GetChunk(int chunkX, int chunkY) {
    int index = GetChunkIndex(chunkX, chunkY);
    Chunk* chunk = &m_chunks[index];
    
    if (chunk->loaded && 
        (int)chunk->position.x == chunkX && 
        (int)chunk->position.y == chunkY) {
        return chunk;
    }
    
    return nullptr;
}

Chunk* ChunkManager::GetChunkAtWorldPos(float worldX, float worldY) {
    int chunkX = (int)floorf(worldX / m_chunkSize);
    int chunkY = (int)floorf(worldY / m_chunkSize);
    return GetChunk(chunkX, chunkY);
}

const Chunk* ChunkManager::GetChunk(int chunkX, int chunkY) const {
    return const_cast<ChunkManager*>(this)->GetChunk(chunkX, chunkY);
}

const Chunk* ChunkManager::GetChunkAtWorldPos(float worldX, float worldY) const {
    return const_cast<ChunkManager*>(this)->GetChunkAtWorldPos(worldX, worldY);
}

void ChunkManager::LoadChunk(int chunkX, int chunkY) {
    // Check if already loaded
    Chunk* existing = GetChunk(chunkX, chunkY);
    if (existing) {
        return;
    }
    
    // Find empty slot
    int index = GetChunkIndex(chunkX, chunkY);
    Chunk* chunk = &m_chunks[index];
    
    // Unload existing chunk if slot is occupied
    if (chunk->loaded) {
        UnloadChunk((int)chunk->position.x, (int)chunk->position.y);
    }
    
    // Create new chunk
    if (!chunk->map.Create(m_chunkSize, m_chunkSize)) {
        Log::Error("Failed to create chunk at (%d, %d)", chunkX, chunkY);
        return;
    }
    
    chunk->position = Vec2((float)chunkX, (float)chunkY);
    chunk->loaded = true;
    chunk->dirty = false;
    
    // Generate chunk content
    GenerateChunk(chunk, chunkX, chunkY);
    
    m_loadedChunks++;
    Log::Info("Loaded chunk (%d, %d)", chunkX, chunkY);
}

void ChunkManager::UnloadChunk(int chunkX, int chunkY) {
    Chunk* chunk = GetChunk(chunkX, chunkY);
    if (!chunk) {
        return;
    }
    
    // Save if dirty
    if (chunk->dirty) {
        // TODO: Save chunk to disk
    }
    
    chunk->map.Destroy();
    chunk->loaded = false;
    chunk->dirty = false;
    
    m_loadedChunks--;
    Log::Info("Unloaded chunk (%d, %d)", chunkX, chunkY);
}

void ChunkManager::UnloadAllChunks() {
    for (int i = 0; i < MAX_CHUNKS; i++) {
        if (m_chunks[i].loaded) {
            UnloadChunk((int)m_chunks[i].position.x, (int)m_chunks[i].position.y);
        }
    }
}

void ChunkManager::UpdateStreaming(const Vec2& playerPos, float loadRadius, float unloadRadius) {
    int playerChunkX = (int)floorf(playerPos.x / m_chunkSize);
    int playerChunkY = (int)floorf(playerPos.y / m_chunkSize);
    
    int loadRadiusChunks = (int)ceilf(loadRadius);
    int unloadRadiusChunks = (int)ceilf(unloadRadius);
    
    // Load chunks in radius
    for (int y = playerChunkY - loadRadiusChunks; y <= playerChunkY + loadRadiusChunks; y++) {
        for (int x = playerChunkX - loadRadiusChunks; x <= playerChunkX + loadRadiusChunks; x++) {
            float dist = sqrtf((x - playerChunkX) * (x - playerChunkX) + (y - playerChunkY) * (y - playerChunkY));
            if (dist <= loadRadius) {
                LoadChunk(x, y);
            }
        }
    }
    
    // Unload chunks outside radius
    for (int i = 0; i < MAX_CHUNKS; i++) {
        if (m_chunks[i].loaded) {
            int chunkX = (int)m_chunks[i].position.x;
            int chunkY = (int)m_chunks[i].position.y;
            
            float dist = sqrtf((chunkX - playerChunkX) * (chunkX - playerChunkX) + 
                              (chunkY - playerChunkY) * (chunkY - playerChunkY));
            
            if (dist > unloadRadius) {
                UnloadChunk(chunkX, chunkY);
            }
        }
    }
}

Tile& ChunkManager::GetTileAtWorldPos(float worldX, float worldY) {
    Chunk* chunk = GetChunkAtWorldPos(worldX, worldY);
    if (!chunk) {
        static Tile invalidTile;
        invalidTile.solid = true;
        return invalidTile;
    }
    
    int localX = (int)floorf(worldX) % m_chunkSize;
    int localY = (int)floorf(worldY) % m_chunkSize;
    
    if (localX < 0) localX += m_chunkSize;
    if (localY < 0) localY += m_chunkSize;
    
    return chunk->map.GetTile(localX, localY);
}

const Tile& ChunkManager::GetTileAtWorldPos(float worldX, float worldY) const {
    return const_cast<ChunkManager*>(this)->GetTileAtWorldPos(worldX, worldY);
}

bool ChunkManager::IsSolidAtWorldPos(float worldX, float worldY) const {
    const Chunk* chunk = GetChunkAtWorldPos(worldX, worldY);
    if (!chunk) {
        return true; // Out of bounds is solid
    }
    
    int localX = (int)floorf(worldX) % m_chunkSize;
    int localY = (int)floorf(worldY) % m_chunkSize;
    
    if (localX < 0) localX += m_chunkSize;
    if (localY < 0) localY += m_chunkSize;
    
    return chunk->map.IsSolid(localX, localY);
}

void ChunkManager::GenerateChunk(Chunk* chunk, int chunkX, int chunkY) {
    // Simple generation based on chunk coordinates
    int seed = (chunkX * 73856093) ^ (chunkY * 19349663);
    chunk->map.GenerateSimpleDungeon(seed);
}

} // namespace Arena
