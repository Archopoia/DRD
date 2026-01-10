import * as THREE from 'three';
import { GameLoop } from './GameLoop';
import { RetroRenderer } from '../renderer/RetroRenderer';
import { FPSCamera } from '../camera/FPSCamera';
import { Scene } from '../world/Scene';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { CharacterController } from '../physics/CharacterController';
import { CharacterSheetManager } from '../character/CharacterSheetManager';
import { SouffranceHealthSystem } from '../character/SouffranceHealthSystem';
import { ActiveCompetencesTracker } from '../character/ActiveCompetencesTracker';
import { GAME_CONFIG } from '@/lib/constants';
import { Debug } from '../utils/debug';

/**
 * Main game class that orchestrates all game systems
 */
export class Game {
  private renderer: RetroRenderer;
  private physicsWorld: PhysicsWorld;
  private characterController: CharacterController;
  private camera: FPSCamera;
  private scene: Scene;
  private gameLoop: GameLoop;
  private canvas: HTMLCanvasElement;
  private frameCount: number = 0;
  private lastFpsUpdate: number = 0;
  private fps: number = 0;
  private characterSheetManager: CharacterSheetManager;
  private healthSystem: SouffranceHealthSystem;

  constructor(canvas: HTMLCanvasElement) {
    Debug.startMeasure('Game.constructor');
    this.canvas = canvas;

    try {
      // Check WebGL support
      const webglCheck = Debug.checkWebGLSupport();
      if (!webglCheck.supported) {
        throw new Error(webglCheck.error || 'WebGL not supported');
      }
      Debug.log('Game', 'WebGL supported', webglCheck.version);

      // Initialize renderer
      Debug.log('Game', 'Initializing renderer...');
      this.renderer = new RetroRenderer(canvas);
      Debug.log('Game', 'Renderer initialized');

      // Initialize physics world
      Debug.log('Game', 'Initializing physics world...');
      this.physicsWorld = new PhysicsWorld();
      Debug.log('Game', 'Physics world initialized');

      // Initialize character sheet manager and health system
      Debug.log('Game', 'Initializing character systems...');
      this.characterSheetManager = new CharacterSheetManager();
      // Create active competences tracker for multi-competence XP distribution
      // Each CT has its own independent 2-second XP timeframe that resets when the CT is used again
      const activeCompetencesTracker = new ActiveCompetencesTracker(2000); // 2 second XP timeframe per CT
      this.healthSystem = new SouffranceHealthSystem(this.characterSheetManager, activeCompetencesTracker);
      Debug.log('Game', 'Character systems initialized');

      // Initialize character controller
      Debug.log('Game', 'Initializing character controller...');
      // Start character at a safe height above the ground
      // HEIGHT/2 is the capsule center, but we need to account for the capsule bottom
      // Capsule bottom = center - (halfHeight + radius)
      // We want the bottom to be slightly above the floor (y=0)
      const capsuleHalfHeight = (GAME_CONFIG.CHARACTER_CONTROLLER.HEIGHT - 2 * GAME_CONFIG.CHARACTER_CONTROLLER.RADIUS) / 2;
      const capsuleBottomOffset = capsuleHalfHeight + GAME_CONFIG.CHARACTER_CONTROLLER.RADIUS;
      const initialY = capsuleBottomOffset + 0.5; // Add 0.5 units above the floor for safety
      const initialPosition = { x: 0, y: initialY, z: 0 };
      // Use the same tracker instance for character controller and camera
      this.characterController = new CharacterController(this.physicsWorld, initialPosition, activeCompetencesTracker);
      Debug.log('Game', 'Character controller initialized');

      // Initialize camera (requires character controller)
      Debug.log('Game', 'Initializing camera...');
      // Use the same tracker instance that was created above
      this.camera = new FPSCamera(canvas, this.characterController, activeCompetencesTracker);
      Debug.log('Game', 'Camera initialized');

      // Initialize scene (requires physics world)
      Debug.log('Game', 'Initializing scene...');
      this.scene = new Scene(this.renderer, this.physicsWorld);
      // Connect character systems to scene for platform detection
      this.scene.setCharacterSystems(this.characterController, this.healthSystem);
      // Set scene reference for VISION detection (camera needs to detect objects)
      this.camera.setScene(this.scene.scene);
      Debug.log('Game', 'Scene initialized');

      // Setup game loop
      Debug.log('Game', 'Setting up game loop...');
      this.gameLoop = new GameLoop(
        (deltaTime) => this.update(deltaTime),
        () => this.render()
      );
      Debug.log('Game', 'Game loop setup complete');

      Debug.endMeasure('Game.constructor');
      Debug.log('Game', 'Game initialization complete');
    } catch (error) {
      Debug.error('Game', 'Failed to initialize game', error as Error);
      throw error;
    }
  }

  /**
   * Start the game
   */
  start(): void {
    try {
      Debug.log('Game', 'Starting game...');
      this.gameLoop.start();
      this.handleResize();
      window.addEventListener('resize', this.handleResize);
      this.lastFpsUpdate = performance.now();
      Debug.log('Game', 'Game started successfully');
    } catch (error) {
      Debug.error('Game', 'Failed to start game', error as Error);
      throw error;
    }
  }

  /**
   * Stop the game
   */
  stop(): void {
    this.gameLoop.stop();
    window.removeEventListener('resize', this.handleResize);
  }

  /**
   * Update game state
   */
  private update(deltaTime: number): void {
    try {
      // Step physics simulation
      this.physicsWorld.step(deltaTime);

      // Update character controller
      this.characterController.update(deltaTime);

      // Update camera (handles movement input)
      this.camera.update(deltaTime);

      // Sync dynamic objects with physics
      this.scene.update(deltaTime);
      
      // Calculate FPS every second
      this.frameCount++;
      const now = performance.now();
      if (now - this.lastFpsUpdate >= 1000) {
        this.fps = this.frameCount;
        this.frameCount = 0;
        this.lastFpsUpdate = now;
        
        if (this.fps < 30) {
          Debug.warn('Game', `Low FPS detected: ${this.fps} fps`);
        }
      }
    } catch (error) {
      Debug.error('Game', 'Error in update loop', error as Error);
    }
  }

  /**
   * Render the scene
   */
  private render(): void {
    try {
      this.renderer.renderer.render(this.scene.scene, this.camera.camera);
    } catch (error) {
      Debug.error('Game', 'Error in render loop', error as Error);
    }
  }

  /**
   * Get current FPS
   */
  getFPS(): number {
    return this.fps;
  }

  /**
   * Get character sheet manager (for UI integration)
   */
  getCharacterSheetManager(): CharacterSheetManager {
    return this.characterSheetManager;
  }

  /**
   * Get health system (for UI integration and active competences tracking)
   */
  getHealthSystem(): SouffranceHealthSystem {
    return this.healthSystem;
  }

  /**
   * Get active competences tracker (for UI display)
   */
  getActiveCompetencesTracker(): ActiveCompetencesTracker {
    return this.healthSystem.getActiveCompetencesTracker();
  }

  /**
   * Get Three.js scene (for editor/inspector)
   */
  getScene(): THREE.Scene {
    return this.scene.scene;
  }

  /**
   * Get Scene instance (for physics body access)
   */
  getSceneInstance(): Scene {
    return this.scene;
  }

  /**
   * Update physics body for a mesh (for editor gizmo dragging)
   */
  updatePhysicsBodyForMesh(mesh: THREE.Mesh): void {
    if (this.scene) {
      this.scene.updatePhysicsBodyFromMesh(mesh);
    }
  }

  /**
   * Get renderer (for editor - creating materials)
   */
  getRenderer(): RetroRenderer {
    return this.renderer;
  }

  /**
   * Add an object to the scene (for editor)
   */
  addObjectToScene(type: 'box' | 'sphere' | 'plane' | 'light' | 'group'): THREE.Object3D | null {
    try {
      let newObject: THREE.Object3D;

      switch (type) {
        case 'box': {
          const geometry = new THREE.BoxGeometry(1, 1, 1);
          const material = this.renderer.createRetroStandardMaterial(0x8a4a4a);
          newObject = new THREE.Mesh(geometry, material);
          newObject.name = 'Box';
          newObject.position.set(0, 1, 0);
          break;
        }
        case 'sphere': {
          const geometry = new THREE.SphereGeometry(0.5, 16, 16);
          const material = this.renderer.createRetroStandardMaterial(0x4a8a4a);
          newObject = new THREE.Mesh(geometry, material);
          newObject.name = 'Sphere';
          newObject.position.set(0, 1, 0);
          break;
        }
        case 'plane': {
          const geometry = new THREE.PlaneGeometry(2, 2);
          const material = this.renderer.createRetroStandardMaterial(0x4a4a8a);
          newObject = new THREE.Mesh(geometry, material);
          newObject.name = 'Plane';
          newObject.rotation.x = -Math.PI / 2;
          newObject.position.set(0, 0, 0);
          break;
        }
        case 'light': {
          newObject = new THREE.PointLight(0xffffff, 1, 10);
          newObject.name = 'PointLight';
          newObject.position.set(0, 3, 0);
          break;
        }
        case 'group': {
          newObject = new THREE.Group();
          newObject.name = 'Group';
          break;
        }
        default:
          Debug.warn('Game', `Unknown object type: ${type}`);
          return null;
      }

      this.scene.scene.add(newObject);
      Debug.log('Game', `Added ${type} object to scene: ${newObject.name}`);
      return newObject;
    } catch (error) {
      Debug.error('Game', `Failed to add ${type} object to scene`, error as Error);
      return null;
    }
  }

  /**
   * Disable all game controls (for UI overlays like console)
   */
  disableControls(): void {
    this.camera.disableControls();
    Debug.log('Game', 'All controls disabled');
  }

  /**
   * Enable all game controls
   */
  enableControls(): void {
    this.camera.enableControls();
    Debug.log('Game', 'All controls enabled');
  }

  /**
   * Handle window resize
   */
  private handleResize = (): void => {
    try {
      const width = window.innerWidth;
      const height = window.innerHeight;

      Debug.log('Game', `Resizing to ${width}x${height}`);
      this.renderer.resize(width, height);
      this.camera.resize(width, height);
    } catch (error) {
      Debug.error('Game', 'Error handling resize', error as Error);
    }
  };

  /**
   * Cleanup all resources
   */
  dispose(): void {
    this.stop();
    this.characterController.dispose();
    this.camera.dispose();
    this.scene.dispose();
    this.physicsWorld.dispose();
    this.renderer.dispose();
  }
}



