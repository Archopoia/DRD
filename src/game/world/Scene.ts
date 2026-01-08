import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d';
import { RetroRenderer } from '../renderer/RetroRenderer';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { CharacterController } from '../physics/CharacterController';
import { SouffranceHealthSystem } from '../character/SouffranceHealthSystem';
import { Souffrance, getSouffranceName, getResistanceCompetenceName } from '../character/data/SouffranceData';
import { Competence, getCompetenceName } from '../character/data/CompetenceData';
import { Debug } from '../utils/debug';
import { getEventLog, EventType } from '../utils/EventLog';

/**
 * Basic 3D scene setup with test geometry
 */
interface SouffrancePlatform {
  mesh: THREE.Mesh;
  rigidBody: RAPIER.RigidBody;
  souffrance: Souffrance;
  color: number;
  lastDamageTime: number; // Track when we last applied damage
}

export class Scene {
  public scene: THREE.Scene;
  private renderer: RetroRenderer;
  private physicsWorld: PhysicsWorld;
  private physicsBodies: Map<THREE.Mesh, RAPIER.RigidBody> = new Map();
  private characterController: CharacterController | null = null;
  private healthSystem: SouffranceHealthSystem | null = null;
  private souffrancePlatforms: SouffrancePlatform[] = [];
  private damageInterval: number = 1000; // 1 second in milliseconds
  private lastDebugLogTime: Map<Souffrance, number> = new Map(); // Track last debug log per platform

  constructor(renderer: RetroRenderer, physicsWorld: PhysicsWorld) {
    Debug.startMeasure('Scene.constructor');
    Debug.log('Scene', 'Initializing scene...');
    
    try {
      this.renderer = renderer;
      this.physicsWorld = physicsWorld;
      this.scene = new THREE.Scene();
      this.setupLighting();
      this.createTestRoom();
      this.createSouffrancePlatforms();
      Debug.log('Scene', 'Scene initialized');
      Debug.endMeasure('Scene.constructor');
    } catch (error) {
      Debug.error('Scene', 'Failed to initialize scene', error as Error);
      throw error;
    }
  }

  /**
   * Set character controller and health system for platform detection
   */
  setCharacterSystems(characterController: CharacterController, healthSystem: SouffranceHealthSystem): void {
    this.characterController = characterController;
    this.healthSystem = healthSystem;
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

  /**
   * Create 8 colored platforms for testing souffrances
   * Each platform applies +1 DS of its souffrance type every second when stepped on
   */
  private createSouffrancePlatforms(): void {
    const platformSize = 1.5;
    const platformHeight = 0.1;
    const platformSpacing = 3.0;
    
    // Colors for each souffrance type - toned down to match muted, earthy theme
    // Muted, desaturated colors that fit the parchment/brown aesthetic
    const souffranceColors: Record<Souffrance, number> = {
      [Souffrance.BLESSURES]: 0x8b5a5a,    // Muted red-brown - physical wounds
      [Souffrance.FATIGUES]: 0xa67c52,     // Muted orange-brown - exhaustion
      [Souffrance.ENTRAVES]: 0x9a8a5f,     // Muted yellow-brown - impediments
      [Souffrance.DISETTES]: 0x6b8a6b,     // Muted green-brown - hunger/thirst
      [Souffrance.ADDICTIONS]: 0x6b8a8a,   // Muted teal-brown - dependencies
      [Souffrance.MALADIES]: 0x6b7a8a,     // Muted blue-gray - diseases
      [Souffrance.FOLIES]: 0x8a7a8a,       // Muted purple-gray - mental disorders
      [Souffrance.RANCOEURS]: 0x8a6a7a,    // Muted mauve-brown - resentments
    };

    // Arrange platforms in a circle or grid pattern
    const souffrances = Object.values(Souffrance);
    const centerX = 0;
    const centerZ = 0;
    const radius = 4.0; // Distance from center

    souffrances.forEach((souffrance, index) => {
      // Arrange in a circle
      const angle = (index / souffrances.length) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * radius;
      const z = centerZ + Math.sin(angle) * radius;
      const y = 0.05; // Slightly above floor

      const color = souffranceColors[souffrance];
      
      // Create platform mesh
      const platformGeometry = new THREE.BoxGeometry(platformSize, platformHeight, platformSize);
      const platformMaterial = this.renderer.createRetroStandardMaterial(color);
      const platformMesh = new THREE.Mesh(platformGeometry, platformMaterial);
      platformMesh.position.set(x, y + platformHeight / 2, z);
      this.scene.add(platformMesh);

      // Create physics body (static solid - supports character but also detects contact)
      const platformCollider = RAPIER.ColliderDesc.cuboid(platformSize / 2, platformHeight / 2, platformSize / 2);
      // Don't mark as sensor - we want solid platforms the character can stand on
      // We'll detect contact via distance check instead
      const platformBody = this.physicsWorld.createStaticBody(
        platformCollider,
        { x, y: y + platformHeight / 2, z }
      );
      this.physicsBodies.set(platformMesh, platformBody);

      // Store platform info
      this.souffrancePlatforms.push({
        mesh: platformMesh,
        rigidBody: platformBody,
        souffrance,
        color,
        lastDamageTime: 0,
      });

      // Add a label above the platform (using a simple text sprite or geometry)
      // For now, we'll just use the mesh name for identification
      platformMesh.name = `SouffrancePlatform_${souffrance}`;
      platformMesh.userData = {
        souffranceType: souffrance,
        souffranceName: getSouffranceName(souffrance),
      };

      Debug.log('Scene', `Created ${getSouffranceName(souffrance)} platform at (${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)})`);
    });
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
   * Also check for character standing on souffrance platforms
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

      // Check if character is standing on any souffrance platform
      if (this.characterController && this.healthSystem) {
        this.checkSouffrancePlatforms();
      }
    } catch (error) {
      Debug.error('Scene', 'Error updating scene', error as Error);
    }
  }

  /**
   * Check if character is standing on any souffrance platform and apply damage
   */
  private checkSouffrancePlatforms(): void {
    if (!this.characterController || !this.healthSystem) return;

    const characterPos = this.characterController.getPosition();
    const currentTime = performance.now();

    // Character capsule info (from GAME_CONFIG)
    const CHARACTER_HEIGHT = 1.6;
    const CHARACTER_RADIUS = 0.3;
    const capsuleHalfHeight = (CHARACTER_HEIGHT - 2 * CHARACTER_RADIUS) / 2; // 0.5
    const capsuleBottomY = characterPos.y - (capsuleHalfHeight + CHARACTER_RADIUS); // Character's feet position

    // Check each platform using simple distance check (more reliable than physics intersection)
    this.souffrancePlatforms.forEach((platform) => {
      const platformPos = platform.rigidBody.translation();
      
      // Calculate horizontal distance from character to platform center
      const dx = characterPos.x - platformPos.x;
      const dz = characterPos.z - platformPos.z;
      const horizontalDistance = Math.sqrt(dx * dx + dz * dz);
      
      // Platform is 1.5x1.5, so radius is 0.75 (half of 1.5)
      const platformSize = 1.5;
      const platformRadius = platformSize / 2; // 0.75
      const platformHeight = 0.1;
      const platformTopY = platformPos.y + platformHeight / 2; // Platform top surface
      const platformBottomY = platformPos.y - platformHeight / 2; // Platform bottom
      
      // Character is standing on platform if:
      // 1. Horizontal distance is within platform bounds (with generous tolerance for capsule radius)
      const isWithinBounds = horizontalDistance <= platformRadius + CHARACTER_RADIUS + 0.8; // Platform radius (0.75) + capsule radius (0.3) + generous tolerance (0.8) = 1.85 units
      
      // Height check: character's feet should be at or above the platform top
      // Platform top is at 0.15, so feet should be between 0.05 (slightly below) and 2.0 (way above, jumping)
      const isOnPlatformHeight = capsuleBottomY >= platformBottomY - 0.1 && capsuleBottomY <= platformTopY + 2.5;
      
      const isOnPlatform = isWithinBounds && isOnPlatformHeight;

      if (isOnPlatform) {
        // Character is on platform - apply damage every second
        if (currentTime - platform.lastDamageTime >= this.damageInterval) {
          // Apply +1 DS of this souffrance type
          // Use a dummy competence for testing (since this is environmental damage, not from a failed action)
          // We'll use a generic competence like PAS (walking) as the "used competence"
          const beforeDice = this.healthSystem['characterSheetManager'].getSouffrance(platform.souffrance).diceCount;
          const applied = this.healthSystem.applySouffranceFromFailure(
            platform.souffrance,
            1, // +1 DS
            Competence.PAS // Dummy competence for testing
          );
          const afterDiceRaw = this.healthSystem['characterSheetManager'].getSouffrance(platform.souffrance).diceCount;
          const afterDice = Math.round(afterDiceRaw * 10) / 10; // Round to 1 decimal
          
          platform.lastDamageTime = currentTime;
          
          // Note: Events are now logged in SouffranceHealthSystem.applySouffranceFromFailure
          // No need to duplicate them here
          const souffranceName = getSouffranceName(platform.souffrance);
          Debug.log('Scene', `Character on ${souffranceName} platform - applied ${applied.toFixed(1)} DS (total: ${afterDice.toFixed(1)} DS)`);
        }
        } else if (horizontalDistance < 3.0) {
          // Debug log occasionally to help troubleshoot when very close
          // Only log once per 2 seconds max per platform to avoid spam
          const debugKey = platform.souffrance;
          const lastDebugTime = this.lastDebugLogTime.get(debugKey) || 0;
          if (currentTime - lastDebugTime >= 2000) {
            const souffranceName = getSouffranceName(platform.souffrance);
            Debug.log('Scene', `Near ${souffranceName} platform: hDist=${horizontalDistance.toFixed(2)}, charY=${characterPos.y.toFixed(2)}, feetY=${capsuleBottomY.toFixed(2)}, platY=${platformPos.y.toFixed(2)}, platTop=${platformTopY.toFixed(2)}, platBot=${platformBottomY.toFixed(2)}, inBounds=${isWithinBounds}, onHeight=${isOnPlatformHeight}, isOn=${isOnPlatform}`);
            this.lastDebugLogTime.set(debugKey, currentTime);
          }
        }
    });
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



