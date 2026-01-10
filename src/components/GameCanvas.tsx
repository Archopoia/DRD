'use client';

import { useEffect, useRef, useState } from 'react';
import { Debug } from '@/game/utils/debug';
import CharacterSheet from './CharacterSheet';
import EventLog from './ui/EventLog';
import Console from './ui/Console';
import ActiveCompetencesDisplay from './ui/ActiveCompetencesDisplay';

/**
 * React component that wraps the Three.js game canvas
 */
export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState<number>(0);
  const [showCharacterSheet, setShowCharacterSheet] = useState<boolean>(false);
  const [showConsole, setShowConsole] = useState<boolean>(false);
  const [characterSheetManager, setCharacterSheetManager] = useState<any>(null);
  const [godMode, setGodMode] = useState<boolean>(true); // Default to true (god mode on by default)
  const [activeCTs, setActiveCTs] = useState<Array<{ competence: any; remainingTime: number }>>([]);

  // Handle console open/close - disable controls when console is open
  useEffect(() => {
    if (gameRef.current) {
      if (showConsole) {
        gameRef.current.disableControls();
      } else {
        gameRef.current.enableControls();
      }
    }
  }, [showConsole]);

  // Ensure cursor is visible when console is open
  useEffect(() => {
    if (showConsole) {
      // Force cursor to be visible on body
      document.body.style.cursor = 'auto';
      // Also ensure canvas shows cursor
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'auto';
      }
    } else {
      // Restore default cursor behavior
      document.body.style.cursor = '';
      if (canvasRef.current) {
        canvasRef.current.style.cursor = '';
      }
    }

    return () => {
      // Cleanup on unmount
      document.body.style.cursor = '';
      if (canvasRef.current) {
        canvasRef.current.style.cursor = '';
      }
    };
  }, [showConsole]);

  useEffect(() => {
    // Initialize Debug system to capture all console logs
    // This will clear previous logs and start fresh on each page refresh
    Debug.initialize();

    // Dynamically import Game to ensure it only loads on client side
    // This prevents Rapier from being loaded during SSR
    const initGame = async () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        Debug.error('GameCanvas', 'Canvas ref is null');
        setError('Canvas element not found');
        return;
      }

      Debug.log('GameCanvas', 'Initializing game...');

      try {
        // Dynamic import ensures this only runs on client
        const { Game } = await import('@/game/core/Game');
        
        // Initialize game
        const game = new Game(canvas);
        gameRef.current = game;
        game.start();
        
        // Get character sheet manager from game
        setCharacterSheetManager(game.getCharacterSheetManager());

        // Update FPS display every second
        const fpsInterval = setInterval(() => {
          if (gameRef.current) {
            setFps(gameRef.current.getFPS());
          }
        }, 1000);

        // Auto-save logs every second (append mode)
        const logSaveInterval = setInterval(() => {
          Debug.saveLogs(true).catch(() => {
            // Silently fail on periodic saves - not critical
          });
        }, 1000);

        // Update active CTs display (update more frequently for smooth countdown)
        const activeCTsInterval = setInterval(() => {
          if (gameRef.current) {
            try {
              const tracker = gameRef.current.getActiveCompetencesTracker();
              if (tracker) {
                const activeCTsWithTime = tracker.getActiveCompetencesWithRemainingTime();
                setActiveCTs(activeCTsWithTime);
              }
            } catch (error) {
              // Silently fail if tracker is not available yet
            }
          }
        }, 100); // Update 10 times per second for smooth countdown

        // Initial save - create the log file with all current logs
        Debug.saveLogs(false).catch(() => {
          // Silently fail on initial save - not critical
        });

        Debug.log('GameCanvas', 'Game initialized successfully');

        // Cleanup on unmount
        return () => {
          Debug.log('GameCanvas', 'Cleaning up game...');
          clearInterval(fpsInterval);
          clearInterval(logSaveInterval);
          clearInterval(activeCTsInterval);
          if (gameRef.current) {
            gameRef.current.dispose();
            gameRef.current = null;
          }
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        Debug.error('GameCanvas', 'Failed to initialize game', err as Error);
        setError(errorMessage);
      }
    };

    initGame();

    // Final save on page unload (append any remaining logs)
    const handleBeforeUnload = () => {
      // Save any remaining unsaved logs using append mode
      // Use fetch with keepalive for reliable delivery during page unload
      const newLogs = Debug.getNewLogs();
      if (newLogs.length > 0) {
        fetch('/api/save-logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            logs: newLogs,
            append: true,
            sessionStartTime: Debug.getSessionStartTime(),
          }),
          keepalive: true, // Ensures request completes even if page unloads
        }).catch(() => {
          // Silently fail - page is unloading anyway
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      // Cleanup
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Handle keyboard shortcuts (separate effect to avoid re-initializing game)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Tab key for console (only if not in an input field)
      if (event.code === 'Tab' && !event.repeat) {
        const target = event.target as HTMLElement;
        const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
        
        if (!isInput) {
          event.preventDefault();
          
          // Exit pointer lock immediately when opening console
          if (document.pointerLockElement && !showConsole) {
            document.exitPointerLock();
          }
          
          setShowConsole((prev) => {
            const newState = !prev;
            Debug.log('GameCanvas', `Console ${newState ? 'opened' : 'closed'}`);
            return newState;
          });
        }
      }
      
      // 'C' key for character sheet
      if (event.code === 'KeyC' && !event.repeat && !showConsole) {
        // Exit pointer lock to free the mouse cursor
        if (document.pointerLockElement) {
          document.exitPointerLock();
          Debug.log('GameCanvas', 'Pointer lock exited');
        }
        
        // Toggle character sheet
        setShowCharacterSheet((prev) => {
          const newState = !prev;
          Debug.log('GameCanvas', `Character sheet ${newState ? 'opened' : 'closed'}`);
          return newState;
        });
      }
      
      // 'L' key (with Ctrl/Cmd) to save logs
      if ((event.ctrlKey || event.metaKey) && event.code === 'KeyL' && !event.repeat) {
        event.preventDefault();
        Debug.saveLogs();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showConsole]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold mb-4 text-red-500">Game Initialization Error</h2>
          <p className="mb-4">{error}</p>
          <p className="text-sm text-gray-400">
            Please check the browser console for more details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        className={`w-full h-full block ${showConsole ? 'cursor-auto' : 'cursor-none'}`}
        style={{ display: 'block' }}
      />
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 right-4 bg-red-theme/90 border-2 border-border-dark rounded px-4 py-2 text-text-cream font-mono text-sm z-10 pointer-events-auto" style={{
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3), inset 0 0 0 1px #ffebc6'
        }}>
          <div>FPS: {fps}</div>
        </div>
      )}
      <CharacterSheet
        isOpen={showCharacterSheet}
        onClose={() => setShowCharacterSheet(false)}
        manager={characterSheetManager}
        godMode={godMode}
      />
      <EventLog maxVisible={10} />
      {godMode && (
        <ActiveCompetencesDisplay activeCompetencesWithTime={activeCTs} />
      )}
      <Console
        isOpen={showConsole}
        onClose={() => setShowConsole(false)}
        manager={characterSheetManager}
        godMode={godMode}
        setGodMode={setGodMode}
      />
    </>
  );
}



