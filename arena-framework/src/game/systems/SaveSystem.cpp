#include "SaveSystem.h"
#include "framework/utils/Log.h"
#include <cstdio>
#include <cstring>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

namespace Arena {

const char* SaveSystem::SAVE_DIRECTORY = "saves/";

const char* SaveSystem::GetSavePath(const char* slotName) {
    static char path[256];
#ifdef __EMSCRIPTEN__
    snprintf(path, sizeof(path), "/saves/%s.sav", slotName);
#else
    snprintf(path, sizeof(path), "%s%s.sav", SAVE_DIRECTORY, slotName);
#endif
    return path;
}

bool SaveSystem::SaveExists(const char* slotName) {
    const char* path = GetSavePath(slotName);
    FILE* file = fopen(path, "rb");
    if (file) {
        fclose(file);
        return true;
    }
    return false;
}

bool SaveSystem::WriteSaveFile(const char* path, const SaveData& data) {
    FILE* file = fopen(path, "wb");
    if (!file) {
        Log::Error("Failed to create save file: %s", path);
        return false;
    }
    
    if (fwrite(&data, sizeof(SaveData), 1, file) != 1) {
        fclose(file);
        Log::Error("Failed to write save data");
        return false;
    }
    
    fclose(file);
    Log::Info("Saved game to: %s", path);
    return true;
}

bool SaveSystem::ReadSaveFile(const char* path, SaveData& data) {
    FILE* file = fopen(path, "rb");
    if (!file) {
        Log::Error("Failed to open save file: %s", path);
        return false;
    }
    
    if (fread(&data, sizeof(SaveData), 1, file) != 1) {
        fclose(file);
        Log::Error("Failed to read save data");
        return false;
    }
    
    fclose(file);
    Log::Info("Loaded game from: %s", path);
    return true;
}

bool SaveSystem::SaveGame(const char* slotName, const Player& player, const ChunkManager& world, uint32_t playTime) {
    SaveData data;
    
    data.playerPosition = player.GetPosition();
    data.playerRotation = player.GetCamera().GetRotation();
    data.playerStats = player.GetStats();
    data.playTime = playTime;
    data.seed = 0; // TODO: Store world seed
    
    const char* path = GetSavePath(slotName);
    
    // Create directory if it doesn't exist (native only)
#ifndef __EMSCRIPTEN__
    // TODO: Create saves directory
#endif
    
    return WriteSaveFile(path, data);
}

bool SaveSystem::LoadGame(const char* slotName, Player& player, ChunkManager& world, uint32_t& outPlayTime) {
    const char* path = GetSavePath(slotName);
    
    SaveData data;
    if (!ReadSaveFile(path, data)) {
        return false;
    }
    
    // Restore player state
    player.SetPosition(data.playerPosition);
    player.GetCamera().SetRotation(data.playerRotation);
    player.GetStats() = data.playerStats;
    
    // Restore world (would need to regenerate from seed or load chunks)
    // For now, just update streaming around player
    world.UpdateStreaming(data.playerPosition, 3.0f, 5.0f);
    
    outPlayTime = data.playTime;
    
    return true;
}

bool SaveSystem::DeleteSave(const char* slotName) {
    const char* path = GetSavePath(slotName);
    
    if (remove(path) == 0) {
        Log::Info("Deleted save: %s", path);
        return true;
    }
    
    Log::Warn("Failed to delete save: %s", path);
    return false;
}

} // namespace Arena
