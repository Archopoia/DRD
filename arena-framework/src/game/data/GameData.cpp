#include "GameData.h"
#include "framework/utils/Log.h"
#include <cstring>
#include <cstdio>

namespace Arena {

EnemyData GameData::s_enemies[MAX_ENEMIES];
ItemData GameData::s_items[MAX_ITEMS];
SpellData GameData::s_spells[MAX_SPELLS];

int GameData::s_enemyCount = 0;
int GameData::s_itemCount = 0;
int GameData::s_spellCount = 0;

void GameData::Initialize() {
    InitializeDefaultData();
    Log::Info("GameData initialized");
}

void GameData::Shutdown() {
    // Cleanup if needed
}

void GameData::InitializeDefaultData() {
    // Default enemies
    s_enemyCount = 3;
    
    s_enemies[0] = { "Goblin", 30, 5, 2, 1.5f, 1 };
    s_enemies[1] = { "Orc", 60, 10, 5, 1.2f, 2 };
    s_enemies[2] = { "Dragon", 200, 25, 15, 0.8f, 3 };
    
    // Default items
    s_itemCount = 5;
    
    s_items[0] = { "Sword", 0, 50, 10 }; // type 0 = Weapon
    s_items[1] = { "Shield", 1, 30, 11 }; // type 1 = Armor
    s_items[2] = { "Health Potion", 2, 10, 12 }; // type 2 = Consumable
    s_items[3] = { "Key", 3, 5, 13 }; // type 3 = Key
    s_items[4] = { "Gold Coin", 4, 1, 14 }; // type 4 = Misc
    
    // Default spells
    s_spellCount = 3;
    
    s_spells[0] = { "Fireball", 10, 20, 20 };
    s_spells[1] = { "Heal", 5, 0, 21 };
    s_spells[2] = { "Lightning", 15, 30, 22 };
}

const EnemyData& GameData::GetEnemyData(int enemyId) {
    static EnemyData invalid = { "Unknown", 0, 0, 0, 0.0f, 0 };
    if (enemyId < 0 || enemyId >= s_enemyCount) {
        return invalid;
    }
    return s_enemies[enemyId];
}

const ItemData& GameData::GetItemData(int itemId) {
    static ItemData invalid = { "Unknown", 0, 0, 0 };
    if (itemId < 0 || itemId >= s_itemCount) {
        return invalid;
    }
    return s_items[itemId];
}

const SpellData& GameData::GetSpellData(int spellId) {
    static SpellData invalid = { "Unknown", 0, 0, 0 };
    if (spellId < 0 || spellId >= s_spellCount) {
        return invalid;
    }
    return s_spells[spellId];
}

bool GameData::LoadFromFile(const char* path) {
    // TODO: Load from JSON or binary format
    Log::Warn("GameData::LoadFromFile not implemented yet");
    return false;
}

bool GameData::SaveToFile(const char* path) {
    // TODO: Save to JSON or binary format
    Log::Warn("GameData::SaveToFile not implemented yet");
    return false;
}

} // namespace Arena
