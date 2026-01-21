#pragma once
#include <cstdint>
#include <cstddef>

namespace Arena {
    struct Door;
}
namespace Arena {

struct Tile {
    uint8_t wallType;
    uint8_t floorType;
    uint8_t ceilingType;
    bool solid;
    
    Tile() : wallType(0), floorType(0), ceilingType(0), solid(false) {}
};

class GridMap {
public:
    GridMap();
    ~GridMap();
    
    bool Create(int width, int height);
    void Destroy();
    
    // Tile access
    Tile& GetTile(int x, int y);
    const Tile& GetTile(int x, int y) const;
    
    // Collision
    bool IsSolid(int x, int y) const;
    bool IsValid(int x, int y) const;
    
    // Map properties
    int GetWidth() const { return m_width; }
    int GetHeight() const { return m_height; }
    
    // Loading/Saving
    bool LoadFromFile(const char* path);
    bool SaveToFile(const char* path) const;
    
    // Generation
    void GenerateSimpleDungeon(int seed = 0);
    void Clear();
    
    // Door management
    Door* GetDoorAt(int x, int y);
    const Door* GetDoorAt(int x, int y) const;
    Door* CreateDoorAt(int x, int y);
    int GetDoorCount() const { return m_doorCount; }
    Door* GetDoors() { return m_doors; }
    const Door* GetDoors() const { return m_doors; }

private:
    Tile* m_tiles;
    int m_width;
    int m_height;
    
    // Door storage
    static const int MAX_DOORS = 128;
    Door* m_doors;
    int m_doorCount;
};

} // namespace Arena
