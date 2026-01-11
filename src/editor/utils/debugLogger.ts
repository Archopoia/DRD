/**
 * Debug Logger - Centralized logging system for the editor
 * Logs can be displayed in the Console component
 */

export type DebugLogType = 'gizmo' | 'selection' | 'transform' | 'camera' | 'general' | 'editor' | 'scene' | 'history';

export interface DebugLog {
  type: DebugLogType;
  message: string;
  data?: any;
  timestamp: number;
}

class DebugLogger {
  private logs: DebugLog[] = [];
  private listeners: Set<(logs: DebugLog[]) => void> = new Set();
  private enabled: boolean = true;
  private maxLogs: number = 500; // Keep last 500 logs

  /**
   * Add a debug log
   */
  log(type: DebugLogType, message: string, data?: any): void {
    if (!this.enabled) return;

    const log: DebugLog = {
      type,
      message,
      data,
      timestamp: Date.now(),
    };

    this.logs.push(log);

    // Limit log count
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Also log to browser console
    console.log(`[${type.toUpperCase()}] ${message}`, data || '');

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Subscribe to log updates
   */
  subscribe(callback: (logs: DebugLog[]) => void): () => void {
    this.listeners.add(callback);
    // Immediately call with current logs
    callback([...this.logs]);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Get all logs
   */
  getLogs(): DebugLog[] {
    return [...this.logs];
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.logs = [];
    this.notifyListeners();
  }

  /**
   * Enable/disable logging
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if logging is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback([...this.logs]);
      } catch (error) {
        console.error('Error in debug log listener:', error);
      }
    });
  }
}

// Export singleton instance
export const debugLogger = new DebugLogger();

// Convenience functions
export const logGizmo = (message: string, data?: any) => debugLogger.log('gizmo', message, data);
export const logSelection = (message: string, data?: any) => debugLogger.log('selection', message, data);
export const logTransform = (message: string, data?: any) => debugLogger.log('transform', message, data);
export const logCamera = (message: string, data?: any) => debugLogger.log('camera', message, data);
export const logGeneral = (message: string, data?: any) => debugLogger.log('general', message, data);
export const logEditor = (message: string, data?: any) => debugLogger.log('editor', message, data);
export const logScene = (message: string, data?: any) => debugLogger.log('scene', message, data);
export const logHistory = (message: string, data?: any) => debugLogger.log('history', message, data);

