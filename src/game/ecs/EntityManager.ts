import * as THREE from 'three';
import { Entity } from './Entity';
import { Component } from './Component';
import { TransformComponent } from './components/TransformComponent';
import { MeshRendererComponent } from './components/MeshRendererComponent';
import { PhysicsComponent } from './components/PhysicsComponent';
import { LightComponent } from './components/LightComponent';
import { RetroRenderer } from '../renderer/RetroRenderer';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { Debug } from '../utils/debug';

/**
 * EntityManager - Manages all entities and their components
 * Acts as the central registry for the ECS system
 */
export class EntityManager {
  private entities: Map<string, Entity> = new Map();
  private components: Map<string, Map<string, Component>> = new Map(); // entityId -> componentType -> Component
  private scene: THREE.Scene;
  private renderer: RetroRenderer;
  private physicsWorld: PhysicsWorld;

  constructor(scene: THREE.Scene, renderer: RetroRenderer, physicsWorld: PhysicsWorld) {
    this.scene = scene;
    this.renderer = renderer;
    this.physicsWorld = physicsWorld;
  }

  /**
   * Create a new entity
   */
  createEntity(name: string = 'Entity'): Entity {
    const entity = new Entity(name);
    this.entities.set(entity.id, entity);
    this.components.set(entity.id, new Map());
    Debug.log('EntityManager', `Created entity: ${name} (${entity.id})`);
    return entity;
  }

  /**
   * Get entity by ID
   */
  getEntity(id: string): Entity | null {
    return this.entities.get(id) || null;
  }

  /**
   * Get all entities
   */
  getAllEntities(): Entity[] {
    return Array.from(this.entities.values());
  }

  /**
   * Get entities by tag
   */
  getEntitiesByTag(tag: string): Entity[] {
    return Array.from(this.entities.values()).filter(e => e.hasTag(tag));
  }

  /**
   * Add component to entity
   */
  addComponent(entity: Entity, component: Component): void {
    const entityComponents = this.components.get(entity.id);
    if (!entityComponents) {
      Debug.error('EntityManager', `Entity ${entity.id} not found`);
      return;
    }

    const componentType = component.constructor.name;
    entityComponents.set(componentType, component);
    
    if (component.onAdd) {
      component.onAdd();
    }

    // Special handling for certain components
    if (component instanceof MeshRendererComponent) {
      const mesh = component.getMesh(this.renderer);
      if (mesh) {
        this.scene.add(mesh);
      }
    } else if (component instanceof LightComponent) {
      const light = component.getLight();
      if (light) {
        this.scene.add(light);
      }
    } else if (component instanceof PhysicsComponent) {
      component.setPhysicsWorld(this.physicsWorld);
    }

    Debug.log('EntityManager', `Added ${componentType} to entity ${entity.name} (${entity.id})`);
  }

  /**
   * Get component from entity
   */
  getComponent<T extends Component>(entity: Entity, componentType: string): T | null {
    const entityComponents = this.components.get(entity.id);
    if (!entityComponents) return null;
    return (entityComponents.get(componentType) as T) || null;
  }

  /**
   * Check if entity has component
   */
  hasComponent(entity: Entity, componentType: string): boolean {
    const entityComponents = this.components.get(entity.id);
    if (!entityComponents) return false;
    return entityComponents.has(componentType);
  }

  /**
   * Remove component from entity
   */
  removeComponent(entity: Entity, componentType: string): void {
    const entityComponents = this.components.get(entity.id);
    if (!entityComponents) return;

    const component = entityComponents.get(componentType);
    if (component) {
      if (component.onRemove) {
        component.onRemove();
      }

      // Special cleanup for certain components
      if (component instanceof MeshRendererComponent) {
        const mesh = component.getMesh();
        if (mesh) {
          this.scene.remove(mesh);
        }
      } else if (component instanceof LightComponent) {
        const light = component.getLight();
        if (light) {
          this.scene.remove(light);
        }
      }

      entityComponents.delete(componentType);
      Debug.log('EntityManager', `Removed ${componentType} from entity ${entity.name} (${entity.id})`);
    }
  }

  /**
   * Remove entity and all its components
   */
  removeEntity(entity: Entity): void {
    const entityComponents = this.components.get(entity.id);
    if (entityComponents) {
      // Remove all components (which will clean up Three.js objects)
      entityComponents.forEach((component, componentType) => {
        this.removeComponent(entity, componentType);
      });
      this.components.delete(entity.id);
    }
    this.entities.delete(entity.id);
    Debug.log('EntityManager', `Removed entity: ${entity.name} (${entity.id})`);
  }

  /**
   * Update all entities (sync transforms, etc.)
   */
  update(deltaTime: number): void {
    this.entities.forEach((entity) => {
      if (!entity.active) return;

      const entityComponents = this.components.get(entity.id);
      if (!entityComponents) return;

      // Get transform component
      const transform = this.getComponent<TransformComponent>(entity, 'TransformComponent');
      if (!transform) return;

      // Update mesh renderer transform
      const meshRenderer = this.getComponent<MeshRendererComponent>(entity, 'MeshRendererComponent');
      if (meshRenderer && meshRenderer.enabled) {
        meshRenderer.updateTransform({
          position: transform.position,
          rotation: transform.rotation,
          scale: transform.scale,
        });
      }

      // Update light transform
      const light = this.getComponent<LightComponent>(entity, 'LightComponent');
      if (light && light.enabled) {
        light.updateTransform(transform.position, transform.rotation);
      }

      // Sync physics body with transform (if not editor-controlled)
      const physics = this.getComponent<PhysicsComponent>(entity, 'PhysicsComponent');
      if (physics && physics.enabled && physics.rigidBody) {
        // Check if entity is editor-controlled via mesh userData
        const mesh = meshRenderer?.getMesh();
        const isEditorControlled = mesh?.userData._editorControlled || false;

        if (!isEditorControlled && physics.properties.bodyType === 'dynamic') {
          // Sync transform FROM physics (physics drives the transform)
          const physTransform = physics.getTransform();
          transform.setPosition(physTransform.position);
          // Convert quaternion to euler for rotation
          const quat = new THREE.Quaternion(
            physTransform.rotation.x,
            physTransform.rotation.y,
            physTransform.rotation.z,
            physTransform.rotation.w
          );
          transform.rotation.setFromQuaternion(quat);
        } else if (isEditorControlled || physics.properties.bodyType === 'static' || physics.properties.bodyType === 'kinematic') {
          // Sync transform TO physics (transform drives the physics)
          const quat = new THREE.Quaternion().setFromEuler(transform.rotation);
          physics.updateTransform(transform.getPosition(), {
            x: quat.x,
            y: quat.y,
            z: quat.z,
            w: quat.w,
          });
        }
      }

      // Update any component with update method
      entityComponents.forEach((component) => {
        if (component.enabled && component.update) {
          component.update(deltaTime);
        }
      });
    });
  }

  /**
   * Get Three.js Object3D for entity (mesh or light)
   */
  getObject3D(entity: Entity): THREE.Object3D | null {
    const meshRenderer = this.getComponent<MeshRendererComponent>(entity, 'MeshRendererComponent');
    if (meshRenderer) {
      return meshRenderer.getMesh();
    }

    const light = this.getComponent<LightComponent>(entity, 'LightComponent');
    if (light) {
      return light.getLight();
    }

    return null;
  }

  /**
   * Get entity from Three.js Object3D (via userData.entityId)
   */
  getEntityFromObject3D(object: THREE.Object3D): Entity | null {
    const entityId = object.userData.entityId;
    if (!entityId) return null;
    return this.getEntity(entityId);
  }
}

