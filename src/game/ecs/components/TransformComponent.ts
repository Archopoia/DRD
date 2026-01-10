import * as THREE from 'three';
import { Component } from '../Component';
import { Entity } from '../Entity';

/**
 * Transform Component - Position, rotation, scale
 */
export class TransformComponent extends Component {
  public position: THREE.Vector3;
  public rotation: THREE.Euler;
  public scale: THREE.Vector3;

  constructor(entity: Entity, position?: THREE.Vector3, rotation?: THREE.Euler, scale?: THREE.Vector3) {
    super(entity);
    this.position = position?.clone() || new THREE.Vector3(0, 0, 0);
    this.rotation = rotation?.clone() || new THREE.Euler(0, 0, 0);
    this.scale = scale?.clone() || new THREE.Vector3(1, 1, 1);
  }

  /**
   * Get position as object (for serialization)
   */
  getPosition(): { x: number; y: number; z: number } {
    return { x: this.position.x, y: this.position.y, z: this.position.z };
  }

  /**
   * Set position from object
   */
  setPosition(pos: { x: number; y: number; z: number }): void {
    this.position.set(pos.x, pos.y, pos.z);
  }

  /**
   * Get rotation as object (in degrees for serialization)
   */
  getRotation(): { x: number; y: number; z: number } {
    return {
      x: this.rotation.x * (180 / Math.PI),
      y: this.rotation.y * (180 / Math.PI),
      z: this.rotation.z * (180 / Math.PI),
    };
  }

  /**
   * Set rotation from object (in degrees)
   */
  setRotation(rot: { x: number; y: number; z: number }): void {
    this.rotation.set(
      rot.x * (Math.PI / 180),
      rot.y * (Math.PI / 180),
      rot.z * (Math.PI / 180)
    );
  }

  /**
   * Get scale as object
   */
  getScale(): { x: number; y: number; z: number } {
    return { x: this.scale.x, y: this.scale.y, z: this.scale.z };
  }

  /**
   * Set scale from object
   */
  setScale(scale: { x: number; y: number; z: number }): void {
    this.scale.set(scale.x, scale.y, scale.z);
  }

  serialize(): any {
    return {
      type: 'TransformComponent',
      position: this.getPosition(),
      rotation: this.getRotation(),
      scale: this.getScale(),
      enabled: this.enabled,
    };
  }

  deserialize(data: any): void {
    if (data.position) this.setPosition(data.position);
    if (data.rotation) this.setRotation(data.rotation);
    if (data.scale) this.setScale(data.scale);
    if (data.enabled !== undefined) this.enabled = data.enabled;
  }

  clone(entity: Entity): TransformComponent {
    const cloned = new TransformComponent(
      entity,
      this.position.clone(),
      this.rotation.clone(),
      this.scale.clone()
    );
    cloned.enabled = this.enabled;
    return cloned;
  }
}

