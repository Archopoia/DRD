import { Entity } from '../Entity';
import { Component } from '../Component';
import { EntityManager } from '../EntityManager';
import { TransformComponent } from '../components/TransformComponent';
import { MeshRendererComponent } from '../components/MeshRendererComponent';
import { PhysicsComponent } from '../components/PhysicsComponent';
import { LightComponent } from '../components/LightComponent';

export interface SerializedScene {
  version: string;
  entities: SerializedEntity[];
  metadata: {
    name: string;
    author?: string;
    createdAt: number;
    updatedAt: number;
  };
}

export interface SerializedEntity {
  id: string;
  name: string;
  active: boolean;
  tags: string[];
  metadata: Record<string, any>;
  components: SerializedComponent[];
}

export interface SerializedComponent {
  type: string;
  data: any;
}

/**
 * SceneSerializer - Handles serialization and deserialization of scenes
 */
export class SceneSerializer {
  /**
   * Serialize entire scene to JSON
   */
  static serialize(entityManager: EntityManager, sceneName: string = 'Scene', author?: string): SerializedScene {
    const entities: SerializedEntity[] = [];
    const allEntities = entityManager.getAllEntities();

    allEntities.forEach((entity) => {
      const serializedEntity: SerializedEntity = {
        id: entity.id,
        name: entity.name,
        active: entity.active,
        tags: Array.from(entity.tags),
        metadata: { ...entity.metadata },
        components: [],
      };

      // Get all components for this entity (we'll need to access the internal map)
      // For now, we'll try to get known component types
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

      entities.push(serializedEntity);
    });

    return {
      version: '1.0.0',
      entities,
      metadata: {
        name: sceneName,
        author,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    };
  }

  /**
   * Deserialize scene from JSON
   */
  static deserialize(
    entityManager: EntityManager,
    serialized: SerializedScene,
    renderer: any,
    physicsWorld: any
  ): void {
    serialized.entities.forEach((serializedEntity) => {
      // Create entity
      const entity = entityManager.createEntity(serializedEntity.name);
      entity.active = serializedEntity.active;
      serializedEntity.tags.forEach(tag => entity.addTag(tag));
      entity.metadata = { ...serializedEntity.metadata };

      // Create components
      serializedEntity.components.forEach((serializedComponent) => {
        switch (serializedComponent.type) {
          case 'TransformComponent':
            const transform = new TransformComponent(entity);
            transform.deserialize(serializedComponent.data);
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
            // Update transform to match physics position
            const transformComp = entityManager.getComponent<TransformComponent>(entity, 'TransformComponent');
            if (transformComp && physics.rigidBody) {
              const physTransform = physics.getTransform();
              transformComp.setPosition(physTransform.position);
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
    });
  }

  /**
   * Export scene to JSON string
   */
  static exportToJSON(entityManager: EntityManager, sceneName: string = 'Scene', author?: string): string {
    const serialized = this.serialize(entityManager, sceneName, author);
    return JSON.stringify(serialized, null, 2);
  }

  /**
   * Import scene from JSON string
   */
  static importFromJSON(
    entityManager: EntityManager,
    jsonString: string,
    renderer: any,
    physicsWorld: any
  ): SerializedScene {
    const serialized: SerializedScene = JSON.parse(jsonString);
    this.deserialize(entityManager, serialized, renderer, physicsWorld);
    return serialized;
  }
}

