#include "QuestSystem.h"
#include "framework/utils/Log.h"
#include <cstring>

namespace Arena {

Quest QuestSystem::s_quests[MAX_QUESTS];
int QuestSystem::s_questCount = 0;

void QuestSystem::Initialize() {
    s_questCount = 0;
    memset(s_quests, 0, sizeof(s_quests));
    Log::Info("QuestSystem initialized");
}

void QuestSystem::Shutdown() {
    s_questCount = 0;
}

void QuestSystem::AddQuest(const Quest& quest) {
    if (s_questCount >= MAX_QUESTS) {
        Log::Warn("Quest limit reached, cannot add quest: %s", quest.name);
        return;
    }
    
    s_quests[s_questCount] = quest;
    s_questCount++;
}

Quest* QuestSystem::GetQuest(int questId) {
    for (int i = 0; i < s_questCount; i++) {
        if (s_quests[i].id == questId) {
            return &s_quests[i];
        }
    }
    return nullptr;
}

void QuestSystem::StartQuest(int questId) {
    Quest* quest = GetQuest(questId);
    if (quest && quest->state == QuestState::NotStarted) {
        quest->state = QuestState::InProgress;
        quest->currentCount = 0;
        Log::Info("Started quest: %s", quest->name);
    }
}

void QuestSystem::CompleteQuest(int questId) {
    Quest* quest = GetQuest(questId);
    if (quest && quest->state == QuestState::InProgress) {
        quest->state = QuestState::Completed;
        Log::Info("Completed quest: %s", quest->name);
    }
}

void QuestSystem::FailQuest(int questId) {
    Quest* quest = GetQuest(questId);
    if (quest && quest->state == QuestState::InProgress) {
        quest->state = QuestState::Failed;
        Log::Info("Failed quest: %s", quest->name);
    }
}

void QuestSystem::UpdateObjective(int questId, int objectiveType, int targetId, int amount) {
    Quest* quest = GetQuest(questId);
    if (!quest || quest->state != QuestState::InProgress) {
        return;
    }
    
    if (quest->objectiveType == objectiveType && quest->targetId == targetId) {
        quest->currentCount += amount;
        if (quest->currentCount > quest->targetCount) {
            quest->currentCount = quest->targetCount;
        }
        
        if (CheckQuestCompletion(questId)) {
            CompleteQuest(questId);
        }
    }
}

bool QuestSystem::CheckQuestCompletion(int questId) {
    Quest* quest = GetQuest(questId);
    if (!quest || quest->state != QuestState::InProgress) {
        return false;
    }
    
    return quest->currentCount >= quest->targetCount;
}

int QuestSystem::GetActiveQuestCount() {
    int count = 0;
    for (int i = 0; i < s_questCount; i++) {
        if (s_quests[i].state == QuestState::InProgress) {
            count++;
        }
    }
    return count;
}

Quest* QuestSystem::GetActiveQuests(int* outCount, int maxCount) {
    int count = 0;
    static Quest activeQuests[64];
    
    for (int i = 0; i < s_questCount && count < maxCount; i++) {
        if (s_quests[i].state == QuestState::InProgress) {
            activeQuests[count] = s_quests[i];
            count++;
        }
    }
    
    if (outCount) {
        *outCount = count;
    }
    
    return activeQuests;
}

} // namespace Arena
