import * as THREE from 'three';
import { RetroRenderer } from '../renderer/RetroRenderer';
import { Debug } from '../utils/debug';

/**
 * Basic 3D scene setup with test geometry
 */
export class Scene {
  public scene: THREE.Scene;
  private renderer: RetroRenderer;

  constructor(renderer: RetroRenderer) {
    Debug.startMeasure('Scene.constructor');
    Debug.log('Scene', 'Initializing scene...');
    
    try {
      this.renderer = renderer;
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

    // Ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(roomSize, roomSize);
    const ceilingMaterial = this.renderer.createRetroStandardMaterial(0x3a3a3a);
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = wallHeight;
    this.scene.add(ceiling);

    // Walls
    const wallMaterial = this.renderer.createRetroStandardMaterial(0x5a5a5a);

    // Back wall
    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(roomSize, wallHeight),
      wallMaterial
    );
    backWall.position.set(0, wallHeight / 2, -roomSize / 2);
    this.scene.add(backWall);

    // Front wall (with opening)
    const frontWallLeft = new THREE.Mesh(
      new THREE.PlaneGeometry(roomSize / 2 - 1, wallHeight),
      wallMaterial
    );
    frontWallLeft.position.set(-roomSize / 4 - 0.5, wallHeight / 2, roomSize / 2);
    this.scene.add(frontWallLeft);

    const frontWallRight = new THREE.Mesh(
      new THREE.PlaneGeometry(roomSize / 2 - 1, wallHeight),
      wallMaterial
    );
    frontWallRight.position.set(roomSize / 4 + 0.5, wallHeight / 2, roomSize / 2);
    this.scene.add(frontWallRight);

    // Left wall
    const leftWall = new THREE.Mesh(
      new THREE.PlaneGeometry(roomSize, wallHeight),
      wallMaterial
    );
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-roomSize / 2, wallHeight / 2, 0);
    this.scene.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(
      new THREE.PlaneGeometry(roomSize, wallHeight),
      wallMaterial
    );
    rightWall.rotation.y = Math.PI / 2;
    rightWall.position.set(roomSize / 2, wallHeight / 2, 0);
    this.scene.add(rightWall);

    // Add some test objects
    this.createTestObjects();
  }

  private createTestObjects(): void {
    // Add a few boxes for visual interest
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const boxMaterial = this.renderer.createRetroStandardMaterial(0x8a4a4a);

    // Box 1
    const box1 = new THREE.Mesh(boxGeometry, boxMaterial);
    box1.position.set(-2, 0.5, -2);
    this.scene.add(box1);

    // Box 2
    const box2 = new THREE.Mesh(boxGeometry, boxMaterial);
    box2.position.set(2, 0.5, -2);
    this.scene.add(box2);

    // Box 3 (taller)
    const tallBoxGeometry = new THREE.BoxGeometry(1, 2, 1);
    const box3 = new THREE.Mesh(tallBoxGeometry, boxMaterial);
    box3.position.set(0, 1, -3);
    this.scene.add(box3);
  }

  /**
   * Cleanup scene
   */
  dispose(): void {
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
  }
}



