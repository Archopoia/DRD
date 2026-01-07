import * as THREE from 'three';
import { GameLoop } from './GameLoop';
import { RetroRenderer } from '../renderer/RetroRenderer';
import { FPSCamera } from '../camera/FPSCamera';
import { Scene } from '../world/Scene';
import { GAME_CONFIG } from '@/lib/constants';
import { Debug } from '../utils/debug';

/**
 * Main game class that orchestrates all game systems
 */
export class Game {
  private renderer: RetroRenderer;
  private camera: FPSCamera;
  private scene: Scene;
  private gameLoop: GameLoop;
  private canvas: HTMLCanvasElement;
  private frameCount: number = 0;
  private lastFpsUpdate: number = 0;
  private fps: number = 0;

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

      // Initialize camera
      Debug.log('Game', 'Initializing camera...');
      this.camera = new FPSCamera(canvas);
      Debug.log('Game', 'Camera initialized');

      // Initialize scene
      Debug.log('Game', 'Initializing scene...');
      this.scene = new Scene(this.renderer);
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
      this.camera.update(deltaTime);
      
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
    this.camera.dispose();
    this.scene.dispose();
    this.renderer.dispose();
  }
}



