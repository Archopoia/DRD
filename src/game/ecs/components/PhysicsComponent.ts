import RAPIER from '@dimforge/rapier3d';
import { Component } from '../Component';
import { Entity } from '../Entity';
import { PhysicsWorld } from '../../physics/PhysicsWorld';

export type PhysicsBodyType = 'static' | 'dynamic' | 'kinematic';

export interface PhysicsProperties {
  bodyType: PhysicsBodyType;
  mass?: number;
  friction?: number;
  restitution?: number;
  colliderShape: 'box' | 'sphere' | 'cylinder' | 'capsule' | 'plane';
  colliderSize?: { x: number; y: number; z: number };
  colliderRadius?: number;
  colliderHeight?: number;
  isSensor?: boolean;
}

/**
 * Physics Component - Handles physics body and collision
 */
export class PhysicsComponent extends Component {
  public properties: PhysicsProperties;
  public rigidBody: RAPIER.RigidBody | null = null;
  private physicsWorld: PhysicsWorld | null = null;

  constructor(entity: Entity, properties: PhysicsProperties, physicsWorld?: PhysicsWorld) {
    super(entity);
    this.properties = { ...properties };
    this.physicsWorld = physicsWorld || null;
    if (physicsWorld) {
      this.createPhysicsBody();
    }
  }

  /**
   * Create physics body from properties
   */
  createPhysicsBody(): void {
    if (!this.physicsWorld) {
      console.warn('PhysicsComponent: No physics world provided, body will not be created');
      return;
    }

    // Create collider description
    let colliderDesc: RAPIER.ColliderDesc;

    switch (this.properties.colliderShape) {
      case 'box':
        const size = this.properties.colliderSize || { x: 0.5, y: 0.5, z: 0.5 };
        colliderDesc = RAPIER.ColliderDesc.cuboid(size.x, size.y, size.z);
        break;
      case 'sphere':
        const radius = this.properties.colliderRadius || 0.5;
        colliderDesc = RAPIER.ColliderDesc.ball(radius);
        break;
      case 'cylinder':
        const cylRadius = this.properties.colliderRadius || 0.5;
        const cylHeight = this.properties.colliderHeight || 1.0;
        colliderDesc = RAPIER.ColliderDesc.cylinder(cylHeight / 2, cylRadius);
        break;
      case 'capsule':
        const capRadius = this.properties.colliderRadius || 0.3;
        const capHeight = this.properties.colliderHeight || 1.6;
        colliderDesc = RAPIER.ColliderDesc.capsule((capHeight - 2 * capRadius) / 2, capRadius);
        break;
      case 'plane':
        colliderDesc = RAPIER.ColliderDesc.cuboid(10, 0.1, 10); // Large flat plane
        break;
      default:
        colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
    }

    // Set physics properties
    if (this.properties.friction !== undefined) {
      colliderDesc.setFriction(this.properties.friction);
    }
    if (this.properties.restitution !== undefined) {
      colliderDesc.setRestitution(this.properties.restitution);
    }
    if (this.properties.isSensor) {
      colliderDesc.setSensor(true);
    }

    // Get transform from entity (if available)
    // We'll need to get this from the entity's TransformComponent
    const position = { x: 0, y: 0, z: 0 };
    const rotation = { x: 0, y: 0, z: 0, w: 1 };

    // Create rigid body based on type
    switch (this.properties.bodyType) {
      case 'static':
        this.rigidBody = this.physicsWorld.createStaticBody(colliderDesc, position, rotation);
        break;
      case 'dynamic':
        const mass = this.properties.mass || 1.0;
        this.rigidBody = this.physicsWorld.createDynamicBody(colliderDesc, position, mass, rotation);
        break;
      case 'kinematic':
        this.rigidBody = this.physicsWorld.createKinematicBody(colliderDesc, position, rotation);
        break;
    }

    if (this.rigidBody) {
      this.rigidBody.userData = { entityId: this.entity.id };
    }
  }

  /**
   * Update physics body transform from entity transform
   */
  updateTransform(position: { x: number; y: number; z: number }, rotation?: { x: number; y: number; z: number; w: number }): void {
    if (!this.rigidBody) return;

    this.rigidBody.setTranslation(
      new RAPIER.Vector3(position.x, position.y, position.z),
      true
    );

    if (rotation) {
      this.rigidBody.setRotation(
        new RAPIER.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w),
        true
      );
    }
  }

  /**
   * Get physics body transform
   */
  getTransform(): { position: { x: number; y: number; z: number }; rotation: { x: number; y: number; z: number; w: number } } {
    if (!this.rigidBody) {
      return { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 } };
    }

    const translation = this.rigidBody.translation();
    const rotation = this.rigidBody.rotation();

    return {
      position: { x: translation.x, y: translation.y, z: translation.z },
      rotation: { x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w },
    };
  }

  /**
   * Set physics world (for deferred initialization)
   */
  setPhysicsWorld(physicsWorld: PhysicsWorld): void {
    this.physicsWorld = physicsWorld;
    if (!this.rigidBody) {
      this.createPhysicsBody();
    }
  }

  onRemove(): void {
    if (this.rigidBody && this.physicsWorld) {
      this.physicsWorld.removeBody(this.rigidBody);
      this.rigidBody = null;
    }
  }

  serialize(): any {
    return {
      type: 'PhysicsComponent',
      properties: this.properties,
      enabled: this.enabled,
    };
  }

  deserialize(data: any): void {
    if (data.properties) {
      this.properties = { ...data.properties };
      // Recreate physics body if we have a physics world
      if (this.physicsWorld && this.rigidBody) {
        // Remove old body and create new one
        this.onRemove();
        this.createPhysicsBody();
      }
    }
    if (data.enabled !== undefined) this.enabled = data.enabled;
  }

  clone(entity: Entity): PhysicsComponent {
    const cloned = new PhysicsComponent(entity, { ...this.properties }, this.physicsWorld);
    cloned.enabled = this.enabled;
    return cloned;
  }
}

