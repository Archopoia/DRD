import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d';
import { PhysicsWorld } from './PhysicsWorld';
import { GAME_CONFIG } from '@/lib/constants';
import { Debug } from '../utils/debug';

/**
 * Character controller using a kinematic capsule body for FPS movement
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
      const halfHeight = (this.capsuleHeight - 2 * this.capsuleRadius) / 2;
      const colliderDesc = RAPIER.ColliderDesc.capsule(halfHeight, this.capsuleRadius);

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
   * Move the character in the given direction
   */
  move(direction: THREE.Vector3, deltaTime: number): void {
    try {
      // Get current position
      const currentPos = this.rigidBody.translation();

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

      // Calculate new position (combine horizontal and vertical movement)
      const newPos = new RAPIER.Vector3(
        currentPos.x + moveX,
        currentPos.y + moveY,
        currentPos.z + moveZ
      );

      // Set new position (kinematic body)
      this.rigidBody.setNextKinematicTranslation(newPos);
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
      // Check if grounded
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

      // Store vertical velocity for use in move() method
      // Don't apply vertical movement here - it will be combined with horizontal movement
      // in the move() method to avoid conflicts with setNextKinematicTranslation()
    } catch (error) {
      Debug.error('CharacterController', 'Error updating character controller', error as Error);
    }
  }

  /**
   * Check if character is on the ground
   * Uses a simple height-based check for now (can be improved with proper raycasting later)
   */
  private checkGrounded(): void {
    try {
      const currentPos = this.rigidBody.translation();
      const groundLevel = 0.0; // Floor is at y=0
      const capsuleBottom = currentPos.y - this.capsuleHeight / 2;
      const detectionDistance = GAME_CONFIG.CHARACTER_CONTROLLER.GROUND_DETECTION_DISTANCE;
      
      // Simple check: if capsule bottom is close to ground level, we're grounded
      // This is a simplified approach - can be improved with proper raycasting later
      const distanceToGround = Math.abs(capsuleBottom - groundLevel);
      this.isGrounded = distanceToGround <= detectionDistance + this.capsuleRadius;
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

