#pragma once
#include <cstdint>
#include <cstddef>

namespace Arena {

enum class QuestState {
    NotStarted,
    InProgress,
    Completed,
    Failed
};

struct Quest {
    int id;
    const char* name;
    const char* description;
    QuestState state;
    
    // Objectives
    int objectiveType; // 0 = kill, 1 = collect, 2 = reach, etc.
    int targetId;
    int currentCount;
    int targetCount;
    
    Quest() 
        : id(0)
        , name(nullptr)
        , description(nullptr)
        , state(QuestState::NotStarted)
        , objectiveType(0)
        , targetId(0)
        , currentCount(0)
        , targetCount(0)
    {
    }
};

class QuestSystem {
public:
    static void Initialize();
    static void Shutdown();
    
    // Quest management
    static void AddQuest(const Quest& quest);
    static Quest* GetQuest(int questId);
    static void StartQuest(int questId);
    static void CompleteQuest(int questId);
    static void FailQuest(int questId);
    
    // Objective tracking
    static void UpdateObjective(int questId, int objectiveType, int targetId, int amount = 1);
    static bool CheckQuestCompletion(int questId);
    
    // Queries
    static int GetActiveQuestCount();
    static Quest* GetActiveQuests(int* outCount, int maxCount);

private:
    static const int MAX_QUESTS = 64;
    static Quest s_quests[MAX_QUESTS];
    static int s_questCount;
};

} // namespace Arena
