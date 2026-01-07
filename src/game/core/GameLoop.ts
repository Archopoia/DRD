import { Debug } from '../utils/debug';

/**
 * Game loop manager using requestAnimationFrame
 */
export class GameLoop {
  private animationId: number | null = null;
  private lastTime: number = 0;
  private isRunning: boolean = false;
  
  constructor(
    private update: (deltaTime: number) => void,
    private render: () => void
  ) {}

  start(): void {
    if (this.isRunning) {
      Debug.warn('GameLoop', 'Attempted to start already running game loop');
      return;
    }
    
    Debug.log('GameLoop', 'Starting game loop');
    this.isRunning = true;
    this.lastTime = performance.now();
    this.tick();
  }

  stop(): void {
    if (!this.isRunning) return;
    
    Debug.log('GameLoop', 'Stopping game loop');
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private tick = (): void => {
    if (!this.isRunning) return;

    try {
      const currentTime = performance.now();
      const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
      this.lastTime = currentTime;

      // Cap delta time to prevent large jumps
      const clampedDelta = Math.min(deltaTime, 0.1);

      // Warn if delta time is unusually large
      if (deltaTime > 0.1) {
        Debug.warn('GameLoop', `Large delta time: ${deltaTime.toFixed(3)}s`);
      }

      this.update(clampedDelta);
      this.render();

      this.animationId = requestAnimationFrame(this.tick);
    } catch (error) {
      Debug.error('GameLoop', 'Error in game loop tick', error as Error);
      this.stop();
    }
  };

  getRunning(): boolean {
    return this.isRunning;
  }
}



