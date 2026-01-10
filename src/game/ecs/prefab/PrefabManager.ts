import { Entity } from '../Entity';
import { Component } from '../Component';
import { EntityManager } from '../EntityManager';
import { TransformComponent } from '../components/TransformComponent';
import { MeshRendererComponent } from '../components/MeshRendererComponent';
import { PhysicsComponent } from '../components/PhysicsComponent';
import { LightComponent } from '../components/LightComponent';
import { SceneSerializer, SerializedEntity } from '../serialization/SceneSerializer';

export interface Prefab {
  id: string;
  name: string;
  entity: SerializedEntity;
  createdAt: number;
  updatedAt: number;
}

/**
 * PrefabManager - Manages prefab templates (reusable entity templates)
 */
export class PrefabManager {
  private prefabs: Map<string, Prefab> = new Map();
  private storageKey = 'drd_prefabs';

  constructor() {
    this.loadPrefabsFromStorage();
  }

  /**
   * Create a prefab from an entity
   */
  createPrefab(name: string, entity: Entity, entityManager: EntityManager): Prefab {
    // Serialize the entity
    const serializedEntity: SerializedEntity = {
      id: '', // Prefabs don't keep original IDs
      name: entity.name,
      active: entity.active,
      tags: Array.from(entity.tags),
      metadata: { ...entity.metadata },
      components: [],
    };

    // Serialize all components
    const transform = entityManager.getComponent<TransformComponent>(entity, 'TransformComponent');
    if (transform) {
      serializedEntity.components.push({
        type: 'TransformComponent',
        data: transform.serialize(),
      });
    }

    const meshRenderer = entityManager.getComponent<MeshRendererComponent>(entity, 'MeshRendererComponent');
    if (meshRenderer) {
      serializedEntity.components.push({
        type: 'MeshRendererComponent',
        data: meshRenderer.serialize(),
      });
    }

    const physics = entityManager.getComponent<PhysicsComponent>(entity, 'PhysicsComponent');
    if (physics) {
      serializedEntity.components.push({
        type: 'PhysicsComponent',
        data: physics.serialize(),
      });
    }

    const light = entityManager.getComponent<LightComponent>(entity, 'LightComponent');
    if (light) {
      serializedEntity.components.push({
        type: 'LightComponent',
        data: light.serialize(),
      });
    }

    const prefab: Prefab = {
      id: `prefab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      entity: serializedEntity,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.prefabs.set(prefab.id, prefab);
    this.savePrefabsToStorage();

    return prefab;
  }

  /**
   * Instantiate a prefab (create new entity from prefab)
   */
  instantiatePrefab(
    prefabId: string,
    entityManager: EntityManager,
    renderer: any,
    physicsWorld: any,
    position?: { x: number; y: number; z: number }
  ): Entity | null {
    const prefab = this.prefabs.get(prefabId);
    if (!prefab) {
      console.error(`PrefabManager: Prefab ${prefabId} not found`);
      return null;
    }

    // Create entity from prefab
    const entity = entityManager.createEntity(prefab.entity.name);

    // Copy tags and metadata
    prefab.entity.tags.forEach(tag => entity.addTag(tag));
    entity.metadata = { ...prefab.entity.metadata };

    // Create components
    prefab.entity.components.forEach((serializedComponent) => {
      switch (serializedComponent.type) {
        case 'TransformComponent':
          const transform = new TransformComponent(entity);
          transform.deserialize(serializedComponent.data);
          // Override position if provided
          if (position) {
            transform.setPosition(position);
          }
          entityManager.addComponent(entity, transform);
          break;

        case 'MeshRendererComponent':
          const meshRenderer = new MeshRendererComponent(
            entity,
            serializedComponent.data.geometry,
            serializedComponent.data.materialColor,
            renderer
          );
          meshRenderer.deserialize(serializedComponent.data);
          entityManager.addComponent(entity, meshRenderer);
          break;

        case 'PhysicsComponent':
          const physics = new PhysicsComponent(entity, serializedComponent.data.properties, physicsWorld);
          physics.deserialize(serializedComponent.data);
          entityManager.addComponent(entity, physics);
          // Update transform to match physics
          if (position) {
            const transformComp = entityManager.getComponent<TransformComponent>(entity, 'TransformComponent');
            if (transformComp) {
              transformComp.setPosition(position);
              physics.updateTransform(position);
            }
          }
          break;

        case 'LightComponent':
          const light = new LightComponent(entity, serializedComponent.data.properties);
          light.deserialize(serializedComponent.data);
          entityManager.addComponent(entity, light);
          break;
      }
    });

    // Update transforms after all components are added
    const transform = entityManager.getComponent<TransformComponent>(entity, 'TransformComponent');
    if (transform) {
      const meshRenderer = entityManager.getComponent<MeshRendererComponent>(entity, 'MeshRendererComponent');
      if (meshRenderer) {
        meshRenderer.updateTransform({
          position: transform.position,
          rotation: transform.rotation,
          scale: transform.scale,
        });
      }

      const light = entityManager.getComponent<LightComponent>(entity, 'LightComponent');
      if (light) {
        light.updateTransform(transform.position, transform.rotation);
      }
    }

    return entity;
  }

  /**
   * Get all prefabs
   */
  getAllPrefabs(): Prefab[] {
    return Array.from(this.prefabs.values());
  }

  /**
   * Get prefab by ID
   */
  getPrefab(id: string): Prefab | null {
    return this.prefabs.get(id) || null;
  }

  /**
   * Delete a prefab
   */
  deletePrefab(id: string): boolean {
    const deleted = this.prefabs.delete(id);
    if (deleted) {
      this.savePrefabsToStorage();
    }
    return deleted;
  }

  /**
   * Save prefabs to localStorage
   */
  private savePrefabsToStorage(): void {
    try {
      const prefabsArray = Array.from(this.prefabs.values());
      localStorage.setItem(this.storageKey, JSON.stringify(prefabsArray));
    } catch (error) {
      console.error('PrefabManager: Failed to save prefabs to storage', error);
    }
  }

  /**
   * Load prefabs from localStorage
   */
  private loadPrefabsFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const prefabsArray: Prefab[] = JSON.parse(stored);
        prefabsArray.forEach(prefab => {
          this.prefabs.set(prefab.id, prefab);
        });
      }
    } catch (error) {
      console.error('PrefabManager: Failed to load prefabs from storage', error);
    }
  }

  /**
   * Export prefab to JSON string
   */
  exportPrefab(prefabId: string): string | null {
    const prefab = this.prefabs.get(prefabId);
    if (!prefab) return null;
    return JSON.stringify(prefab, null, 2);
  }

  /**
   * Import prefab from JSON string
   */
  importPrefab(jsonString: string): Prefab | null {
    try {
      const prefab: Prefab = JSON.parse(jsonString);
      this.prefabs.set(prefab.id, prefab);
      this.savePrefabsToStorage();
      return prefab;
    } catch (error) {
      console.error('PrefabManager: Failed to import prefab', error);
      return null;
    }
  }
}

