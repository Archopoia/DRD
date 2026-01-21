import * as THREE from 'three';
import { Entity } from '@/game/ecs/Entity';
import { EntityManager } from '@/game/ecs/EntityManager';
import { TransformComponent } from '@/game/ecs/components/TransformComponent';
import { MeshRendererComponent } from '@/game/ecs/components/MeshRendererComponent';
import { PhysicsComponent } from '@/game/ecs/components/PhysicsComponent';
import { RetroRenderer } from '@/game/renderer/RetroRenderer';
import { PhysicsWorld } from '@/game/physics/PhysicsWorld';

export type BrushShape = 'box' | 'cylinder' | 'sphere';

export interface BrushOptions {
  shape: BrushShape;
  size: { x: number; y: number; z: number };
  position: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  materialId?: string;
}

/**
 * Brush Tool - Creates custom geometry brushes for level editing
 * Similar to Doom Builder / Hammer Editor brush system
 */
export class BrushTool {
  constructor(
    private entityManager: EntityManager,
    private renderer: RetroRenderer,
    private physicsWorld: PhysicsWorld
  ) {}

  /**
   * Create a brush entity from options
   */
  createBrush(options: BrushOptions): Entity {
    const name = options.shape === 'box' ? 'Brush_Box' : 
                 options.shape === 'cylinder' ? 'Brush_Cylinder' : 'Brush_Sphere';
    const entity = this.entityManager.createEntity(name);
    
    // Add transform component
    const transform = new TransformComponent(
      entity,
      new THREE.Vector3(options.position.x, options.position.y, options.position.z),
      new THREE.Euler(
        (options.rotation?.x || 0) * (Math.PI / 180),
        (options.rotation?.y || 0) * (Math.PI / 180),
        (options.rotation?.z || 0) * (Math.PI / 180)
      ),
      new THREE.Vector3(1, 1, 1)
    );
    this.entityManager.addComponent(entity, transform);

    // Create geometry based on shape
    let geometry: any;
    let color = 0x808080;

    switch (options.shape) {
      case 'box':
        geometry = {
          type: 'box' as const,
          width: options.size.x,
          height: options.size.y,
          depth: options.size.z,
        };
        break;
      case 'cylinder':
        geometry = {
          type: 'cylinder' as const,
          cylinderRadius: Math.max(options.size.x, options.size.z) / 2,
          cylinderHeight: options.size.y,
        };
        break;
      case 'sphere':
        const radius = Math.max(options.size.x, options.size.y, options.size.z) / 2;
        geometry = {
          type: 'sphere' as const,
          radius: radius,
        };
        break;
    }

    // Add mesh renderer
    const meshRenderer = new MeshRendererComponent(entity, geometry, color, this.renderer);
    this.entityManager.addComponent(entity, meshRenderer);

    // Add physics (brushes are typically static)
    const physicsProps = {
      bodyType: 'static' as const,
      mass: 0,
      friction: 0.7,
      restitution: 0.0,
      colliderShape: options.shape === 'box' ? 'box' as const : 
                     options.shape === 'cylinder' ? 'capsule' as const : 'sphere' as const,
      colliderSize: {
        x: options.size.x / 2,
        y: options.size.y / 2,
        z: options.size.z / 2,
      },
    };
    const physics = new PhysicsComponent(entity, physicsProps, this.physicsWorld);
    this.entityManager.addComponent(entity, physics);

    // Tag as brush for identification
    entity.addTag('brush');

    return entity;
  }

  /**
   * Convert brush to custom geometry (for vertex editing)
   * This creates a BufferGeometry that can be edited
   */
  brushToEditableGeometry(brush: Entity): THREE.BufferGeometry | null {
    const meshRenderer = this.entityManager.getComponent<MeshRendererComponent>(brush, 'MeshRendererComponent');
    if (!meshRenderer || !meshRenderer.mesh) return null;

    const mesh = meshRenderer.mesh;
    if (!mesh.geometry) return null;

    // Clone geometry for editing
    return mesh.geometry.clone();
  }
}
