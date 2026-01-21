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
import { EntityManager } from '../ecs/EntityManager';
import { EntityFactory } from '../ecs/factories/EntityFactory';
import { PrefabManager } from '../ecs/prefab/PrefabManager';
import { SceneStorage } from '../ecs/storage/SceneStorage';
import { SceneSerializer } from '../ecs/serialization/SceneSerializer';
import { Entity } from '../ecs/Entity';
import { ScriptLoader } from '../scripts/ScriptLoader';
import { TriggerComponent } from '../ecs/components/TriggerComponent';
import { MaterialLibrary } from '../assets/MaterialLibrary';

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
  private entityManager: EntityManager | null = null;
  private entityFactory: EntityFactory | null = null;
  private prefabManager: PrefabManager | null = null;
  private sceneStorage: SceneStorage | null = null;
  private scriptLoader: ScriptLoader | null = null;
  private materialLibrary: MaterialLibrary | null = null;

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

      // Initialize ECS system
      Debug.log('Game', 'Initializing ECS system...');
      this.entityManager = new EntityManager(this.scene.scene, this.renderer, this.physicsWorld);
      
      // Initialize script loader first (needed for entity factory)
      this.scriptLoader = new ScriptLoader();
      
      // Initialize material library
      Debug.log('Game', 'Initializing material library...');
      this.materialLibrary = new MaterialLibrary();
      this.materialLibrary.initialize().catch(err => {
        Debug.warn('Game', 'Failed to initialize material library', err);
      });
      
      this.entityFactory = new EntityFactory(this.entityManager, this.renderer, this.physicsWorld, this.scriptLoader);
      this.prefabManager = new PrefabManager();
      this.sceneStorage = new SceneStorage();
      // Initialize storage asynchronously
      this.sceneStorage.initialize().catch(err => {
        Debug.warn('Game', 'Failed to initialize scene storage', err);
      });
      
      // Script loader already initialized before EntityFactory
      this.setScriptLoaderForTriggers();
      
      // Set MaterialLibrary for all existing MaterialComponents
      this.setMaterialLibraryForComponents();
      
      Debug.log('Game', 'ECS system initialized');

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
   * Pause the game (pause physics simulation)
   */
  pause(): void {
    if (this.gameLoop.getRunning()) {
      this.gameLoop.stop();
    }
  }

  /**
   * Resume the game (resume physics simulation)
   */
  resume(): void {
    if (!this.gameLoop.getRunning()) {
      this.gameLoop.start();
    }
  }

  /**
   * Check if game is running
   */
  isRunning(): boolean {
    return this.gameLoop.getRunning();
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

      // Update ECS entities
      if (this.entityManager) {
        this.entityManager.update(deltaTime);
      }
      
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
   * Get Three.js scene
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
   * Update physics body for a mesh
   */
  updatePhysicsBodyForMesh(mesh: THREE.Mesh): void {
    if (this.scene) {
      this.scene.updatePhysicsBodyFromMesh(mesh);
    }
  }

  /**
   * Get renderer
   */
  getRenderer(): RetroRenderer {
    return this.renderer;
  }

  /**
   * Add an object to the scene (for editor) - Now uses ECS EntityFactory
   */
  addObjectToScene(type: 'box' | 'sphere' | 'plane' | 'light' | 'group' | 'trigger' | 'spawnPoint' | 'npc' | 'item'): THREE.Object3D | null {
    try {
      if (!this.entityFactory || !this.entityManager) {
        Debug.error('Game', 'ECS system not initialized');
        return null;
      }

      // Use EntityFactory to create entity
      const entity = this.entityFactory.createByType(type, {
        withPhysics: type !== 'light' && type !== 'group' && type !== 'trigger', // Add physics to meshes (triggers have their own)
        physicsType: 'dynamic',
      });

      // Get the Three.js object from the entity
      const object3D = this.entityManager.getObject3D(entity);
      if (object3D) {
        Debug.log('Game', `Added ${type} entity to scene: ${entity.name} (${entity.id})`);
        return object3D;
      }

      Debug.warn('Game', `Failed to get Object3D from entity: ${entity.name}`);
      return null;
    } catch (error) {
      Debug.error('Game', `Failed to add ${type} object to scene`, error as Error);
      return null;
    }
  }

  /**
   * Get EntityManager
   */
  getEntityManager(): EntityManager | null {
    return this.entityManager;
  }

  /**
   * Get EntityFactory (for creating entities)
   */
  getEntityFactory(): EntityFactory | null {
    return this.entityFactory;
  }

  /**
   * Get PrefabManager (for prefab operations)
   */
  getPrefabManager(): PrefabManager | null {
    return this.prefabManager;
  }

  /**
   * Get SceneStorage (for save/load operations)
   */
  getSceneStorage(): SceneStorage | null {
    return this.sceneStorage;
  }

  /**
   * Get ScriptLoader (for script operations)
   */
  getScriptLoader(): ScriptLoader | null {
    return this.scriptLoader;
  }

  /**
   * Get MaterialLibrary (for material operations)
   */
  getMaterialLibrary(): MaterialLibrary | null {
    return this.materialLibrary;
  }

  /**
   * Get PhysicsWorld (for brush creation and physics operations)
   */
  getPhysicsWorld(): PhysicsWorld {
    return this.physicsWorld;
  }

  /**
   * Set script loader for all existing trigger components
   */
  private setScriptLoaderForTriggers(): void {
    if (!this.entityManager || !this.scriptLoader) return;

    const entities = this.entityManager.getAllEntities();
    entities.forEach(entity => {
      const triggerComponent = this.entityManager!.getComponent<TriggerComponent>(entity, 'TriggerComponent');
      if (triggerComponent) {
        triggerComponent.setScriptLoader(this.scriptLoader!);
      }
    });
  }

  /**
   * Set MaterialLibrary for all existing MaterialComponents
   */
  private setMaterialLibraryForComponents(): void {
    if (!this.materialLibrary || !this.entityManager) return;

    const entities = this.entityManager.getAllEntities();
    entities.forEach(entity => {
      const materialComponent = this.entityManager!.getComponent<any>(entity, 'MaterialComponent');
      if (materialComponent && materialComponent.setMaterialLibrary) {
        materialComponent.setMaterialLibrary(this.materialLibrary!);
      }
    });
  }

  /**
   * Save current scene
   */
  async saveScene(sceneName: string = 'Scene', author?: string): Promise<string | null> {
    console.log('[Game] saveScene: Starting save', {
      sceneName,
      author,
      hasEntityManager: !!this.entityManager,
      hasSceneStorage: !!this.sceneStorage,
    });

    if (!this.entityManager || !this.sceneStorage) {
      Debug.error('Game', 'ECS system or storage not initialized');
      console.error('[Game] saveScene: ECS system or storage not initialized', {
        entityManager: !!this.entityManager,
        sceneStorage: !!this.sceneStorage,
      });
      return null;
    }

    try {
      const serialized = SceneSerializer.serialize(this.entityManager, sceneName, author);
      console.log('[Game] saveScene: Scene serialized', {
        sceneName,
        entityCount: serialized.entities.length,
        version: serialized.version,
        metadata: serialized.metadata,
      });

      const id = await this.sceneStorage.saveScene(serialized);
      if (id) {
        Debug.log('Game', `Scene saved: ${sceneName} (${id})`);
        console.log('[Game] saveScene: Scene saved successfully', {
          sceneName,
          sceneId: id,
          entityCount: serialized.entities.length,
          author,
        });
      } else {
        console.error('[Game] saveScene: Save returned null id');
      }
      return id;
    } catch (error) {
      Debug.error('Game', 'Failed to save scene', error as Error);
      console.error('[Game] saveScene: Error saving scene', {
        sceneName,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return null;
    }
  }

  /**
   * Load scene from storage
   */
  async loadScene(sceneId: string): Promise<boolean> {
    if (!this.entityManager || !this.sceneStorage) {
      Debug.error('Game', 'ECS system or storage not initialized');
      return false;
    }

    try {
      const serialized = await this.sceneStorage.loadScene(sceneId);
      if (!serialized) {
        Debug.error('Game', `Scene not found: ${sceneId}`);
        return false;
      }

      // Clear existing entities before loading new scene
      Debug.log('Game', 'Clearing existing entities before loading scene...');
      this.entityManager.clearAll();

      // Deserialize the new scene
      SceneSerializer.deserialize(this.entityManager, serialized, this.renderer, this.physicsWorld);
      
      // Set script loader for all triggers after deserialization
      this.setScriptLoaderForTriggers();
      
      // Set material library for all material components after deserialization
      this.setMaterialLibraryForComponents();

      Debug.log('Game', `Scene loaded: ${serialized.metadata.name}`);
      return true;
    } catch (error) {
      Debug.error('Game', 'Failed to load scene', error as Error);
      return false;
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



