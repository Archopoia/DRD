#include "Combat.h"
#include <cstdlib>
#include <cmath>
#include <algorithm>

namespace Arena {

float Combat::CalculateHitChance(const Actor& attacker, const Actor& defender) {
    // Simple formula: base chance + attacker advantage - defender advantage
    float baseChance = 0.7f; // 70% base
    float attackerBonus = (attacker.stats.attack - 10) * 0.02f; // +2% per attack point above 10
    float defenderPenalty = (defender.stats.defense - 5) * 0.01f; // -1% per defense point above 5
    
    float hitChance = baseChance + attackerBonus - defenderPenalty;
    return std::max(0.1f, std::min(0.95f, hitChance)); // Clamp between 10% and 95%
}

int Combat::CalculateDamage(const Actor& attacker, const Actor& defender) {
    int baseDamage = attacker.stats.attack;
    int defense = defender.stats.defense;
    
    int damage = baseDamage - defense;
    if (damage < 1) {
        damage = 1; // Minimum 1 damage
    }
    
    // Add some randomness (±20%)
    int variance = (int)(damage * 0.2f);
    damage += (rand() % (variance * 2 + 1)) - variance;
    
    return std::max(1, damage);
}

bool Combat::DoesHit(const Actor& attacker, const Actor& defender) {
    float hitChance = CalculateHitChance(attacker, defender);
    float roll = (float)rand() / RAND_MAX;
    return roll < hitChance;
}

bool Combat::Attack(Actor& attacker, Actor& defender) {
    if (IsDead(defender)) {
        return false;
    }
    
    if (DoesHit(attacker, defender)) {
        int damage = CalculateDamage(attacker, defender);
        ApplyDamage(defender, damage);
        return true;
    }
    
    return false; // Miss
}

void Combat::ApplyDamage(Actor& target, int damage) {
    target.stats.health -= damage;
    if (target.stats.health < 0) {
        target.stats.health = 0;
    }
}

bool Combat::IsDead(const Actor& actor) {
    return actor.stats.health <= 0;
}

void Combat::Heal(Actor& actor, int amount) {
    actor.stats.health += amount;
    if (actor.stats.health > actor.stats.maxHealth) {
        actor.stats.health = actor.stats.maxHealth;
    }
}

} // namespace Arena
