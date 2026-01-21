#pragma once
#include "GridMap.h"

namespace Arena {

class MapGenerator {
public:
    // Generate a simple dungeon
    static void GenerateDungeon(GridMap& map, int seed = 0);
    
    // Generate a city layout
    static void GenerateCity(GridMap& map, int seed = 0);
    
    // Generate rooms and corridors
    static void GenerateRoomsAndCorridors(GridMap& map, int numRooms = 10, int seed = 0);
    
    // Utility: Carve a room
    static void CarveRoom(GridMap& map, int x, int y, int width, int height);
    
    // Utility: Carve a corridor
    static void CarveCorridor(GridMap& map, int x0, int y0, int x1, int y1);
};

} // namespace Arena
