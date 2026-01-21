import { Component } from '../Component';
import { Entity } from '../Entity';
import * as THREE from 'three';
import { PhysicsWorld } from '../../physics/PhysicsWorld';
import RAPIER from '@dimforge/rapier3d';
import { IScript, ScriptContext } from '@/game/scripts/types';
import { ScriptLoader } from '@/game/scripts/ScriptLoader';

export type TriggerEventType = 'onEnter' | 'onExit' | 'onStay' | 'onInteract';
export type TriggerAction = 'script' | 'loadLevel' | 'spawnEntity' | 'enableEntity' | 'disableEntity';

export interface TriggerProperties {
  shape: 'box' | 'sphere' | 'cylinder';
  size?: { x: number; y: number; z: number };
  radius?: number;
  height?: number;
  eventType: TriggerEventType;
  action: TriggerAction;
  actionData?: {
    scriptPath?: string; // Path to script file (e.g., "scripts/triggers/door")
    scriptName?: string; // Legacy - deprecated, use scriptPath instead
    levelId?: string;
    entityId?: string;
    [key: string]: any;
  };
  oneShot?: boolean; // Trigger only once
  enabled?: boolean;
}

/**
 * Trigger Component - Handles trigger zones for gameplay events
 * Used for doors, level transitions, script triggers, etc.
 */
export class TriggerComponent extends Component {
  public properties: TriggerProperties;
  public collider: RAPIER.Collider | null = null;
  private physicsWorld: PhysicsWorld | null = null;
  private scriptLoader: ScriptLoader | null = null;
  private loadedScript: IScript | null = null;
  private triggered: boolean = false;
  private entitiesInside: Set<number> = new Set(); // Track entities inside trigger
  private scriptLoadPromise: Promise<IScript | null> | null = null;

  constructor(entity: Entity, properties: TriggerProperties, physicsWorld?: PhysicsWorld, scriptLoader?: ScriptLoader) {
    super(entity);
    this.properties = {
      shape: 'box',
      eventType: 'onEnter',
      action: 'script',
      oneShot: false,
      enabled: true,
      ...properties,
    };
    this.physicsWorld = physicsWorld || null;
    this.scriptLoader = scriptLoader || null;
    if (physicsWorld) {
      this.createTriggerCollider();
    }
    // Load script if scriptPath is provided
    if (this.properties.action === 'script' && this.getScriptPath()) {
      this.loadScript();
    }
  }

  /**
   * Create sensor collider for trigger
   */
  createTriggerCollider(): void {
    if (!this.physicsWorld) {
      console.warn('TriggerComponent: No physics world provided, trigger will not be created');
      return;
    }

    // Remove existing collider if any
    if (this.collider) {
      this.physicsWorld.world.removeCollider(this.collider, true);
      this.collider = null;
    }

    // Create collider description based on shape
    let colliderDesc: RAPIER.ColliderDesc;

    switch (this.properties.shape) {
      case 'box':
        const size = this.properties.size || { x: 1, y: 1, z: 1 };
        colliderDesc = RAPIER.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2);
        break;
      case 'sphere':
        const radius = this.properties.radius || 0.5;
        colliderDesc = RAPIER.ColliderDesc.ball(radius);
        break;
      case 'cylinder':
        const cylRadius = this.properties.radius || 0.5;
        const cylHeight = this.properties.height || 1.0;
        colliderDesc = RAPIER.ColliderDesc.cylinder(cylHeight / 2, cylRadius);
        break;
      default:
        colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
    }

    // Set as sensor (no physical collision)
    colliderDesc.setSensor(true);
    
    // Set collision groups - triggers should detect characters/entities
    // Group 2 for triggers, mask 1 to detect group 1 (characters/entities)
    colliderDesc.setCollisionGroups(0x00020001);
    
    // Enable collision events
    colliderDesc.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);

    // Get transform from entity (if available)
    const position = { x: 0, y: 0, z: 0 };
    const rotation = { x: 0, y: 0, z: 0, w: 1 };
    
    // Try to get transform from TransformComponent via EntityManager
    // Note: This requires the EntityManager to be set on the entity
    // For now, we'll use default position and let EntityManager handle transform sync

    // Create a static rigid body for the trigger (triggers are always static)
    const rigidBodyDesc = RAPIER.RigidBodyDesc.fixed();
    const rigidBody = this.physicsWorld.world.createRigidBody(rigidBodyDesc);
    rigidBody.setTranslation(new RAPIER.Vector3(position.x, position.y, position.z), true);
    if (rotation) {
      rigidBody.setRotation(
        new RAPIER.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w),
        true
      );
    }

    // Attach collider to rigid body
    this.collider = this.physicsWorld.world.createCollider(colliderDesc, rigidBody);

    // Store reference in userData for cleanup
    if (this.collider) {
      this.collider.handle = this.entity.id; // Store entity ID for event handling
    }
  }

  /**
   * Get script path from properties
   */
  private getScriptPath(): string | null {
    return this.properties.actionData?.scriptPath || 
           (this.properties.actionData?.scriptName ? `scripts/triggers/${this.properties.actionData.scriptName}` : null);
  }

  /**
   * Load script from file path
   */
  private async loadScript(): Promise<void> {
    const scriptPath = this.getScriptPath();
    if (!scriptPath || !this.scriptLoader) {
      return;
    }

    // If already loading, wait for that promise
    if (this.scriptLoadPromise) {
      await this.scriptLoadPromise;
      return;
    }

    this.scriptLoadPromise = this.scriptLoader.loadScript(scriptPath);
    this.loadedScript = await this.scriptLoadPromise;
    this.scriptLoadPromise = null;

    if (!this.loadedScript) {
      console.warn(`[TriggerComponent] Failed to load script: ${scriptPath}`);
    }
  }

  /**
   * Execute script callback with context
   */
  private async executeScript(callbackName: 'onEnter' | 'onExit' | 'onStay' | 'onInteract', context: ScriptContext): Promise<void> {
    // Ensure script is loaded
    if (!this.loadedScript) {
      await this.loadScript();
    }

    if (!this.loadedScript) {
      console.warn(`[TriggerComponent] Script not loaded, cannot execute ${callbackName}`);
      return;
    }

    const callback = this.loadedScript[callbackName];
    if (callback) {
      try {
        callback(context);
      } catch (error) {
        console.error(`[TriggerComponent] Error executing script ${callbackName}:`, error);
      }
    }
  }

  /**
   * Handle trigger event
   */
  async handleTrigger(eventType: TriggerEventType, entityId: string, scriptContext?: Partial<ScriptContext>): Promise<void> {
    if (!this.properties.enabled) return;
    if (this.properties.oneShot && this.triggered) return;
    if (this.properties.eventType !== eventType) return;

    this.triggered = true;

    // Execute action based on type
    switch (this.properties.action) {
      case 'script': {
        const scriptPath = this.getScriptPath();
        if (!scriptPath) {
          console.warn(`[TriggerComponent] No script path specified for trigger ${this.entity.id}`);
          break;
        }

        // Create script context
        const context: ScriptContext = {
          entity: this.entity,
          triggerComponent: this,
          time: performance.now() / 1000, // Convert to seconds
          deltaTime: 0.016, // Approximate 60 FPS
          data: this.properties.actionData,
          ...scriptContext,
        };

        // Map trigger event type to script callback
        const callbackMap: Record<TriggerEventType, 'onEnter' | 'onExit' | 'onStay' | 'onInteract'> = {
          onEnter: 'onEnter',
          onExit: 'onExit',
          onStay: 'onStay',
          onInteract: 'onInteract',
        };

        const callbackName = callbackMap[eventType];
        if (callbackName) {
          await this.executeScript(callbackName, context);
        }
        break;
      }
      case 'loadLevel':
        // Level loading would go here
        console.log(`Trigger ${this.entity.id}: Load level ${this.properties.actionData?.levelId}`);
        break;
      case 'spawnEntity':
        // Entity spawning would go here
        console.log(`Trigger ${this.entity.id}: Spawn entity ${this.properties.actionData?.entityId}`);
        break;
      case 'enableEntity':
        // Enable entity would go here
        console.log(`Trigger ${this.entity.id}: Enable entity ${this.properties.actionData?.entityId}`);
        break;
      case 'disableEntity':
        // Disable entity would go here
        console.log(`Trigger ${this.entity.id}: Disable entity ${this.properties.actionData?.entityId}`);
        break;
    }
  }

  /**
   * Set script loader (for initialization after creation)
   */
  setScriptLoader(scriptLoader: ScriptLoader): void {
    this.scriptLoader = scriptLoader;
    if (this.properties.action === 'script' && this.getScriptPath()) {
      this.loadScript();
    }
  }

  /**
   * Update trigger state
   */
  update(deltaTime: number): void {
    if (!this.properties.enabled || !this.collider) return;

    // Check for collision events
    // This would be handled by the physics world event queue
    // For now, we'll just update the component state
  }

  /**
   * Reset trigger state
   */
  reset(): void {
    this.triggered = false;
    this.entitiesInside.clear();
  }

  /**
   * Serialize trigger component
   */
  serialize(): any {
    return {
      type: 'TriggerComponent',
      properties: {
        ...this.properties,
      },
      triggered: this.triggered,
    };
  }

  /**
   * Deserialize trigger component
   */
  deserialize(data: any): void {
    this.properties = {
      ...this.properties,
      ...data.properties,
    };
    this.triggered = data.triggered || false;
  }

  /**
   * Clone trigger component
   */
  clone(entity: Entity): TriggerComponent {
    const cloned = new TriggerComponent(entity, { ...this.properties }, this.physicsWorld);
    cloned.enabled = this.enabled;
    cloned.triggered = this.triggered;
    return cloned;
  }

  /**
   * Cleanup trigger collider
   */
  onRemove(): void {
    if (this.collider && this.physicsWorld) {
      this.physicsWorld.world.removeCollider(this.collider, true);
      this.collider = null;
    }
  }

  /**
   * Set physics world (for initialization after creation)
   */
  setPhysicsWorld(physicsWorld: PhysicsWorld): void {
    this.physicsWorld = physicsWorld;
    if (!this.collider) {
      this.createTriggerCollider();
    }
  }
}
