#pragma once
#include "game/actors/Player.h"
#include "game/world/Chunk.h"
#include <cstdint>

namespace Arena {

struct SaveData {
    // Player data
    Vec2 playerPosition;
    float playerRotation;
    Stats playerStats;
    
    // World data (simplified - would need chunk data in real implementation)
    int seed;
    
    // Game state
    uint32_t playTime; // In seconds
    
    SaveData() 
        : playerPosition(0.0f, 0.0f)
        , playerRotation(0.0f)
        , seed(0)
        , playTime(0)
    {
    }
};

class SaveSystem {
public:
    static bool SaveGame(const char* slotName, const Player& player, const ChunkManager& world, uint32_t playTime);
    static bool LoadGame(const char* slotName, Player& player, ChunkManager& world, uint32_t& outPlayTime);
    
    static bool SaveExists(const char* slotName);
    static bool DeleteSave(const char* slotName);
    
    // Get save slot path
    static const char* GetSavePath(const char* slotName);

private:
    static const int MAX_SAVE_SLOTS = 10;
    static const char* SAVE_DIRECTORY;
    
    static bool WriteSaveFile(const char* path, const SaveData& data);
    static bool ReadSaveFile(const char* path, SaveData& data);
};

} // namespace Arena
