import { IScript, ScriptContext } from '@/game/scripts/types';
import * as THREE from 'three';

/**
 * Spawn Trigger Script
 * Spawns an entity when player enters the trigger zone
 */
export const spawnScript: IScript = {
  onEnter: (context: ScriptContext) => {
    console.log('[SpawnScript] onEnter: Spawning entity', {
      entityId: context.entity.id,
      data: context.data,
    });

    const prefabId = context.data?.prefabId;
    if (!prefabId) {
      console.warn('[SpawnScript] No prefabId specified in actionData');
      return;
    }

    // Get spawn position (default to trigger position)
    const spawnPosition = context.data?.spawnPosition || { x: 0, y: 1, z: 0 };
    const position = new THREE.Vector3(
      spawnPosition.x,
      spawnPosition.y,
      spawnPosition.z
    );

    // Spawn entity at position
    if (context.game?.spawnEntity) {
      const spawnedEntity = context.game.spawnEntity(prefabId, position);
      if (spawnedEntity) {
        console.log('[SpawnScript] Entity spawned:', {
          prefabId,
          entityId: spawnedEntity.id,
          position: position.toArray(),
        });
      } else {
        console.error('[SpawnScript] Failed to spawn entity:', prefabId);
      }
    }
  },
};

export default spawnScript;
