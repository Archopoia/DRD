import { Entity } from './Entity';

/**
 * Base Component class
 * All components must extend this class
 */
export abstract class Component {
  public readonly entity: Entity;
  public enabled: boolean = true;

  constructor(entity: Entity) {
    this.entity = entity;
  }

  /**
   * Called when component is added to entity
   */
  onAdd?(): void;

  /**
   * Called when component is removed from entity
   */
  onRemove?(): void;

  /**
   * Called every frame (if implemented)
   */
  update?(deltaTime: number): void;

  /**
   * Serialize component to JSON (for save/load)
   */
  abstract serialize(): any;

  /**
   * Deserialize component from JSON (for save/load)
   */
  abstract deserialize(data: any): void;

  /**
   * Clone component (for prefabs/duplication)
   */
  abstract clone(entity: Entity): Component;
}

