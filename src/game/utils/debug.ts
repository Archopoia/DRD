/**
 * Debug utility for logging and performance monitoring
 */

const DEBUG_ENABLED = process.env.NODE_ENV === 'development';

export class Debug {
  private static logs: string[] = [];
  private static maxLogs = 100;
  private static performanceMetrics: Map<string, number[]> = new Map();

  /**
   * Log a debug message
   */
  static log(category: string, message: string, ...args: unknown[]): void {
    if (!DEBUG_ENABLED) return;

    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${category}] ${message}`;
    
    console.log(logMessage, ...args);
    
    this.logs.push(logMessage);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  /**
   * Log an error
   */
  static error(category: string, message: string, error?: Error): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [ERROR] [${category}] ${message}`;
    
    console.error(logMessage, error);
    
    this.logs.push(logMessage);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  /**
   * Log a warning
   */
  static warn(category: string, message: string, ...args: unknown[]): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [WARN] [${category}] ${message}`;
    
    console.warn(logMessage, ...args);
    
    this.logs.push(logMessage);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  /**
   * Start performance measurement
   */
  static startMeasure(label: string): void {
    if (!DEBUG_ENABLED) return;
    performance.mark(`${label}-start`);
  }

  /**
   * End performance measurement and log
   */
  static endMeasure(label: string): void {
    if (!DEBUG_ENABLED) return;
    
    try {
      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);
      
      const measure = performance.getEntriesByName(label)[0];
      const duration = measure.duration;
      
      if (!this.performanceMetrics.has(label)) {
        this.performanceMetrics.set(label, []);
      }
      const metrics = this.performanceMetrics.get(label)!;
      metrics.push(duration);
      
      // Keep only last 60 measurements
      if (metrics.length > 60) {
        metrics.shift();
      }
      
      // Log if duration is significant
      if (duration > 16) { // More than one frame at 60fps
        this.warn('Performance', `${label} took ${duration.toFixed(2)}ms`);
      }
    } catch (error) {
      this.error('Performance', `Failed to measure ${label}`, error as Error);
    }
  }

  /**
   * Get average performance for a label
   */
  static getAveragePerformance(label: string): number {
    const metrics = this.performanceMetrics.get(label);
    if (!metrics || metrics.length === 0) return 0;
    
    const sum = metrics.reduce((a, b) => a + b, 0);
    return sum / metrics.length;
  }

  /**
   * Get all logs
   */
  static getLogs(): string[] {
    return [...this.logs];
  }

  /**
   * Clear logs
   */
  static clearLogs(): void {
    this.logs = [];
  }

  /**
   * Check WebGL support
   */
  static checkWebGLSupport(): { supported: boolean; version?: string; error?: string } {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) {
        return {
          supported: false,
          error: 'WebGL not supported. Try updating your browser or graphics drivers.',
        };
      }

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const version = debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        : 'Unknown';

      return {
        supported: true,
        version,
      };
    } catch (error) {
      return {
        supported: false,
        error: `WebGL check failed: ${(error as Error).message}`,
      };
    }
  }
}

