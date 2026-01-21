import { Entity } from '@/game/ecs/Entity';
import { TriggerComponent } from '@/game/ecs/components/TriggerComponent';
import * as THREE from 'three';

/**
 * Script Context - Provides information and APIs for script execution
 */
export interface ScriptContext {
  /**
   * The entity that triggered this script
   */
  entity: Entity;
  
  /**
   * The trigger component that triggered this script (if applicable)
   */
  triggerComponent?: TriggerComponent;
  
  /**
   * The entity that entered/exited the trigger (for trigger scripts)
   */
  otherEntity?: Entity;
  
  /**
   * Current game time in seconds
   */
  time: number;
  
  /**
   * Delta time since last frame
   */
  deltaTime: number;
  
  /**
   * Access to game systems (will be expanded as needed)
   */
  game?: {
    /**
     * Get entity by ID
     */
    getEntity: (id: string) => Entity | null;
    
    /**
     * Load a level by ID
     */
    loadLevel?: (levelId: string) => Promise<void>;
    
    /**
     * Spawn an entity from prefab
     */
    spawnEntity?: (prefabId: string, position: THREE.Vector3) => Entity | null;
    
    /**
     * Enable/disable an entity
     */
    setEntityEnabled?: (entityId: string, enabled: boolean) => void;
  };
  
  /**
   * Custom data passed to the script (from TriggerComponent.actionData)
   */
  data?: Record<string, any>;
}

/**
 * Script Interface - All scripts must export this interface
 */
export interface IScript {
  /**
   * Called when an entity enters the trigger zone
   */
  onEnter?: (context: ScriptContext) => void;
  
  /**
   * Called when an entity exits the trigger zone
   */
  onExit?: (context: ScriptContext) => void;
  
  /**
   * Called every frame while entity is inside trigger zone
   */
  onStay?: (context: ScriptContext) => void;
  
  /**
   * Called when entity interacts with trigger (e.g., key press)
   */
  onInteract?: (context: ScriptContext) => void;
  
  /**
   * Called every frame for entity scripts (not just triggers)
   */
  onUpdate?: (context: ScriptContext) => void;
}

/**
 * Script Module - Type for dynamically imported script modules
 */
export type ScriptModule = {
  default?: IScript;
  [key: string]: IScript | any;
};
