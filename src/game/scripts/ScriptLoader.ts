import { IScript, ScriptModule } from './types';
import { Debug } from '../utils/debug';

/**
 * Script Loader - Manages loading and caching of script files
 * Supports hot-reload in development mode
 */
export class ScriptLoader {
  private scriptCache: Map<string, IScript> = new Map();
  private loadedModules: Map<string, any> = new Map();
  private isLoading: Set<string> = new Set();

  constructor() {
    // In development, set up hot reload if needed
    // Next.js already handles hot reload for modules, so we can rely on that
    if (process.env.NODE_ENV === 'development') {
      Debug.log('ScriptLoader', 'Initialized in development mode - hot reload enabled');
    }
  }

  /**
   * Load a script from a file path
   * Path format: "scripts/triggers/door" (relative to src/game/)
   * @param scriptPath Path to the script file (without .ts extension)
   * @returns The loaded script, or null if loading failed
   */
  async loadScript(scriptPath: string): Promise<IScript | null> {
    // Check cache first
    if (this.scriptCache.has(scriptPath)) {
      return this.scriptCache.get(scriptPath)!;
    }

    // Prevent concurrent loading of the same script
    if (this.isLoading.has(scriptPath)) {
      Debug.warn('ScriptLoader', `Script ${scriptPath} is already loading`);
      return null;
    }

    this.isLoading.add(scriptPath);

    try {
      // Construct the full import path
      // In Next.js/TypeScript, we use dynamic imports with the path
      const importPath = `@/game/${scriptPath}`;
      
      Debug.log('ScriptLoader', `Loading script: ${importPath}`);
      
      // Dynamic import - this will be resolved by webpack/next.js
      const module = await import(importPath) as ScriptModule;
      
      // Extract the script from the module
      let script: IScript | null = null;
      
      // Try default export first
      if (module.default) {
        script = module.default as IScript;
      } else {
        // Try to find a script export
        const scriptKeys = Object.keys(module).filter(key => {
          const value = module[key];
          return value && typeof value === 'object' && 
                 ('onEnter' in value || 'onExit' in value || 'onStay' in value || 'onInteract' in value || 'onUpdate' in value);
        });
        
        if (scriptKeys.length > 0) {
          script = module[scriptKeys[0]] as IScript;
          Debug.log('ScriptLoader', `Found script in export: ${scriptKeys[0]}`);
        }
      }

      if (!script) {
        Debug.error('ScriptLoader', `No script found in module: ${scriptPath}`);
        this.isLoading.delete(scriptPath);
        return null;
      }

      // Cache the script
      this.scriptCache.set(scriptPath, script);
      this.loadedModules.set(scriptPath, module);
      
      Debug.log('ScriptLoader', `Script loaded successfully: ${scriptPath}`);
      this.isLoading.delete(scriptPath);
      
      return script;
    } catch (error) {
      Debug.error('ScriptLoader', `Failed to load script: ${scriptPath}`, error as Error);
      this.isLoading.delete(scriptPath);
      return null;
    }
  }

  /**
   * Get a cached script (doesn't load if not cached)
   */
  getCachedScript(scriptPath: string): IScript | null {
    return this.scriptCache.get(scriptPath) || null;
  }

  /**
   * Clear script cache (useful for hot reload)
   */
  clearCache(scriptPath?: string): void {
    if (scriptPath) {
      this.scriptCache.delete(scriptPath);
      this.loadedModules.delete(scriptPath);
      Debug.log('ScriptLoader', `Cleared cache for script: ${scriptPath}`);
    } else {
      this.scriptCache.clear();
      this.loadedModules.clear();
      Debug.log('ScriptLoader', 'Cleared all script cache');
    }
  }

  /**
   * Reload a script (clear cache and reload)
   */
  async reloadScript(scriptPath: string): Promise<IScript | null> {
    this.clearCache(scriptPath);
    return this.loadScript(scriptPath);
  }

  /**
   * Check if a script is cached
   */
  isCached(scriptPath: string): boolean {
    return this.scriptCache.has(scriptPath);
  }
}
