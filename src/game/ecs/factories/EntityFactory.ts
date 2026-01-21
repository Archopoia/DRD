import { Entity } from '../Entity';
import { EntityManager } from '../EntityManager';
import { TransformComponent } from '../components/TransformComponent';
import { MeshRendererComponent, type MeshGeometry } from '../components/MeshRendererComponent';
import { PhysicsComponent, type PhysicsProperties } from '../components/PhysicsComponent';
import { LightComponent, type LightProperties } from '../components/LightComponent';
import { TriggerComponent, type TriggerProperties } from '../components/TriggerComponent';
import { RetroRenderer } from '../../renderer/RetroRenderer';
import { PhysicsWorld } from '../../physics/PhysicsWorld';
import { ScriptLoader } from '../../scripts/ScriptLoader';
import * as THREE from 'three';

export type EntityType = 'box' | 'sphere' | 'plane' | 'cylinder' | 'light' | 'group' | 'trigger' | 'spawnPoint' | 'npc' | 'item';

export interface EntityFactoryOptions {
  name?: string;
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
  color?: number;
  withPhysics?: boolean;
  physicsType?: 'static' | 'dynamic' | 'kinematic';
  mass?: number;
  lightType?: 'point' | 'directional' | 'spot' | 'ambient';
  lightIntensity?: number;
  lightColor?: number;
  lightDistance?: number;
}

/**
 * EntityFactory - Factory for creating entities with predefined configurations
 * This replaces the hard-coded addObjectToScene method with a modular, scalable approach
 */
export class EntityFactory {
  constructor(
    private entityManager: EntityManager,
    private renderer: RetroRenderer,
    private physicsWorld: PhysicsWorld,
    private scriptLoader?: ScriptLoader
  ) {}

  /**
   * Create a box entity
   */
  createBox(options: EntityFactoryOptions = {}): Entity {
    const name = options.name || 'Box';
    const entity = this.entityManager.createEntity(name);
    const position = options.position || { x: 0, y: 1, z: 0 };
    const rotation = options.rotation || { x: 0, y: 0, z: 0 };
    const scale = options.scale || { x: 1, y: 1, z: 1 };
    const color = options.color || 0x8a4a4a;

    // Add transform component
    const transform = new TransformComponent(
      entity,
      new THREE.Vector3(position.x, position.y, position.z),
      new THREE.Euler(rotation.x * (Math.PI / 180), rotation.y * (Math.PI / 180), rotation.z * (Math.PI / 180)),
      new THREE.Vector3(scale.x, scale.y, scale.z)
    );
    this.entityManager.addComponent(entity, transform);

    // Add mesh renderer component
    const geometry: MeshGeometry = {
      type: 'box',
      width: scale.x,
      height: scale.y,
      depth: scale.z,
    };
    const meshRenderer = new MeshRendererComponent(entity, geometry, color, this.renderer);
    this.entityManager.addComponent(entity, meshRenderer);

    // Add physics component if requested
    if (options.withPhysics) {
      const physicsProps: PhysicsProperties = {
        bodyType: options.physicsType || 'dynamic',
        mass: options.mass || 1.0,
        friction: 0.7,
        restitution: 0.0,
        colliderShape: 'box',
        colliderSize: { x: scale.x / 2, y: scale.y / 2, z: scale.z / 2 },
      };
      const physics = new PhysicsComponent(entity, physicsProps, this.physicsWorld);
      this.entityManager.addComponent(entity, physics);
    }

    return entity;
  }

  /**
   * Create a sphere entity
   */
  createSphere(options: EntityFactoryOptions = {}): Entity {
    const name = options.name || 'Sphere';
    const entity = this.entityManager.createEntity(name);
    const position = options.position || { x: 0, y: 1, z: 0 };
    const rotation = options.rotation || { x: 0, y: 0, z: 0 };
    const scale = options.scale || { x: 1, y: 1, z: 1 };
    const color = options.color || 0x4a8a4a;
    const radius = (scale.x + scale.y + scale.z) / 6; // Average scale as radius

    // Add transform component
    const transform = new TransformComponent(
      entity,
      new THREE.Vector3(position.x, position.y, position.z),
      new THREE.Euler(rotation.x * (Math.PI / 180), rotation.y * (Math.PI / 180), rotation.z * (Math.PI / 180)),
      new THREE.Vector3(scale.x, scale.y, scale.z)
    );
    this.entityManager.addComponent(entity, transform);

    // Add mesh renderer component
    const geometry: MeshGeometry = {
      type: 'sphere',
      radius: radius,
      segments: 16,
    };
    const meshRenderer = new MeshRendererComponent(entity, geometry, color, this.renderer);
    this.entityManager.addComponent(entity, meshRenderer);

    // Add physics component if requested
    if (options.withPhysics) {
      const physicsProps: PhysicsProperties = {
        bodyType: options.physicsType || 'dynamic',
        mass: options.mass || 1.0,
        friction: 0.7,
        restitution: 0.3, // Spheres bounce more
        colliderShape: 'sphere',
        colliderRadius: radius,
      };
      const physics = new PhysicsComponent(entity, physicsProps, this.physicsWorld);
      this.entityManager.addComponent(entity, physics);
    }

    return entity;
  }

  /**
   * Create a plane entity
   */
  createPlane(options: EntityFactoryOptions = {}): Entity {
    const name = options.name || 'Plane';
    const entity = this.entityManager.createEntity(name);
    const position = options.position || { x: 0, y: 0, z: 0 };
    const rotation = options.rotation || { x: -90, y: 0, z: 0 }; // Default horizontal
    const scale = options.scale || { x: 1, y: 1, z: 1 };
    const color = options.color || 0x4a4a8a;

    // Add transform component
    const transform = new TransformComponent(
      entity,
      new THREE.Vector3(position.x, position.y, position.z),
      new THREE.Euler(rotation.x * (Math.PI / 180), rotation.y * (Math.PI / 180), rotation.z * (Math.PI / 180)),
      new THREE.Vector3(scale.x, scale.y, scale.z)
    );
    this.entityManager.addComponent(entity, transform);

    // Add mesh renderer component
    const geometry: MeshGeometry = {
      type: 'plane',
      planeWidth: scale.x * 2,
      planeHeight: scale.z * 2,
    };
    const meshRenderer = new MeshRendererComponent(entity, geometry, color, this.renderer);
    this.entityManager.addComponent(entity, meshRenderer);

    // Add physics component if requested (planes are usually static)
    if (options.withPhysics !== false) {
      const physicsProps: PhysicsProperties = {
        bodyType: 'static',
        friction: 0.7,
        restitution: 0.0,
        colliderShape: 'plane',
      };
      const physics = new PhysicsComponent(entity, physicsProps, this.physicsWorld);
      this.entityManager.addComponent(entity, physics);
    }

    return entity;
  }

  /**
   * Create a cylinder entity
   */
  createCylinder(options: EntityFactoryOptions = {}): Entity {
    const name = options.name || 'Cylinder';
    const entity = this.entityManager.createEntity(name);
    const position = options.position || { x: 0, y: 1, z: 0 };
    const rotation = options.rotation || { x: 0, y: 0, z: 0 };
    const scale = options.scale || { x: 1, y: 1, z: 1 };
    const color = options.color || 0x8a8a4a;
    const radius = (scale.x + scale.z) / 4; // Average X/Z scale as radius
    const height = scale.y;

    // Add transform component
    const transform = new TransformComponent(
      entity,
      new THREE.Vector3(position.x, position.y, position.z),
      new THREE.Euler(rotation.x * (Math.PI / 180), rotation.y * (Math.PI / 180), rotation.z * (Math.PI / 180)),
      new THREE.Vector3(scale.x, scale.y, scale.z)
    );
    this.entityManager.addComponent(entity, transform);

    // Add mesh renderer component
    const geometry: MeshGeometry = {
      type: 'cylinder',
      cylinderRadius: radius,
      cylinderHeight: height,
      segments: 16,
    };
    const meshRenderer = new MeshRendererComponent(entity, geometry, color, this.renderer);
    this.entityManager.addComponent(entity, meshRenderer);

    // Add physics component if requested
    if (options.withPhysics) {
      const physicsProps: PhysicsProperties = {
        bodyType: options.physicsType || 'dynamic',
        mass: options.mass || 1.0,
        friction: 0.7,
        restitution: 0.0,
        colliderShape: 'cylinder',
        colliderRadius: radius,
        colliderHeight: height,
      };
      const physics = new PhysicsComponent(entity, physicsProps, this.physicsWorld);
      this.entityManager.addComponent(entity, physics);
    }

    return entity;
  }

  /**
   * Create a light entity
   */
  createLight(options: EntityFactoryOptions = {}): Entity {
    const name = options.name || 'Light';
    const entity = this.entityManager.createEntity(name);
    const position = options.position || { x: 0, y: 3, z: 0 };
    const lightType = options.lightType || 'point';
    const intensity = options.lightIntensity || 1.0;
    const color = options.lightColor || 0xffffff;
    const distance = options.lightDistance || 10;

    // Add transform component
    const transform = new TransformComponent(
      entity,
      new THREE.Vector3(position.x, position.y, position.z),
      new THREE.Euler(0, 0, 0),
      new THREE.Vector3(1, 1, 1)
    );
    this.entityManager.addComponent(entity, transform);

    // Add light component
    const lightProps: LightProperties = {
      type: lightType,
      color: color,
      intensity: intensity,
      distance: distance,
    };
    const light = new LightComponent(entity, lightProps);
    this.entityManager.addComponent(entity, light);

    return entity;
  }

  /**
   * Create an empty group entity (just transform, no visual/physics)
   */
  createGroup(options: EntityFactoryOptions = {}): Entity {
    const name = options.name || 'Group';
    const entity = this.entityManager.createEntity(name);
    const position = options.position || { x: 0, y: 0, z: 0 };
    const rotation = options.rotation || { x: 0, y: 0, z: 0 };
    const scale = options.scale || { x: 1, y: 1, z: 1 };

    // Add transform component only
    const transform = new TransformComponent(
      entity,
      new THREE.Vector3(position.x, position.y, position.z),
      new THREE.Euler(rotation.x * (Math.PI / 180), rotation.y * (Math.PI / 180), rotation.z * (Math.PI / 180)),
      new THREE.Vector3(scale.x, scale.y, scale.z)
    );
    this.entityManager.addComponent(entity, transform);

    return entity;
  }

  /**
   * Create a trigger zone entity
   */
  createTriggerZone(options: EntityFactoryOptions & {
    triggerShape?: 'box' | 'sphere' | 'cylinder';
    triggerSize?: { x: number; y: number; z: number };
    triggerRadius?: number;
    triggerHeight?: number;
    eventType?: 'onEnter' | 'onExit' | 'onStay' | 'onInteract';
    action?: 'script' | 'loadLevel' | 'spawnEntity' | 'enableEntity' | 'disableEntity';
    actionData?: Record<string, any>;
    oneShot?: boolean;
  } = {}): Entity {
    const name = options.name || 'Trigger Zone';
    const entity = this.entityManager.createEntity(name);
    const position = options.position || { x: 0, y: 1, z: 0 };
    const rotation = options.rotation || { x: 0, y: 0, z: 0 };
    const scale = options.scale || { x: 1, y: 1, z: 1 };

    // Add transform component
    const transform = new TransformComponent(
      entity,
      new THREE.Vector3(position.x, position.y, position.z),
      new THREE.Euler(rotation.x * (Math.PI / 180), rotation.y * (Math.PI / 180), rotation.z * (Math.PI / 180)),
      new THREE.Vector3(scale.x, scale.y, scale.z)
    );
    this.entityManager.addComponent(entity, transform);

    // Add trigger component
    const triggerProps: TriggerProperties = {
      shape: options.triggerShape || 'box',
      size: options.triggerSize || { x: scale.x, y: scale.y, z: scale.z },
      radius: options.triggerRadius || (scale.x + scale.y) / 4,
      height: options.triggerHeight || scale.y,
      eventType: options.eventType || 'onEnter',
      action: options.action || 'script',
      actionData: options.actionData || {},
      oneShot: options.oneShot || false,
      enabled: true,
    };
    const trigger = new TriggerComponent(entity, triggerProps, this.physicsWorld, this.scriptLoader);
    this.entityManager.addComponent(entity, trigger);

    // Add a visual representation (wireframe box) for visualization
    const geometry: MeshGeometry = {
      type: 'box',
      width: triggerProps.size?.x || scale.x,
      height: triggerProps.size?.y || scale.y,
      depth: triggerProps.size?.z || scale.z,
    };
    const wireframeColor = 0x00ff00; // Green wireframe for triggers
    const meshRenderer = new MeshRendererComponent(entity, geometry, wireframeColor, this.renderer);
    // Create wireframe material for trigger visualization
    if (meshRenderer.getMesh()) {
      const mesh = meshRenderer.getMesh() as THREE.Mesh;
      if (mesh.material instanceof THREE.MeshStandardMaterial) {
        mesh.material.wireframe = true;
        mesh.material.transparent = true;
        mesh.material.opacity = 0.3;
      }
      mesh.userData.isTrigger = true;
    }
    this.entityManager.addComponent(entity, meshRenderer);

    return entity;
  }

  /**
   * Create a spawn point entity (for player start position)
   */
  createSpawnPoint(options: EntityFactoryOptions = {}): Entity {
    const name = options.name || 'Spawn Point';
    const entity = this.entityManager.createEntity(name);
    const position = options.position || { x: 0, y: 1, z: 0 };
    
    // Add transform component
    const transform = new TransformComponent(
      entity,
      new THREE.Vector3(position.x, position.y, position.z),
      new THREE.Euler(0, 0, 0),
      new THREE.Vector3(1, 1, 1)
    );
    this.entityManager.addComponent(entity, transform);

    // Add visual marker (small cylinder pointing up)
    const geometry: MeshGeometry = {
      type: 'cylinder',
      cylinderRadius: 0.2,
      cylinderHeight: 0.5,
    };
    const meshRenderer = new MeshRendererComponent(entity, geometry, 0x00ff00, this.renderer);
    this.entityManager.addComponent(entity, meshRenderer);
    
    // Add tag for easy identification
    entity.addTag('spawnPoint');
    
    return entity;
  }

  /**
   * Create an NPC entity (non-player character)
   */
  createNPC(options: EntityFactoryOptions = {}): Entity {
    const name = options.name || 'NPC';
    const entity = this.entityManager.createEntity(name);
    const position = options.position || { x: 0, y: 1, z: 0 };
    const color = options.color || 0xffaa00; // Orange/yellow for NPCs
    
    // Add transform component
    const transform = new TransformComponent(
      entity,
      new THREE.Vector3(position.x, position.y, position.z),
      new THREE.Euler(0, 0, 0),
      new THREE.Vector3(1, 2, 1) // Human-like proportions
    );
    this.entityManager.addComponent(entity, transform);

    // Add visual representation (capsule/cylinder body)
    const geometry: MeshGeometry = {
      type: 'cylinder',
      cylinderRadius: 0.3,
      cylinderHeight: 1.8,
    };
    const meshRenderer = new MeshRendererComponent(entity, geometry, color, this.renderer);
    this.entityManager.addComponent(entity, meshRenderer);

    // Add physics for NPC collision
    if (options.withPhysics !== false) {
      const physicsProps: PhysicsProperties = {
        bodyType: 'kinematic', // NPCs don't fall but can be pushed
        mass: 1.0,
        friction: 0.7,
        restitution: 0.0,
        colliderShape: 'capsule',
        colliderSize: { x: 0.3, y: 0.9, z: 0.3 },
      };
      const physics = new PhysicsComponent(entity, physicsProps, this.physicsWorld);
      this.entityManager.addComponent(entity, physics);
    }
    
    // Add tag for easy identification
    entity.addTag('npc');
    
    return entity;
  }

  /**
   * Create an item entity (pickup/pickable object)
   */
  createItem(options: EntityFactoryOptions = {}): Entity {
    const name = options.name || 'Item';
    const entity = this.entityManager.createEntity(name);
    const position = options.position || { x: 0, y: 1, z: 0 };
    const color = options.color || 0xffff00; // Yellow/gold for items
    
    // Add transform component
    const transform = new TransformComponent(
      entity,
      new THREE.Vector3(position.x, position.y, position.z),
      new THREE.Euler(0, 0, 0),
      new THREE.Vector3(0.3, 0.3, 0.3) // Small item
    );
    this.entityManager.addComponent(entity, transform);

    // Add visual representation (small sphere or box)
    const geometry: MeshGeometry = {
      type: 'sphere',
      radius: 0.3,
    };
    const meshRenderer = new MeshRendererComponent(entity, geometry, color, this.renderer);
    this.entityManager.addComponent(entity, meshRenderer);

    // Add physics for item (small, lightweight)
    if (options.withPhysics !== false) {
      const physicsProps: PhysicsProperties = {
        bodyType: 'dynamic',
        mass: 0.1, // Lightweight items
        friction: 0.5,
        restitution: 0.3, // Slight bounce
        colliderShape: 'sphere',
        colliderSize: { x: 0.3, y: 0.3, z: 0.3 },
      };
      const physics = new PhysicsComponent(entity, physicsProps, this.physicsWorld);
      this.entityManager.addComponent(entity, physics);
    }
    
    // Add tag for easy identification
    entity.addTag('item');
    
    return entity;
  }

  /**
   * Create entity by type (convenience method)
   */
  createByType(type: EntityType, options: EntityFactoryOptions = {}): Entity {
    switch (type) {
      case 'box':
        return this.createBox(options);
      case 'sphere':
        return this.createSphere(options);
      case 'plane':
        return this.createPlane(options);
      case 'cylinder':
        return this.createCylinder(options);
      case 'light':
        return this.createLight(options);
      case 'group':
        return this.createGroup(options);
      case 'trigger':
        return this.createTriggerZone(options);
      case 'spawnPoint':
        return this.createSpawnPoint(options);
      case 'npc':
        return this.createNPC(options);
      case 'item':
        return this.createItem(options);
      default:
        throw new Error(`Unknown entity type: ${type}`);
    }
  }
}




