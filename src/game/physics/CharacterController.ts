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
      // Returns blocking collision info: { blocked: boolean, dynamicBodies: Array<{body: RigidBody, contactPoint: Vector3}> }
      // Blocks block movement but can be pushed
      const checkCollisions = (pos: RAPIER.Vector3): { blocked: boolean; dynamicBodies: Array<{body: RAPIER.RigidBody; contactPoint: RAPIER.Vector3}> } => {
        let hasBlockingCollision = false;
        const dynamicBodies: Array<{body: RAPIER.RigidBody; contactPoint: RAPIER.Vector3}> = [];
        
        world.intersectionsWithShape(
          pos,
          shapeRot,
          shape,
          (collider) => {
            // Exclude our own collider by checking if it belongs to our rigid body
            const colliderBody = collider.parent();
            if (colliderBody && colliderBody.handle !== this.rigidBody.handle) {
              const bodyType = colliderBody.bodyType();
              
              if (bodyType === RAPIER.RigidBodyType.Fixed) {
                // Static body (wall) - blocks movement
                hasBlockingCollision = true;
                return false; // Stop on first blocking collision
              } else if (bodyType === RAPIER.RigidBodyType.Dynamic) {
                // Dynamic body (block) - blocks movement but can be pushed
                // Calculate contact point: find where character touches the block
                const blockPos = colliderBody.translation();
                const blockCollider = colliderBody.collider(0);
                
                // Get block's shape to determine half-extents
                // For cuboid blocks, we can calculate the contact point on the surface
                const shapeType = blockCollider.shapeType();
                let contactPoint: RAPIER.Vector3;
                
                if (shapeType === RAPIER.ShapeType.Cuboid) {
                  // Get half-extents from the cuboid shape
                  const cuboidShape = blockCollider.shape as RAPIER.Cuboid;
                  const halfExtents = cuboidShape.halfExtents;
                  
                  // Calculate direction from block center to character (in block's local space)
                  const toCharacter = new RAPIER.Vector3(
                    currentPos.x - blockPos.x,
                    currentPos.y - blockPos.y,
                    currentPos.z - blockPos.z
                  );
                  
                  // Normalize the direction
                  const length = Math.sqrt(
                    toCharacter.x * toCharacter.x +
                    toCharacter.y * toCharacter.y +
                    toCharacter.z * toCharacter.z
                  );
                  
                  if (length > 0.001) {
                    // Find the closest point on the block's surface
                    // Clamp to the block's bounds, then project to surface
                    const clampedX = Math.max(-halfExtents.x, Math.min(halfExtents.x, toCharacter.x));
                    const clampedY = Math.max(-halfExtents.y, Math.min(halfExtents.y, toCharacter.y));
                    const clampedZ = Math.max(-halfExtents.z, Math.min(halfExtents.z, toCharacter.z));
                    
                    // Find which face is closest (largest distance from center)
                    const distX = Math.abs(toCharacter.x);
                    const distY = Math.abs(toCharacter.y);
                    const distZ = Math.abs(toCharacter.z);
                    
                    let surfaceX = clampedX;
                    let surfaceY = clampedY;
                    let surfaceZ = clampedZ;
                    
                    // Project to the closest face
                    if (distX >= distY && distX >= distZ) {
                      // X face is closest
                      surfaceX = toCharacter.x > 0 ? halfExtents.x : -halfExtents.x;
                    } else if (distY >= distX && distY >= distZ) {
                      // Y face is closest
                      surfaceY = toCharacter.y > 0 ? halfExtents.y : -halfExtents.y;
                    } else {
                      // Z face is closest
                      surfaceZ = toCharacter.z > 0 ? halfExtents.z : -halfExtents.z;
                    }
                    
                    // Convert back to world space
                    contactPoint = new RAPIER.Vector3(
                      blockPos.x + surfaceX,
                      blockPos.y + surfaceY,
                      blockPos.z + surfaceZ
                    );
                  } else {
                    // Character is at block center, use character position
                    contactPoint = new RAPIER.Vector3(
                      currentPos.x,
                      currentPos.y,
                      currentPos.z
                    );
                  }
                } else {
                  // For non-cuboid shapes, use character position as fallback
                  contactPoint = new RAPIER.Vector3(
                    currentPos.x,
                    currentPos.y,
                    currentPos.z
                  );
                }
                
                dynamicBodies.push({ body: colliderBody, contactPoint });
                hasBlockingCollision = true; // Block movement through it
              }
              // Kinematic bodies are also allowed (we're already excluding our own)
            }
            return true; // Continue query
          },
          undefined, // filter
          undefined // groups
        );
        
        return { blocked: hasBlockingCollision, dynamicBodies };
      };

      // First, try horizontal movement (X and Z together)
      if (moveX !== 0 || moveZ !== 0) {
        const horizontalTarget = new RAPIER.Vector3(
          currentPos.x + moveX,
          currentPos.y,
          currentPos.z + moveZ
        );

        const collision = checkCollisions(horizontalTarget);
        
        if (!collision.blocked) {
          // Can move horizontally
          targetPos.x = horizontalTarget.x;
          targetPos.z = horizontalTarget.z;
        } else {
          // Check if we're blocked by blocks that can be pushed
          if (collision.dynamicBodies.length > 0) {
            // Calculate push direction and force
            const moveLength = Math.sqrt(moveX * moveX + moveZ * moveZ);
            if (moveLength > 0.01) {
              const normalizedX = moveX / moveLength;
              const normalizedZ = moveZ / moveLength;
              // Reduced force - more realistic pushing
              const forceMagnitude = 1.0; // Much lower force for more realistic pushing
              const pushForce = new RAPIER.Vector3(normalizedX * forceMagnitude, 0, normalizedZ * forceMagnitude);
              
              for (const blockInfo of collision.dynamicBodies) {
                const blockPos = blockInfo.body.translation();
                const blockCenter = new RAPIER.Vector3(blockPos.x, blockPos.y, blockPos.z);
                
                // Calculate distance from block center to contact point to verify it's at edge
                const contactToCenter = new RAPIER.Vector3(
                  blockInfo.contactPoint.x - blockCenter.x,
                  blockInfo.contactPoint.y - blockCenter.y,
                  blockInfo.contactPoint.z - blockCenter.z
                );
                const distanceFromCenter = Math.sqrt(
                  contactToCenter.x * contactToCenter.x +
                  contactToCenter.y * contactToCenter.y +
                  contactToCenter.z * contactToCenter.z
                );
                
                Debug.log('CharacterController', `Pushing block: force=${forceMagnitude.toFixed(2)}, contact at (${blockInfo.contactPoint.x.toFixed(2)}, ${blockInfo.contactPoint.y.toFixed(2)}, ${blockInfo.contactPoint.z.toFixed(2)}), block center (${blockCenter.x.toFixed(2)}, ${blockCenter.y.toFixed(2)}, ${blockCenter.z.toFixed(2)}), distance from center=${distanceFromCenter.toFixed(2)}`);
                
                // Apply impulse at the contact point (where character touches block)
                // This creates realistic rotation when pushing on edges
                blockInfo.body.applyImpulseAtPoint(pushForce, blockInfo.contactPoint, true);
              }
            }
            
            // Don't move the character into the block - stay at current position
            // The physics engine will handle pushing the block, and next frame we can move closer
            // This prevents getting stuck inside blocks
            targetPos.x = currentPos.x;
            targetPos.z = currentPos.z;
          } else {
            // Blocked by static body (wall) - try X and Z separately for sliding
            // Try X only
            if (moveX !== 0) {
              const xOnlyTarget = new RAPIER.Vector3(
                currentPos.x + moveX,
                currentPos.y,
                currentPos.z
              );
              const xCollision = checkCollisions(xOnlyTarget);
              if (!xCollision.blocked) {
                targetPos.x = xOnlyTarget.x;
              } else if (xCollision.dynamicBodies.length > 0) {
                // Pushing block in X direction
                const moveLength = Math.abs(moveX);
                if (moveLength > 0.01) {
                  const pushDirection = moveX > 0 ? 1 : -1;
                  const forceMagnitude = 1.0; // Reduced force
                  const pushForce = new RAPIER.Vector3(pushDirection * forceMagnitude, 0, 0);
                  
                  for (const blockInfo of xCollision.dynamicBodies) {
                    const blockPos = blockInfo.body.translation();
                    Debug.log('CharacterController', `Pushing block X: force=${forceMagnitude.toFixed(2)}, contact (${blockInfo.contactPoint.x.toFixed(2)}, ${blockInfo.contactPoint.y.toFixed(2)}, ${blockInfo.contactPoint.z.toFixed(2)}), block center (${blockPos.x.toFixed(2)}, ${blockPos.y.toFixed(2)}, ${blockPos.z.toFixed(2)})`);
                    
                    // Apply force at contact point for realistic rotation
                    blockInfo.body.applyImpulseAtPoint(pushForce, blockInfo.contactPoint, true);
                  }
                }
                // Don't move into the block - stay at current position
                // Physics will push the block, next frame we can move closer
              }
            }

            // Try Z only
            if (moveZ !== 0) {
              const zOnlyTarget = new RAPIER.Vector3(
                currentPos.x,
                currentPos.y,
                currentPos.z + moveZ
              );
              const zCollision = checkCollisions(zOnlyTarget);
              if (!zCollision.blocked) {
                targetPos.z = zOnlyTarget.z;
              } else if (zCollision.dynamicBodies.length > 0) {
                // Pushing block in Z direction
                const moveLength = Math.abs(moveZ);
                if (moveLength > 0.01) {
                  const pushDirection = moveZ > 0 ? 1 : -1;
                  const forceMagnitude = 1.0; // Reduced force
                  const pushForce = new RAPIER.Vector3(0, 0, pushDirection * forceMagnitude);
                  
                  for (const blockInfo of zCollision.dynamicBodies) {
                    const blockPos = blockInfo.body.translation();
                    Debug.log('CharacterController', `Pushing block Z: force=${forceMagnitude.toFixed(2)}, contact (${blockInfo.contactPoint.x.toFixed(2)}, ${blockInfo.contactPoint.y.toFixed(2)}, ${blockInfo.contactPoint.z.toFixed(2)}), block center (${blockPos.x.toFixed(2)}, ${blockPos.y.toFixed(2)}, ${blockPos.z.toFixed(2)})`);
                    
                    // Apply force at contact point for realistic rotation
                    blockInfo.body.applyImpulseAtPoint(pushForce, blockInfo.contactPoint, true);
                  }
                }
                // Don't move into the block - stay at current position
                // Physics will push the block, next frame we can move closer
              }
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

        const verticalCollision = checkCollisions(verticalTarget);
        
        if (!verticalCollision.blocked) {
          // Can move vertically
          targetPos.y = verticalTarget.y;
        } else {
          // Check if we're standing on a block (moving down)
          if (moveY < 0 && verticalCollision.dynamicBodies.length > 0) {
            // Standing on a block - apply downward force at contact point
            // This allows pushing blocks down or making them rotate when standing on edges
            const forceMagnitude = 1.0; // Reduced force
            const pushForce = new RAPIER.Vector3(0, moveY * forceMagnitude, 0);
            
            for (const blockInfo of verticalCollision.dynamicBodies) {
              const blockPos = blockInfo.body.translation();
              Debug.log('CharacterController', `Standing on block: force=${forceMagnitude.toFixed(2)}, contact (${blockInfo.contactPoint.x.toFixed(2)}, ${blockInfo.contactPoint.y.toFixed(2)}, ${blockInfo.contactPoint.z.toFixed(2)}), block center (${blockPos.x.toFixed(2)}, ${blockPos.y.toFixed(2)}, ${blockPos.z.toFixed(2)})`);
              
              // Apply force at contact point (where we're standing)
              blockInfo.body.applyImpulseAtPoint(pushForce, blockInfo.contactPoint, true);
            }
          }
          
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

