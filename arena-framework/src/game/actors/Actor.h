#pragma once
#include "framework/math/Vec2.h"
#include <cstdint>

namespace Arena {

struct Stats {
    int health;
    int maxHealth;
    int attack;
    int defense;
    float speed;
    
    Stats() : health(100), maxHealth(100), attack(10), defense(5), speed(1.0f) {}
};

enum class ActorState {
    Idle,
    Patrol,
    Chase,
    Attack,
    Dead
};

struct Actor {
    Vec2 position;
    float rotation;
    uint32_t spriteId;
    Stats stats;
    ActorState state;
    float stateTimer;
    
    // AI
    Vec2 targetPosition;
    float patrolRadius;
    Vec2 patrolCenter;
    
    Actor() 
        : position(0.0f, 0.0f)
        , rotation(0.0f)
        , spriteId(0)
        , state(ActorState::Idle)
        , stateTimer(0.0f)
        , patrolRadius(5.0f)
        , patrolCenter(0.0f, 0.0f)
    {
    }
};

class ActorSystem {
public:
    static void Update(Actor& actor, float deltaTime);
    static void UpdateAI(Actor& actor, const Vec2& playerPos, float deltaTime);
    
    // State management
    static void SetState(Actor& actor, ActorState newState);
    static void UpdateState(Actor& actor, float deltaTime);
    
    // Movement
    static void MoveTowards(Actor& actor, const Vec2& target, float deltaTime);
    static void Patrol(Actor& actor, float deltaTime);
    
    // Combat
    static bool CanSeeTarget(const Actor& actor, const Vec2& target, float maxDistance = 10.0f);
    static void Attack(Actor& attacker, Actor& target);
};

} // namespace Arena
