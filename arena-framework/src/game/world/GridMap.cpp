#include "GridMap.h"
#include "framework/utils/Log.h"
#include <cstdlib>
#include <cstring>
#include <cstdio>

namespace Arena {

GridMap::GridMap() 
    : m_tiles(nullptr)
    , m_width(0)
    , m_height(0)
{
}

GridMap::~GridMap() {
    Destroy();
}

bool GridMap::Create(int width, int height) {
    if (width <= 0 || height <= 0) {
        Log::Error("Invalid map dimensions: %dx%d", width, height);
        return false;
    }
    
    Destroy();
    
    m_width = width;
    m_height = height;
    m_tiles = new Tile[width * height];
    
    if (!m_tiles) {
        Log::Error("Failed to allocate memory for map");
        m_width = 0;
        m_height = 0;
        return false;
    }
    
    Clear();
    
    Log::Info("Created map: %dx%d", width, height);
    return true;
}

void GridMap::Destroy() {
    if (m_tiles) {
        delete[] m_tiles;
        m_tiles = nullptr;
    }
    m_width = 0;
    m_height = 0;
}

Tile& GridMap::GetTile(int x, int y) {
    if (!IsValid(x, y)) {
        static Tile invalidTile;
        return invalidTile;
    }
    return m_tiles[y * m_width + x];
}

const Tile& GridMap::GetTile(int x, int y) const {
    if (!IsValid(x, y)) {
        static Tile invalidTile;
        return invalidTile;
    }
    return m_tiles[y * m_width + x];
}

bool GridMap::IsSolid(int x, int y) const {
    if (!IsValid(x, y)) return true; // Out of bounds is solid
    return m_tiles[y * m_width + x].solid;
}

bool GridMap::IsValid(int x, int y) const {
    return x >= 0 && x < m_width && y >= 0 && y < m_height;
}

void GridMap::Clear() {
    if (!m_tiles) {
        memset(m_tiles, 0, sizeof(Tile) * m_width * m_height);
    }
}

bool GridMap::LoadFromFile(const char* path) {
    FILE* file = fopen(path, "rb");
    if (!file) {
        Log::Error("Failed to open map file: %s", path);
        return false;
    }
    
    int width, height;
    if (fread(&width, sizeof(int), 1, file) != 1 ||
        fread(&height, sizeof(int), 1, file) != 1) {
        fclose(file);
        Log::Error("Failed to read map dimensions");
        return false;
    }
    
    if (!Create(width, height)) {
        fclose(file);
        return false;
    }
    
    if (fread(m_tiles, sizeof(Tile), width * height, file) != (size_t)(width * height)) {
        fclose(file);
        Log::Error("Failed to read map data");
        return false;
    }
    
    fclose(file);
    Log::Info("Loaded map from: %s", path);
    return true;
}

bool GridMap::SaveToFile(const char* path) const {
    if (!m_tiles) {
        Log::Error("No map data to save");
        return false;
    }
    
    FILE* file = fopen(path, "wb");
    if (!file) {
        Log::Error("Failed to create map file: %s", path);
        return false;
    }
    
    if (fwrite(&m_width, sizeof(int), 1, file) != 1 ||
        fwrite(&m_height, sizeof(int), 1, file) != 1) {
        fclose(file);
        Log::Error("Failed to write map dimensions");
        return false;
    }
    
    if (fwrite(m_tiles, sizeof(Tile), m_width * m_height, file) != (size_t)(m_width * m_height)) {
        fclose(file);
        Log::Error("Failed to write map data");
        return false;
    }
    
    fclose(file);
    Log::Info("Saved map to: %s", path);
    return true;
}

void GridMap::GenerateSimpleDungeon(int seed) {
    if (!m_tiles) return;
    
    srand(seed);
    
    // Simple algorithm: create rooms and corridors
    // Start with all walls
    for (int y = 0; y < m_height; y++) {
        for (int x = 0; x < m_width; x++) {
            Tile& tile = GetTile(x, y);
            tile.solid = true;
            tile.wallType = 1;
        }
    }
    
    // Create some rooms
    int numRooms = 5 + (rand() % 10);
    for (int i = 0; i < numRooms; i++) {
        int roomW = 5 + (rand() % 8);
        int roomH = 5 + (rand() % 8);
        int roomX = 2 + (rand() % (m_width - roomW - 4));
        int roomY = 2 + (rand() % (m_height - roomH - 4));
        
        // Carve out room
        for (int y = roomY; y < roomY + roomH && y < m_height; y++) {
            for (int x = roomX; x < roomX + roomW && x < m_width; x++) {
                Tile& tile = GetTile(x, y);
                tile.solid = false;
                tile.floorType = 1;
                tile.ceilingType = 1;
            }
        }
    }
    
    // Create corridors between rooms (simplified)
    for (int y = 1; y < m_height - 1; y++) {
        for (int x = 1; x < m_width - 1; x++) {
            // Random chance to create corridor
            if (rand() % 100 < 2) {
                Tile& tile = GetTile(x, y);
                if (tile.solid) {
                    tile.solid = false;
                    tile.floorType = 1;
                    tile.ceilingType = 1;
                }
            }
        }
    }
    
    Log::Info("Generated dungeon with seed: %d", seed);
}

} // namespace Arena
