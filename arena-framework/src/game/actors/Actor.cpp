#include "Actor.h"
#include <cmath>
#include <algorithm>

namespace Arena {

void ActorSystem::Update(Actor& actor, float deltaTime) {
    UpdateState(actor, deltaTime);
    actor.stateTimer += deltaTime;
}

void ActorSystem::UpdateAI(Actor& actor, const Vec2& playerPos, float deltaTime) {
    float distToPlayer = (actor.position - playerPos).Length();
    
    switch (actor.state) {
        case ActorState::Idle:
            // Check if player is nearby
            if (distToPlayer < 8.0f && CanSeeTarget(actor, playerPos)) {
                SetState(actor, ActorState::Chase);
            } else if (actor.stateTimer > 2.0f) {
                SetState(actor, ActorState::Patrol);
            }
            break;
            
        case ActorState::Patrol:
            Patrol(actor, deltaTime);
            if (distToPlayer < 8.0f && CanSeeTarget(actor, playerPos)) {
                SetState(actor, ActorState::Chase);
            }
            break;
            
        case ActorState::Chase:
            MoveTowards(actor, playerPos, deltaTime);
            if (distToPlayer < 1.5f) {
                SetState(actor, ActorState::Attack);
            } else if (distToPlayer > 12.0f) {
                SetState(actor, ActorState::Idle);
            }
            break;
            
        case ActorState::Attack:
            if (actor.stateTimer > 1.0f) {
                // Attack animation complete, return to chase
                if (distToPlayer < 1.5f) {
                    actor.stateTimer = 0.0f; // Attack again
                } else {
                    SetState(actor, ActorState::Chase);
                }
            }
            break;
            
        case ActorState::Dead:
            // Do nothing
            break;
    }
}

void ActorSystem::SetState(Actor& actor, ActorState newState) {
    if (actor.state != newState) {
        actor.state = newState;
        actor.stateTimer = 0.0f;
    }
}

void ActorSystem::UpdateState(Actor& actor, float deltaTime) {
    // Check if actor is dead
    if (actor.stats.health <= 0 && actor.state != ActorState::Dead) {
        SetState(actor, ActorState::Dead);
    }
}

void ActorSystem::MoveTowards(Actor& actor, const Vec2& target, float deltaTime) {
    Vec2 direction = (target - actor.position).Normalized();
    float distance = (target - actor.position).Length();
    
    float moveDistance = actor.stats.speed * deltaTime;
    if (moveDistance > distance) {
        moveDistance = distance;
    }
    
    actor.position.x += direction.x * moveDistance;
    actor.position.y += direction.y * moveDistance;
    actor.rotation = atan2f(direction.y, direction.x);
}

void ActorSystem::Patrol(Actor& actor, float deltaTime) {
    // Simple patrol: move in a circle around patrol center
    float angle = actor.stateTimer * 0.5f; // Rotate slowly
    Vec2 offset(cosf(angle) * actor.patrolRadius, sinf(angle) * actor.patrolRadius);
    Vec2 target = actor.patrolCenter + offset;
    
    MoveTowards(actor, target, deltaTime);
    
    // If reached target, pick new angle
    float dist = (actor.position - target).Length();
    if (dist < 0.5f) {
        actor.stateTimer += 1.0f; // Change direction
    }
}

bool ActorSystem::CanSeeTarget(const Actor& actor, const Vec2& target, float maxDistance) {
    float dist = (actor.position - target).Length();
    if (dist > maxDistance) {
        return false;
    }
    
    // Simple line of sight check (could be improved with raycast)
    // For now, just check distance
    return true;
}

void ActorSystem::Attack(Actor& attacker, Actor& target) {
    int damage = attacker.stats.attack - target.stats.defense;
    if (damage < 1) damage = 1;
    
    target.stats.health -= damage;
    if (target.stats.health < 0) {
        target.stats.health = 0;
    }
}

} // namespace Arena
