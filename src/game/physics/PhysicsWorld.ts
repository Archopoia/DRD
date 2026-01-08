import RAPIER from '@dimforge/rapier3d';
import { GAME_CONFIG } from '@/lib/constants';
import { Debug } from '../utils/debug';

/**
 * Manages the Rapier physics world and provides methods to create physics bodies
 */
export class PhysicsWorld {
  public world: RAPIER.World;
  public queryPipeline: RAPIER.QueryPipeline;
  private eventQueue: RAPIER.EventQueue;
  private accumulator: number = 0;

  constructor() {
    Debug.startMeasure('PhysicsWorld.constructor');
    Debug.log('PhysicsWorld', 'Initializing physics world...');

    try {
      // For browser environments, Rapier should be ready, but we call init() to be safe
      // In browser, init() may return immediately if already initialized
      if (typeof RAPIER.init === 'function') {
        RAPIER.init().then(() => {
          Debug.log('PhysicsWorld', 'Rapier initialized');
        }).catch((err) => {
          Debug.warn('PhysicsWorld', 'Rapier init warning (may already be initialized)', err);
        });
      }

      // Create physics world with gravity
      const gravity = new RAPIER.Vector3(
        GAME_CONFIG.PHYSICS.GRAVITY.x,
        GAME_CONFIG.PHYSICS.GRAVITY.y,
        GAME_CONFIG.PHYSICS.GRAVITY.z
      );

      this.world = new RAPIER.World(gravity);
      
      // QueryPipeline is a property of the world, but we'll access it when needed
      // For now, we'll use the world's query methods directly
      this.queryPipeline = this.world.queryPipeline;
      
      // Create event queue for physics step (no parameters needed)
      this.eventQueue = new RAPIER.EventQueue();
      
      Debug.log('PhysicsWorld', 'Physics world created with gravity', gravity);

      Debug.endMeasure('PhysicsWorld.constructor');
      Debug.log('PhysicsWorld', 'Physics world initialized');
    } catch (error) {
      Debug.error('PhysicsWorld', 'Failed to initialize physics world', error as Error);
      throw error;
    }
  }

  /**
   * Step the physics simulation
   * Uses fixed timestep with accumulation for smooth simulation
   */
  step(deltaTime: number): void {
    try {
      // Accumulate time
      this.accumulator += deltaTime;

      // Fixed timestep
      const fixedTimestep = GAME_CONFIG.PHYSICS.TIMESTEP;
      const maxSteps = GAME_CONFIG.PHYSICS.MAX_STEPS;

      // Step physics simulation
      let steps = 0;
      while (this.accumulator >= fixedTimestep && steps < maxSteps) {
        // Rapier's step method: step(eventQueue, timestep)
        this.world.step(this.eventQueue, fixedTimestep);
        this.accumulator -= fixedTimestep;
        steps++;
      }

      // If we hit max steps, reset accumulator to prevent spiral of death
      if (steps >= maxSteps) {
        Debug.warn('PhysicsWorld', 'Max physics steps reached, resetting accumulator');
        this.accumulator = 0;
      }
    } catch (error) {
      Debug.error('PhysicsWorld', 'Error stepping physics', error as Error);
    }
  }

  /**
   * Create a static rigid body (for walls, floor, etc.)
   */
  createStaticBody(
    colliderDesc: RAPIER.ColliderDesc,
    position: { x: number; y: number; z: number },
    rotation?: { x: number; y: number; z: number; w: number }
  ): RAPIER.RigidBody {
    try {
      const rigidBodyDesc = RAPIER.RigidBodyDesc.fixed();
      const rigidBody = this.world.createRigidBody(rigidBodyDesc);

      // Set position
      rigidBody.setTranslation(
        new RAPIER.Vector3(position.x, position.y, position.z),
        true
      );

      // Set rotation if provided
      if (rotation) {
        rigidBody.setRotation(
          new RAPIER.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w),
          true
        );
      }

      // Set collision groups to interact with all objects (group 1, mask 1)
      colliderDesc.setCollisionGroups(0x00010001);
      
      // Set friction for static bodies to prevent objects from sliding through
      colliderDesc.setFriction(0.7);
      colliderDesc.setRestitution(0.0);

      // Attach collider
      this.world.createCollider(colliderDesc, rigidBody);

      Debug.log('PhysicsWorld', 'Created static body at', position);
      return rigidBody;
    } catch (error) {
      Debug.error('PhysicsWorld', 'Failed to create static body', error as Error);
      throw error;
    }
  }

  /**
   * Create a dynamic rigid body (for interactive objects)
   */
  createDynamicBody(
    colliderDesc: RAPIER.ColliderDesc,
    position: { x: number; y: number; z: number },
    mass: number = 1.0,
    rotation?: { x: number; y: number; z: number; w: number }
  ): RAPIER.RigidBody {
    try {
      const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic();
      const rigidBody = this.world.createRigidBody(rigidBodyDesc);

      // Set position
      rigidBody.setTranslation(
        new RAPIER.Vector3(position.x, position.y, position.z),
        true
      );

      // Set rotation if provided
      if (rotation) {
        rigidBody.setRotation(
          new RAPIER.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w),
          true
        );
      }

      // Set mass through collider density
      // Density of 1.0 = 1 kg per cubic meter (approximate)
      // We'll use mass directly as density for simplicity
      colliderDesc.setDensity(mass);

      // Set collision groups to interact with all objects (group 1, mask 1)
      colliderDesc.setCollisionGroups(0x00010001);
      
      // Set friction and restitution for better collision response
      colliderDesc.setFriction(0.7); // Friction to prevent sliding
      colliderDesc.setRestitution(0.0); // No bounce

      // Attach collider
      this.world.createCollider(colliderDesc, rigidBody);

      Debug.log('PhysicsWorld', 'Created dynamic body at', position, 'with mass', mass);
      return rigidBody;
    } catch (error) {
      Debug.error('PhysicsWorld', 'Failed to create dynamic body', error as Error);
      throw error;
    }
  }

  /**
   * Create a kinematic rigid body (for character controller)
   */
  createKinematicBody(
    colliderDesc: RAPIER.ColliderDesc,
    position: { x: number; y: number; z: number },
    rotation?: { x: number; y: number; z: number; w: number }
  ): RAPIER.RigidBody {
    try {
      // Use position-based kinematic for direct position control
      const rigidBodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();
      const rigidBody = this.world.createRigidBody(rigidBodyDesc);

      // Set position
      rigidBody.setTranslation(
        new RAPIER.Vector3(position.x, position.y, position.z),
        true
      );

      // Set rotation if provided
      if (rotation) {
        rigidBody.setRotation(
          new RAPIER.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w),
          true
        );
      }

      // Attach collider
      this.world.createCollider(colliderDesc, rigidBody);

      Debug.log('PhysicsWorld', 'Created kinematic body at', position);
      return rigidBody;
    } catch (error) {
      Debug.error('PhysicsWorld', 'Failed to create kinematic body', error as Error);
      throw error;
    }
  }

  /**
   * Remove a rigid body from the world
   */
  removeBody(rigidBody: RAPIER.RigidBody): void {
    try {
      this.world.removeRigidBody(rigidBody);
      Debug.log('PhysicsWorld', 'Removed rigid body');
    } catch (error) {
      Debug.error('PhysicsWorld', 'Failed to remove rigid body', error as Error);
    }
  }

  /**
   * Cleanup physics world
   */
  dispose(): void {
    try {
      Debug.log('PhysicsWorld', 'Disposing physics world...');
      // Rapier will handle cleanup automatically when world goes out of scope
      this.accumulator = 0;
      Debug.log('PhysicsWorld', 'Physics world disposed');
    } catch (error) {
      Debug.error('PhysicsWorld', 'Error disposing physics world', error as Error);
    }
  }
}

