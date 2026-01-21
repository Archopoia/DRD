import { IScript, ScriptContext } from '@/game/scripts/types';
import * as THREE from 'three';

/**
 * Door Trigger Script
 * Opens and closes a door when player enters/exits trigger zone
 */
export const doorScript: IScript = {
  onEnter: (context: ScriptContext) => {
    console.log('[DoorScript] onEnter: Opening door', {
      entityId: context.entity.id,
      entityName: context.entity.name,
      data: context.data,
    });

    // Get the door entity (could be the trigger entity or a referenced entity)
    const doorEntityId = context.data?.doorEntityId || context.entity.id;
    const doorEntity = context.game?.getEntity?.(doorEntityId);

    if (doorEntity) {
      // Move door open (simple example - in real implementation, animate transform)
      // This is a placeholder - actual door animation would be handled by a DoorComponent
      console.log('[DoorScript] Opening door entity:', doorEntity.id);
    }
  },

  onExit: (context: ScriptContext) => {
    console.log('[DoorScript] onExit: Closing door', {
      entityId: context.entity.id,
      entityName: context.entity.name,
    });

    // Close door when player leaves trigger
    const doorEntityId = context.data?.doorEntityId || context.entity.id;
    const doorEntity = context.game?.getEntity?.(doorEntityId);

    if (doorEntity) {
      console.log('[DoorScript] Closing door entity:', doorEntity.id);
    }
  },
};

export default doorScript;
