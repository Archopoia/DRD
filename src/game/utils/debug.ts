/**
 * Debug utility for logging and performance monitoring
 * Captures all console output and provides file download functionality
 */

const DEBUG_ENABLED = process.env.NODE_ENV === 'development';

export class Debug {
  private static logs: string[] = [];
  private static maxLogs = 10000; // Increased to capture more logs
  private static performanceMetrics: Map<string, number[]> = new Map();
  private static consoleIntercepted = false;
  private static originalConsole: {
    log: typeof console.log;
    error: typeof console.error;
    warn: typeof console.warn;
    info: typeof console.info;
  } | null = null;
  private static lastSavedIndex = 0; // Track how many logs have been saved
  private static sessionStartTime = new Date().toISOString().replace(/[:.]/g, '-'); // Session-based filename

  /**
   * Initialize console interception to capture all logs
   * Should be called once at application startup
   */
  static initialize(): void {
    // Clear logs on initialization (page refresh/game restart)
    this.clearLogs();
    
    // Intercept console methods to capture all output
    if (!this.consoleIntercepted && typeof window !== 'undefined') {
      this.originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info,
      };

      // Intercept console.log
      console.log = (...args: unknown[]) => {
        this.originalConsole!.log(...args);
        this.addLog('LOG', args);
      };

      // Intercept console.error
      console.error = (...args: unknown[]) => {
        this.originalConsole!.error(...args);
        this.addLog('ERROR', args);
      };

      // Intercept console.warn
      console.warn = (...args: unknown[]) => {
        this.originalConsole!.warn(...args);
        this.addLog('WARN', args);
      };

      // Intercept console.info
      console.info = (...args: unknown[]) => {
        this.originalConsole!.info(...args);
        this.addLog('INFO', args);
      };

      this.consoleIntercepted = true;
      this.originalConsole.log('[Debug] Console interception initialized - all logs will be captured');
    }
  }

  /**
   * Add a log entry with proper formatting
   */
  private static addLog(level: string, args: unknown[]): void {
    const timestamp = new Date().toISOString();
    
    // Format arguments into a string
    const formattedArgs = args.map(arg => {
      if (arg instanceof Error) {
        return `${arg.message}\n${arg.stack || ''}`;
      }
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');

    const logMessage = `[${timestamp}] [${level}] ${formattedArgs}`;
    
    this.logs.push(logMessage);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  /**
   * Log a debug message
   */
  static log(category: string, message: string, ...args: unknown[]): void {
    if (!DEBUG_ENABLED) return;

    const timestamp = new Date().toISOString();
    
    // Format all arguments into a string
    const formattedArgs = args.length > 0 ? ' ' + args.map(arg => {
      if (arg instanceof Error) {
        return `${arg.message}\n${arg.stack || ''}`;
      }
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ') : '';
    
    const logMessage = `[${timestamp}] [${category}] ${message}${formattedArgs}`;
    
    if (this.originalConsole) {
      this.originalConsole.log(`[${timestamp}] [${category}] ${message}`, ...args);
    } else {
      console.log(`[${timestamp}] [${category}] ${message}`, ...args);
    }
    
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
    const logMessage = `[${timestamp}] [ERROR] [${category}] ${message}${error ? `\n${error.message}\n${error.stack || ''}` : ''}`;
    
    if (this.originalConsole) {
      this.originalConsole.error(logMessage, error);
    } else {
      console.error(logMessage, error);
    }
    
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
    
    // Format all arguments into a string
    const formattedArgs = args.length > 0 ? ' ' + args.map(arg => {
      if (arg instanceof Error) {
        return `${arg.message}\n${arg.stack || ''}`;
      }
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ') : '';
    
    const logMessage = `[${timestamp}] [WARN] [${category}] ${message}${formattedArgs}`;
    
    if (this.originalConsole) {
      this.originalConsole.warn(`[${timestamp}] [WARN] [${category}] ${message}`, ...args);
    } else {
      console.warn(`[${timestamp}] [WARN] [${category}] ${message}`, ...args);
    }
    
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
    this.performanceMetrics.clear();
    this.lastSavedIndex = 0;
    this.sessionStartTime = new Date().toISOString().replace(/[:.]/g, '-');
  }

  /**
   * Get new logs since last save
   */
  static getNewLogs(): string[] {
    return this.logs.slice(this.lastSavedIndex);
  }

  /**
   * Mark logs as saved (used internally after successful save)
   */
  static markLogsAsSaved(count: number): void {
    this.lastSavedIndex = Math.min(this.lastSavedIndex + count, this.logs.length);
  }

  /**
   * Get session start time for consistent filename
   */
  static getSessionStartTime(): string {
    return this.sessionStartTime;
  }

  /**
   * Save logs to a file in the project folder
   * Sends logs to the API endpoint which writes them to logs/ directory
   * @param append - If true, only saves new logs and appends to existing file
   */
  static async saveLogs(append: boolean = false): Promise<void> {
    const logsToSave = append ? this.getNewLogs() : this.logs;
    
    if (logsToSave.length === 0) {
      return; // Silently return if no new logs
    }

    try {
      const response = await fetch('/api/save-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs: logsToSave,
          append,
          sessionStartTime: this.sessionStartTime,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save logs');
      }

      const result = await response.json();
      
      // Mark logs as saved
      if (append) {
        this.markLogsAsSaved(logsToSave.length);
      } else {
        this.lastSavedIndex = this.logs.length;
      }
      
      if (this.originalConsole && !append) {
        // Only log when doing full save (not periodic appends)
        this.originalConsole.log(`[Debug] Saved ${result.logCount} log entries to ${result.filename}`);
        this.originalConsole.log(`[Debug] File location: ${result.path}`);
      }
    } catch (error) {
      if (this.originalConsole) {
        this.originalConsole.error('[Debug] Failed to save logs', error);
      } else {
        console.error('[Debug] Failed to save logs', error);
      }
    }
  }

  /**
   * Get logs as a string (for programmatic access)
   */
  static getLogsAsString(): string {
    return this.logs.join('\n');
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

