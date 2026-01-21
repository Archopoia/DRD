#include "MapGenerator.h"
#include "framework/utils/Log.h"
#include <cstdlib>
#include <algorithm>
#include <cmath>

namespace Arena {

void MapGenerator::GenerateDungeon(GridMap& map, int seed) {
    srand(seed);
    map.GenerateSimpleDungeon(seed);
}

void MapGenerator::GenerateCity(GridMap& map, int seed) {
    srand(seed);
    
    int width = map.GetWidth();
    int height = map.GetHeight();
    
    // Start with all walls
    for (int y = 0; y < height; y++) {
        for (int x = 0; x < width; x++) {
            Tile& tile = map.GetTile(x, y);
            tile.solid = true;
            tile.wallType = 1;
        }
    }
    
    // Create streets (grid pattern)
    int streetSpacing = 10;
    for (int y = 0; y < height; y++) {
        if (y % streetSpacing == 0) {
            for (int x = 0; x < width; x++) {
                Tile& tile = map.GetTile(x, y);
                tile.solid = false;
                tile.floorType = 2; // Street
            }
        }
    }
    
    for (int x = 0; x < width; x++) {
        if (x % streetSpacing == 0) {
            for (int y = 0; y < height; y++) {
                Tile& tile = map.GetTile(x, y);
                tile.solid = false;
                tile.floorType = 2; // Street
            }
        }
    }
    
    // Create buildings in blocks
    for (int by = 1; by < height - 1; by += streetSpacing) {
        for (int bx = 1; bx < width - 1; bx += streetSpacing) {
            if (rand() % 100 < 70) { // 70% chance of building
                int buildingW = 3 + (rand() % 4);
                int buildingH = 3 + (rand() % 4);
                
                // Leave space for streets
                if (bx + buildingW < width - 1 && by + buildingH < height - 1) {
                    // Create building walls
                    for (int y = by; y < by + buildingH && y < height - 1; y++) {
                        for (int x = bx; x < bx + buildingW && x < width - 1; x++) {
                            Tile& tile = map.GetTile(x, y);
                            if (x == bx || x == bx + buildingW - 1 || 
                                y == by || y == by + buildingH - 1) {
                                tile.solid = true;
                                tile.wallType = 2; // Building wall
                            } else {
                                tile.solid = false;
                                tile.floorType = 1; // Building interior
                            }
                        }
                    }
                }
            }
        }
    }
    
    Log::Info("Generated city layout with seed: %d", seed);
}

void MapGenerator::GenerateRoomsAndCorridors(GridMap& map, int numRooms, int seed) {
    srand(seed);
    
    int width = map.GetWidth();
    int height = map.GetHeight();
    
    // Start with all walls
    for (int y = 0; y < height; y++) {
        for (int x = 0; x < width; x++) {
            Tile& tile = map.GetTile(x, y);
            tile.solid = true;
            tile.wallType = 1;
        }
    }
    
    struct Room {
        int x, y, w, h;
        int centerX, centerY;
    };
    
    Room rooms[100];
    int roomCount = 0;
    
    // Generate rooms
    for (int i = 0; i < numRooms && roomCount < 100; i++) {
        int roomW = 5 + (rand() % 8);
        int roomH = 5 + (rand() % 8);
        int roomX = 2 + (rand() % (width - roomW - 4));
        int roomY = 2 + (rand() % (height - roomH - 4));
        
        // Check for overlap
        bool overlap = false;
        for (int j = 0; j < roomCount; j++) {
            if (roomX < rooms[j].x + rooms[j].w + 2 &&
                roomX + roomW + 2 > rooms[j].x &&
                roomY < rooms[j].y + rooms[j].h + 2 &&
                roomY + roomH + 2 > rooms[j].y) {
                overlap = true;
                break;
            }
        }
        
        if (!overlap) {
            rooms[roomCount].x = roomX;
            rooms[roomCount].y = roomY;
            rooms[roomCount].w = roomW;
            rooms[roomCount].h = roomH;
            rooms[roomCount].centerX = roomX + roomW / 2;
            rooms[roomCount].centerY = roomY + roomH / 2;
            roomCount++;
            
            CarveRoom(map, roomX, roomY, roomW, roomH);
        }
    }
    
    // Connect rooms with corridors
    for (int i = 1; i < roomCount; i++) {
        int prevCenterX = rooms[i - 1].centerX;
        int prevCenterY = rooms[i - 1].centerY;
        int currCenterX = rooms[i].centerX;
        int currCenterY = rooms[i].centerY;
        
        // 50% chance of L-shaped corridor, 50% straight
        if (rand() % 2 == 0) {
            // L-shaped
            CarveCorridor(map, prevCenterX, prevCenterY, currCenterX, prevCenterY);
            CarveCorridor(map, currCenterX, prevCenterY, currCenterX, currCenterY);
        } else {
            // Straight
            CarveCorridor(map, prevCenterX, prevCenterY, currCenterX, currCenterY);
        }
    }
    
    Log::Info("Generated %d rooms with corridors (seed: %d)", roomCount, seed);
}

void MapGenerator::CarveRoom(GridMap& map, int x, int y, int width, int height) {
    for (int py = y; py < y + height && py < map.GetHeight(); py++) {
        for (int px = x; px < x + width && px < map.GetWidth(); px++) {
            Tile& tile = map.GetTile(px, py);
            tile.solid = false;
            tile.floorType = 1;
            tile.ceilingType = 1;
            // Random wall type variation
            if (px == x || px == x + width - 1 || py == y || py == y + height - 1) {
                tile.wallType = (rand() % 3); // Vary wall types
            }
        }
    }
}

void MapGenerator::CarveCorridor(GridMap& map, int x0, int y0, int x1, int y1) {
    // Simple line drawing algorithm
    int dx = abs(x1 - x0);
    int dy = abs(y1 - y0);
    int sx = (x0 < x1) ? 1 : -1;
    int sy = (y0 < y1) ? 1 : -1;
    int err = dx - dy;
    
    int x = x0;
    int y = y0;
    
    while (true) {
        // Carve 3x3 area for corridor
        for (int py = y - 1; py <= y + 1; py++) {
            for (int px = x - 1; px <= x + 1; px++) {
                if (map.IsValid(px, py)) {
                    Tile& tile = map.GetTile(px, py);
                    tile.solid = false;
                    tile.floorType = 1;
                }
            }
        }
        
        if (x == x1 && y == y1) break;
        
        int e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x += sx;
        }
        if (e2 < dx) {
            err += dx;
            y += sy;
        }
    }
}

} // namespace Arena
