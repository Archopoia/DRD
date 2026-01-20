import { Entity } from '../Entity';
import { EntityManager } from '../EntityManager';
import { TransformComponent } from '../components/TransformComponent';
import { MeshRendererComponent, type MeshGeometry } from '../components/MeshRendererComponent';
import { PhysicsComponent, type PhysicsProperties } from '../components/PhysicsComponent';
import { LightComponent, type LightProperties } from '../components/LightComponent';
import { RetroRenderer } from '../../renderer/RetroRenderer';
import { PhysicsWorld } from '../../physics/PhysicsWorld';
import * as THREE from 'three';

export type EntityType = 'box' | 'sphere' | 'plane' | 'cylinder' | 'light' | 'group';

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
    private physicsWorld: PhysicsWorld
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
      default:
        throw new Error(`Unknown entity type: ${type}`);
    }
  }
}




