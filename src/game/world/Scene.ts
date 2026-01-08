import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d';
import { RetroRenderer } from '../renderer/RetroRenderer';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { Debug } from '../utils/debug';

/**
 * Basic 3D scene setup with test geometry
 */
export class Scene {
  public scene: THREE.Scene;
  private renderer: RetroRenderer;
  private physicsWorld: PhysicsWorld;
  private physicsBodies: Map<THREE.Mesh, RAPIER.RigidBody> = new Map();

  constructor(renderer: RetroRenderer, physicsWorld: PhysicsWorld) {
    Debug.startMeasure('Scene.constructor');
    Debug.log('Scene', 'Initializing scene...');
    
    try {
      this.renderer = renderer;
      this.physicsWorld = physicsWorld;
      this.scene = new THREE.Scene();
      this.setupLighting();
      this.createTestRoom();
      Debug.log('Scene', 'Scene initialized');
      Debug.endMeasure('Scene.constructor');
    } catch (error) {
      Debug.error('Scene', 'Failed to initialize scene', error as Error);
      throw error;
    }
  }

  private setupLighting(): void {
    // Ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    // Directional light (sun/moon)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = false; // Shadows disabled for retro feel
    this.scene.add(directionalLight);

    // Optional: Add a point light for atmosphere
    const pointLight = new THREE.PointLight(0xffaa00, 0.5, 20);
    pointLight.position.set(0, 3, 0);
    this.scene.add(pointLight);
  }

  private createTestRoom(): void {
    // Create a simple box room
    const roomSize = 10;
    const wallHeight = 5;
    const wallThickness = 0.2;

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(roomSize, roomSize);
    const floorMaterial = this.renderer.createRetroStandardMaterial(0x4a4a4a);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    this.scene.add(floor);

    // Create static physics body for floor
    const floorCollider = RAPIER.ColliderDesc.cuboid(roomSize / 2, 0.1, roomSize / 2);
    const floorBody = this.physicsWorld.createStaticBody(
      floorCollider,
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 0, w: 1 } // Identity quaternion for horizontal plane
    );
    this.physicsBodies.set(floor, floorBody);

    // Ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(roomSize, roomSize);
    const ceilingMaterial = this.renderer.createRetroStandardMaterial(0x3a3a3a);
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = wallHeight;
    this.scene.add(ceiling);

    // Create static physics body for ceiling
    const ceilingCollider = RAPIER.ColliderDesc.cuboid(roomSize / 2, 0.1, roomSize / 2);
    const ceilingBody = this.physicsWorld.createStaticBody(
      ceilingCollider,
      { x: 0, y: wallHeight, z: 0 },
      { x: 0, y: 0, z: 0, w: 1 }
    );
    this.physicsBodies.set(ceiling, ceilingBody);

    // Walls
    const wallMaterial = this.renderer.createRetroStandardMaterial(0x5a5a5a);

    // Back wall
    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(roomSize, wallHeight),
      wallMaterial
    );
    backWall.position.set(0, wallHeight / 2, -roomSize / 2);
    this.scene.add(backWall);

    // Create static physics body for back wall (thicker for better collision)
    const backWallCollider = RAPIER.ColliderDesc.cuboid(roomSize / 2, wallHeight / 2, 0.3);
    const backWallBody = this.physicsWorld.createStaticBody(
      backWallCollider,
      { x: 0, y: wallHeight / 2, z: -roomSize / 2 }
    );
    this.physicsBodies.set(backWall, backWallBody);

    // Front wall (with opening)
    const frontWallLeft = new THREE.Mesh(
      new THREE.PlaneGeometry(roomSize / 2 - 1, wallHeight),
      wallMaterial
    );
    frontWallLeft.position.set(-roomSize / 4 - 0.5, wallHeight / 2, roomSize / 2);
    this.scene.add(frontWallLeft);

    // Create static physics body for front wall left (thicker for better collision)
    const frontWallLeftCollider = RAPIER.ColliderDesc.cuboid((roomSize / 2 - 1) / 2, wallHeight / 2, 0.3);
    const frontWallLeftBody = this.physicsWorld.createStaticBody(
      frontWallLeftCollider,
      { x: -roomSize / 4 - 0.5, y: wallHeight / 2, z: roomSize / 2 }
    );
    this.physicsBodies.set(frontWallLeft, frontWallLeftBody);

    const frontWallRight = new THREE.Mesh(
      new THREE.PlaneGeometry(roomSize / 2 - 1, wallHeight),
      wallMaterial
    );
    frontWallRight.position.set(roomSize / 4 + 0.5, wallHeight / 2, roomSize / 2);
    this.scene.add(frontWallRight);

    // Create static physics body for front wall right (thicker for better collision)
    const frontWallRightCollider = RAPIER.ColliderDesc.cuboid((roomSize / 2 - 1) / 2, wallHeight / 2, 0.3);
    const frontWallRightBody = this.physicsWorld.createStaticBody(
      frontWallRightCollider,
      { x: roomSize / 4 + 0.5, y: wallHeight / 2, z: roomSize / 2 }
    );
    this.physicsBodies.set(frontWallRight, frontWallRightBody);

    // Left wall
    const leftWall = new THREE.Mesh(
      new THREE.PlaneGeometry(roomSize, wallHeight),
      wallMaterial
    );
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-roomSize / 2, wallHeight / 2, 0);
    this.scene.add(leftWall);

    // Create static physics body for left wall (thicker for better collision)
    const leftWallCollider = RAPIER.ColliderDesc.cuboid(0.3, wallHeight / 2, roomSize / 2);
    const leftWallBody = this.physicsWorld.createStaticBody(
      leftWallCollider,
      { x: -roomSize / 2, y: wallHeight / 2, z: 0 }
    );
    this.physicsBodies.set(leftWall, leftWallBody);

    // Right wall
    const rightWall = new THREE.Mesh(
      new THREE.PlaneGeometry(roomSize, wallHeight),
      wallMaterial
    );
    rightWall.rotation.y = Math.PI / 2;
    rightWall.position.set(roomSize / 2, wallHeight / 2, 0);
    this.scene.add(rightWall);

    // Create static physics body for right wall (thicker for better collision)
    const rightWallCollider = RAPIER.ColliderDesc.cuboid(0.3, wallHeight / 2, roomSize / 2);
    const rightWallBody = this.physicsWorld.createStaticBody(
      rightWallCollider,
      { x: roomSize / 2, y: wallHeight / 2, z: 0 }
    );
    this.physicsBodies.set(rightWall, rightWallBody);

    // Add some test objects
    this.createTestObjects();
  }

  private createTestObjects(): void {
    // Add a few boxes for visual interest (dynamic physics bodies)
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const boxMaterial = this.renderer.createRetroStandardMaterial(0x8a4a4a);

    // Box 1
    const box1 = new THREE.Mesh(boxGeometry, boxMaterial);
    box1.position.set(-2, 0.5, -2);
    this.scene.add(box1);

    // Create dynamic physics body for box1
    const box1Collider = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
    const box1Body = this.physicsWorld.createDynamicBody(
      box1Collider,
      { x: -2, y: 0.5, z: -2 },
      1.0 // mass
    );
    this.physicsBodies.set(box1, box1Body);

    // Box 2
    const box2 = new THREE.Mesh(boxGeometry, boxMaterial);
    box2.position.set(2, 0.5, -2);
    this.scene.add(box2);

    // Create dynamic physics body for box2
    const box2Collider = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
    const box2Body = this.physicsWorld.createDynamicBody(
      box2Collider,
      { x: 2, y: 0.5, z: -2 },
      1.0 // mass
    );
    this.physicsBodies.set(box2, box2Body);

    // Box 3 (taller)
    const tallBoxGeometry = new THREE.BoxGeometry(1, 2, 1);
    const box3 = new THREE.Mesh(tallBoxGeometry, boxMaterial);
    box3.position.set(0, 1, -3);
    this.scene.add(box3);

    // Create dynamic physics body for box3
    const box3Collider = RAPIER.ColliderDesc.cuboid(0.5, 1, 0.5);
    const box3Body = this.physicsWorld.createDynamicBody(
      box3Collider,
      { x: 0, y: 1, z: -3 },
      2.0 // mass (taller = heavier)
    );
    this.physicsBodies.set(box3, box3Body);
  }

  /**
   * Update dynamic object positions to sync with physics
   */
  update(deltaTime: number): void {
    try {
      // Sync dynamic object positions with physics bodies
      this.physicsBodies.forEach((body, mesh) => {
        // Only sync dynamic bodies (static bodies don't move)
        if (body.bodyType() === RAPIER.RigidBodyType.Dynamic) {
          const translation = body.translation();
          mesh.position.set(translation.x, translation.y, translation.z);

          const rotation = body.rotation();
          mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
        }
      });
    } catch (error) {
      Debug.error('Scene', 'Error updating scene', error as Error);
    }
  }

  /**
   * Cleanup scene
   */
  dispose(): void {
    try {
      // Remove physics bodies
      this.physicsBodies.forEach((body, mesh) => {
        this.physicsWorld.removeBody(body);
      });
      this.physicsBodies.clear();

      // Dispose Three.js resources
      this.scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((mat) => mat.dispose());
          } else {
            object.material.dispose();
          }
        }
      });

      Debug.log('Scene', 'Scene disposed');
    } catch (error) {
      Debug.error('Scene', 'Error disposing scene', error as Error);
    }
  }
}



