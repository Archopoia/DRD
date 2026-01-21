#pragma once
#include <cstdint>
#include <cstddef>

namespace Arena {

struct EnemyData {
    const char* name;
    int maxHealth;
    int attack;
    int defense;
    float speed;
    uint32_t spriteId;
};

struct ItemData {
    const char* name;
    int type; // ItemType enum value
    int value;
    uint32_t spriteId;
};

struct SpellData {
    const char* name;
    int manaCost;
    int damage;
    uint32_t spriteId;
};

class GameData {
public:
    static void Initialize();
    static void Shutdown();
    
    // Enemy data
    static const EnemyData& GetEnemyData(int enemyId);
    static int GetEnemyCount() { return s_enemyCount; }
    
    // Item data
    static const ItemData& GetItemData(int itemId);
    static int GetItemCount() { return s_itemCount; }
    
    // Spell data
    static const SpellData& GetSpellData(int spellId);
    static int GetSpellCount() { return s_spellCount; }
    
    // Loading
    static bool LoadFromFile(const char* path);
    static bool SaveToFile(const char* path);

private:
    static const int MAX_ENEMIES = 64;
    static const int MAX_ITEMS = 256;
    static const int MAX_SPELLS = 64;
    
    static EnemyData s_enemies[MAX_ENEMIES];
    static ItemData s_items[MAX_ITEMS];
    static SpellData s_spells[MAX_SPELLS];
    
    static int s_enemyCount;
    static int s_itemCount;
    static int s_spellCount;
    
    static void InitializeDefaultData();
};

} // namespace Arena
