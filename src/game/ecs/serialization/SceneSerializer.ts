import { Entity } from '../Entity';
import { Component } from '../Component';
import { EntityManager } from '../EntityManager';
import { TransformComponent } from '../components/TransformComponent';
import { MeshRendererComponent } from '../components/MeshRendererComponent';
import { PhysicsComponent } from '../components/PhysicsComponent';
import { LightComponent } from '../components/LightComponent';
import { logScene } from '@/editor/utils/debugLogger';

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
    
    logScene('serialize: Starting serialization', {
      sceneName,
      entityCount: allEntities.length,
    });

    allEntities.forEach((entity) => {
      logScene('serialize: Serializing entity', {
        entityId: entity.id,
        entityName: entity.name,
      });
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

    logScene('serialize: Serialization complete', {
      sceneName,
      entityCount: entities.length,
      serializedEntities: entities.map(e => ({ id: e.id, name: e.name })),
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
    logScene('deserialize: Starting deserialization', {
      sceneName: serialized.metadata.name,
      version: serialized.version,
      entityCount: serialized.entities.length,
      metadata: serialized.metadata,
    });

    let entityIndex = 0;
    serialized.entities.forEach((serializedEntity) => {
      logScene(`deserialize: Deserializing entity ${entityIndex + 1}/${serialized.entities.length}`, {
        name: serializedEntity.name,
        id: serializedEntity.id,
        active: serializedEntity.active,
        tags: serializedEntity.tags,
        componentCount: serializedEntity.components.length,
        componentTypes: serializedEntity.components.map(c => c.type),
      });

      // Create entity
      const entity = entityManager.createEntity(serializedEntity.name);
      entity.active = serializedEntity.active;
      serializedEntity.tags.forEach(tag => entity.addTag(tag));
      entity.metadata = { ...serializedEntity.metadata };

      logScene(`deserialize: Entity created`, {
        name: entity.name,
        id: entity.id,
        active: entity.active,
        tags: Array.from(entity.tags),
      });

      // Create components
      serializedEntity.components.forEach((serializedComponent, compIndex) => {
        logScene(`deserialize: Adding component ${compIndex + 1}/${serializedEntity.components.length}`, {
          entityName: entity.name,
          componentType: serializedComponent.type,
          data: serializedComponent.data,
        });

        switch (serializedComponent.type) {
          case 'TransformComponent':
            const transform = new TransformComponent(entity);
            transform.deserialize(serializedComponent.data);
            entityManager.addComponent(entity, transform);
            logScene(`deserialize: TransformComponent added`, {
              entityName: entity.name,
              position: transform.position.toArray(),
              rotation: transform.rotation.toArray(),
              scale: transform.scale.toArray(),
            });
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
            const mesh = meshRenderer.getMesh(renderer);
            logScene(`deserialize: MeshRendererComponent added`, {
              entityName: entity.name,
              hasMesh: !!mesh,
              meshName: mesh?.name,
              geometry: serializedComponent.data.geometry,
            });
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
            logScene(`deserialize: PhysicsComponent added`, {
              entityName: entity.name,
              hasRigidBody: !!physics.rigidBody,
              properties: serializedComponent.data.properties,
            });
            break;

          case 'LightComponent':
            const light = new LightComponent(entity, serializedComponent.data.properties);
            light.deserialize(serializedComponent.data);
            entityManager.addComponent(entity, light);
            logScene(`deserialize: LightComponent added`, {
              entityName: entity.name,
              lightType: serializedComponent.data.properties?.type,
            });
            break;

          default:
            logScene(`deserialize: Unknown component type: ${serializedComponent.type}`, {
              entityName: entity.name,
              componentType: serializedComponent.type,
            });
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
          logScene(`deserialize: MeshRenderer transform updated`, {
            entityName: entity.name,
            position: transform.position.toArray(),
          });
        }

        const light = entityManager.getComponent<LightComponent>(entity, 'LightComponent');
        if (light) {
          light.updateTransform(transform.position, transform.rotation);
          logScene(`deserialize: Light transform updated`, {
            entityName: entity.name,
            position: transform.position.toArray(),
          });
        }
      }

      // Get the object3D to check if it was added to scene
      const obj3d = entityManager.getObject3D(entity);
      logScene(`deserialize: Entity ${entityIndex + 1} completed`, {
        entityName: entity.name,
        entityId: entity.id,
        hasObject3D: !!obj3d,
        object3DName: obj3d?.name,
        object3DUuid: obj3d?.uuid,
        object3DType: obj3d?.type,
      });

      entityIndex++;
    });

    const finalEntityCount = entityManager.getAllEntities().length;
    logScene('deserialize: Deserialization complete', {
      sceneName: serialized.metadata.name,
      expectedEntities: serialized.entities.length,
      actualEntities: finalEntityCount,
      match: finalEntityCount === serialized.entities.length,
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

