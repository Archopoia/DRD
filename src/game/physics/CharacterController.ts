import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d';
import { PhysicsWorld } from './PhysicsWorld';
import { GAME_CONFIG } from '@/lib/constants';
import { Debug } from '../utils/debug';

/**
 * Character controller using a kinematic capsule body for FPS movement
 * Uses collision queries to properly detect and respond to collisions
 */
export class CharacterController {
  private rigidBody: RAPIER.RigidBody;
  private physicsWorld: PhysicsWorld;
  private velocity: THREE.Vector3;
  private verticalVelocity: number = 0; // Track vertical velocity for jumping/falling
  private isGrounded: boolean = false;
  private wantsToJump: boolean = false;
  private capsuleHeight: number;
  private capsuleRadius: number;
  private halfHeight: number;

  constructor(physicsWorld: PhysicsWorld, position: { x: number; y: number; z: number }) {
    Debug.startMeasure('CharacterController.constructor');
    Debug.log('CharacterController', 'Initializing character controller...');

    try {
      this.physicsWorld = physicsWorld;
      this.velocity = new THREE.Vector3();

      // Get capsule dimensions from config
      this.capsuleHeight = GAME_CONFIG.CHARACTER_CONTROLLER.HEIGHT;
      this.capsuleRadius = GAME_CONFIG.CHARACTER_CONTROLLER.RADIUS;

      // Create capsule collider
      // Capsule: halfHeight is the distance from center to top/bottom of cylinder part
      // Total height = 2 * halfHeight + 2 * radius
      // We want total height = capsuleHeight, so: halfHeight = (capsuleHeight - 2*radius) / 2
      this.halfHeight = (this.capsuleHeight - 2 * this.capsuleRadius) / 2;
      const colliderDesc = RAPIER.ColliderDesc.capsule(this.halfHeight, this.capsuleRadius);
      
      // Set collision groups to interact with all objects
      colliderDesc.setCollisionGroups(0x00010001); // Group 1, mask 1 (interacts with everything)
      colliderDesc.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);

      // Create kinematic rigid body
      this.rigidBody = physicsWorld.createKinematicBody(
        colliderDesc,
        position
      );

      Debug.log('CharacterController', 'Character controller initialized at', position);
      Debug.endMeasure('CharacterController.constructor');
    } catch (error) {
      Debug.error('CharacterController', 'Failed to initialize character controller', error as Error);
      throw error;
    }
  }

  /**
   * Move the character in the given direction with collision detection
   */
  move(direction: THREE.Vector3, deltaTime: number): void {
    try {
      const currentPos = this.rigidBody.translation();
      const world = this.physicsWorld.world;

      // Calculate horizontal movement
      let moveX = 0;
      let moveZ = 0;
      
      if (direction.length() > 0) {
        // Normalize direction
        const normalizedDir = direction.clone().normalize();

        // Calculate movement speed
        const speed = GAME_CONFIG.MOVE_SPEED;
        const moveVector = normalizedDir.multiplyScalar(speed * deltaTime);
        moveX = moveVector.x;
        moveZ = moveVector.z;
      }

      // Apply vertical velocity (from jumping/gravity)
      const moveY = this.verticalVelocity * deltaTime;

      // Start with current position
      const targetPos = new RAPIER.Vector3(currentPos.x, currentPos.y, currentPos.z);
      
      // Check for collisions using intersection query
      const shape = new RAPIER.Capsule(this.halfHeight, this.capsuleRadius);
      const shapeRot = this.rigidBody.rotation();
      
      // Helper function to check for collisions at a position
      // Returns true if there's a blocking collision (static bodies), false otherwise
      // Dynamic bodies are allowed (can be pushed)
      const checkCollisions = (pos: RAPIER.Vector3): boolean => {
        let hasBlockingCollision = false;
        world.intersectionsWithShape(
          pos,
          shapeRot,
          shape,
          (collider) => {
            // Exclude our own collider by checking if it belongs to our rigid body
            const colliderBody = collider.parent();
            if (colliderBody && colliderBody.handle !== this.rigidBody.handle) {
              // Check if it's a static body (wall) - these block movement
              // Dynamic bodies (blocks) can be pushed, so we allow movement through them
              const bodyType = colliderBody.bodyType();
              if (bodyType === RAPIER.RigidBodyType.Fixed) {
                // Static body (wall) - blocks movement
                hasBlockingCollision = true;
                return false; // Stop on first blocking collision
              }
              // Dynamic body - allow movement (can push it)
              // Kinematic bodies are also allowed (we're already excluding our own)
            }
            return true; // Continue query
          },
          undefined, // filter
          undefined // groups
        );
        return hasBlockingCollision;
      };

      // First, try horizontal movement (X and Z together)
      if (moveX !== 0 || moveZ !== 0) {
        const horizontalTarget = new RAPIER.Vector3(
          currentPos.x + moveX,
          currentPos.y,
          currentPos.z + moveZ
        );

        if (!checkCollisions(horizontalTarget)) {
          // Can move horizontally
          targetPos.x = horizontalTarget.x;
          targetPos.z = horizontalTarget.z;
        } else {
          // Can't move horizontally, try X and Z separately for sliding
          // Try X only
          if (moveX !== 0) {
            const xOnlyTarget = new RAPIER.Vector3(
              currentPos.x + moveX,
              currentPos.y,
              currentPos.z
            );
            if (!checkCollisions(xOnlyTarget)) {
              targetPos.x = xOnlyTarget.x;
            }
          }

          // Try Z only
          if (moveZ !== 0) {
            const zOnlyTarget = new RAPIER.Vector3(
              currentPos.x,
              currentPos.y,
              currentPos.z + moveZ
            );
            if (!checkCollisions(zOnlyTarget)) {
              targetPos.z = zOnlyTarget.z;
            }
          }
        }
      }

      // Then handle vertical movement (gravity/jumping) separately
      if (moveY !== 0) {
        const verticalTarget = new RAPIER.Vector3(
          targetPos.x,
          currentPos.y + moveY,
          targetPos.z
        );

        if (!checkCollisions(verticalTarget)) {
          // Can move vertically
          targetPos.y = verticalTarget.y;
        } else {
          // Blocked vertically
          if (moveY < 0) {
            // Hitting something below - stay at current Y (we're on ground)
            targetPos.y = currentPos.y;
          } else {
            // Hitting something above - stay at current Y (can't jump through ceiling)
            targetPos.y = currentPos.y;
          }
        }
      }

      // Set new position (kinematic body)
      this.rigidBody.setNextKinematicTranslation(targetPos);
    } catch (error) {
      Debug.error('CharacterController', 'Error moving character', error as Error);
    }
  }

  /**
   * Apply jump force
   */
  jump(): void {
    if (this.isGrounded) {
      this.wantsToJump = true;
    }
  }

  /**
   * Update character controller (call each frame)
   * Handles ground detection, jumping, and gravity
   */
  update(deltaTime: number): void {
    try {
      // Check if grounded using proper collision detection
      this.checkGrounded();

      // Handle jumping
      if (this.wantsToJump && this.isGrounded) {
        // Set initial jump velocity
        this.verticalVelocity = GAME_CONFIG.CHARACTER_CONTROLLER.JUMP_FORCE;
        this.wantsToJump = false;
      }

      // Apply gravity to vertical velocity
      if (!this.isGrounded) {
        const gravity = GAME_CONFIG.PHYSICS.GRAVITY.y;
        this.verticalVelocity += gravity * deltaTime;
      } else {
        // Reset vertical velocity when grounded
        if (this.verticalVelocity < 0) {
          this.verticalVelocity = 0;
        }
      }
    } catch (error) {
      Debug.error('CharacterController', 'Error updating character controller', error as Error);
    }
  }

  /**
   * Check if character is on the ground using intersection queries
   */
  private checkGrounded(): void {
    try {
      const currentPos = this.rigidBody.translation();
      const world = this.physicsWorld.world;

      // Check for ground by testing a position slightly below the capsule bottom
      const groundCheckDistance = this.capsuleRadius + GAME_CONFIG.CHARACTER_CONTROLLER.GROUND_DETECTION_DISTANCE;
      const groundCheckPos = new RAPIER.Vector3(
        currentPos.x,
        currentPos.y - this.capsuleHeight / 2 - groundCheckDistance / 2,
        currentPos.z
      );
      
      // Use a small capsule shape for ground detection (slightly smaller than our actual capsule)
      const checkRadius = this.capsuleRadius * 0.9;
      const checkHalfHeight = groundCheckDistance / 2;
      const shape = new RAPIER.Capsule(checkHalfHeight, checkRadius);
      const shapeRot = this.rigidBody.rotation();
      
      // Check for intersections below
      let foundGround = false;
      world.intersectionsWithShape(
        groundCheckPos,
        shapeRot,
        shape,
        (collider) => {
          // Exclude our own collider by checking if it belongs to our rigid body
          const colliderBody = collider.parent();
          if (colliderBody && colliderBody.handle !== this.rigidBody.handle) {
            foundGround = true;
            return false; // Stop query on first hit
          }
          return true; // Continue query
        },
        undefined, // filter
        undefined // groups
      );

      this.isGrounded = foundGround;
    } catch (error) {
      Debug.error('CharacterController', 'Error checking ground', error as Error);
      this.isGrounded = false;
    }
  }

  /**
   * Get current position
   */
  getPosition(): THREE.Vector3 {
    const pos = this.rigidBody.translation();
    return new THREE.Vector3(pos.x, pos.y, pos.z);
  }

  /**
   * Set position (teleport)
   */
  setPosition(position: THREE.Vector3): void {
    try {
      this.rigidBody.setTranslation(
        new RAPIER.Vector3(position.x, position.y, position.z),
        true
      );
      Debug.log('CharacterController', 'Character teleported to', position);
    } catch (error) {
      Debug.error('CharacterController', 'Error setting position', error as Error);
    }
  }

  /**
   * Check if character is grounded
   */
  isGroundedCheck(): boolean {
    return this.isGrounded;
  }

  /**
   * Get the rigid body (for advanced operations)
   */
  getRigidBody(): RAPIER.RigidBody {
    return this.rigidBody;
  }

  /**
   * Cleanup character controller
   */
  dispose(): void {
    try {
      Debug.log('CharacterController', 'Disposing character controller...');
      this.physicsWorld.removeBody(this.rigidBody);
      Debug.log('CharacterController', 'Character controller disposed');
    } catch (error) {
      Debug.error('CharacterController', 'Error disposing character controller', error as Error);
    }
  }
}

