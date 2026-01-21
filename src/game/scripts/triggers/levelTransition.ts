import { IScript, ScriptContext } from '@/game/scripts/types';

/**
 * Level Transition Trigger Script
 * Transitions to another level when player enters trigger zone
 */
export const levelTransitionScript: IScript = {
  onEnter: (context: ScriptContext) => {
    console.log('[LevelTransitionScript] onEnter: Transitioning to level', {
      entityId: context.entity.id,
      data: context.data,
    });

    const targetLevelId = context.data?.levelId;
    if (!targetLevelId) {
      console.warn('[LevelTransitionScript] No levelId specified in actionData');
      return;
    }

    // Load the target level
    if (context.game?.loadLevel) {
      console.log('[LevelTransitionScript] Loading level:', targetLevelId);
      context.game.loadLevel(targetLevelId).catch((error) => {
        console.error('[LevelTransitionScript] Failed to load level:', error);
      });
    } else {
      console.warn('[LevelTransitionScript] loadLevel not available in game context');
    }
  },
};

export default levelTransitionScript;
