#pragma once
#include "game/actors/Actor.h"
#include <cstdint>

namespace Arena {

class Combat {
public:
    // Calculate hit chance (0.0 to 1.0)
    static float CalculateHitChance(const Actor& attacker, const Actor& defender);
    
    // Calculate damage
    static int CalculateDamage(const Actor& attacker, const Actor& defender);
    
    // Perform attack
    static bool Attack(Actor& attacker, Actor& defender);
    
    // Check if attack hits
    static bool DoesHit(const Actor& attacker, const Actor& defender);
    
    // Apply damage
    static void ApplyDamage(Actor& target, int damage);
    
    // Check if actor is dead
    static bool IsDead(const Actor& actor);
    
    // Heal actor
    static void Heal(Actor& actor, int amount);
};

} // namespace Arena
