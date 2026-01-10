'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { CharacterSheetManager } from '@/game/character/CharacterSheetManager';
import { Competence } from '@/game/character/data/CompetenceData';
import { Attribute } from '@/game/character/data/AttributeData';
import { getCompetenceName } from '@/game/character/data/CompetenceData';
import { getAttributeName } from '@/game/character/data/AttributeData';

interface ConsoleProps {
  isOpen: boolean;
  onClose: () => void;
  manager?: CharacterSheetManager;
  godMode: boolean;
  setGodMode: (enabled: boolean) => void;
}

interface ConsoleMessage {
  type: 'command' | 'success' | 'error' | 'info';
  text: string;
  timestamp: number;
}

/**
 * Game Console Component
 * Allows typing commands to affect game variables
 * Press Tab to toggle
 */
export default function Console({ isOpen, onClose, manager, godMode, setGodMode }: ConsoleProps) {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<ConsoleMessage[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<string[]>([]);

  // Focus input when console opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle command execution
  const executeCommand = (command: string) => {
    if (!command.trim()) return;

    // Add to history
    const newHistory = [...historyRef.current, command];
    historyRef.current = newHistory;
    setHistoryIndex(-1);

    // Add command to display
    setHistory((prev) => [
      ...prev,
      {
        type: 'command',
        text: command,
        timestamp: Date.now(),
      },
    ]);

    // Parse and execute command
    const parts = command.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    try {
      let result: string | null = null;

      switch (cmd) {
        case 'gainxp':
        case 'xp':
          result = handleGainXP(args, manager);
          break;
        case 'setattribute':
        case 'setattr':
          result = handleSetAttribute(args, manager);
          break;
        case 'addfreemarks':
        case 'freemarks':
          result = handleAddFreeMarks(args, manager);
          break;
        case 'setcompetence':
        case 'setcomp':
          result = handleSetCompetence(args, manager);
          break;
        case 'reveal':
          result = handleReveal(args, manager);
          break;
        case 'godmode':
        case 'god':
          result = handleGodMode(args, godMode, setGodMode);
          break;
        case 'help':
          result = getHelpText();
          break;
        default:
          result = `Unknown command: ${cmd}. Type 'help' for available commands.`;
      }

      if (result) {
        setHistory((prev) => [
          ...prev,
          {
            type: result.startsWith('Error:') ? 'error' : 'success',
            text: result,
            timestamp: Date.now(),
          },
        ]);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setHistory((prev) => [
        ...prev,
        {
          type: 'error',
          text: `Error: ${errorMsg}`,
          timestamp: Date.now(),
        },
      ]);
    }

    // Clear input
    setInput('');
  };

  // Handle Enter key
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyRef.current.length > 0) {
        const newIndex = historyIndex === -1 
          ? historyRef.current.length - 1 
          : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(historyRef.current[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex >= 0) {
        const newIndex = historyIndex + 1;
        if (newIndex >= historyRef.current.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(newIndex);
          setInput(historyRef.current[newIndex]);
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed left-4 max-w-md pointer-events-auto z-30"
      style={{
        bottom: 'calc(1rem + 320px)', // Position above EventLog (EventLog is at bottom-4, estimate ~320px height for 10 events)
      }}
    >
      <div
        className="bg-gray-900/95 border-2 border-gray-700 rounded-lg shadow-2xl overflow-hidden"
        style={{
          backdropFilter: 'blur(4px)',
        }}
      >
        {/* Header */}
        <div className="bg-gray-800/90 border-b border-gray-700 px-3 py-2 flex items-center justify-between">
          <span className="text-xs font-mono text-gray-300 font-semibold">
            Console (Press Tab to close)
          </span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xs px-2 py-1"
          >
            ×
          </button>
        </div>

        {/* History */}
        <div
          className="px-3 py-2 max-h-48 overflow-y-auto font-mono text-xs"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            minHeight: '100px',
          }}
        >
          {history.length === 0 ? (
            <div className="text-gray-500 italic">
              Type commands to affect game variables. Type 'help' for available commands.
            </div>
          ) : (
            history.map((msg, idx) => (
              <div
                key={idx}
                className={`mb-1 ${
                  msg.type === 'command'
                    ? 'text-gray-300'
                    : msg.type === 'success'
                    ? 'text-green-400'
                    : msg.type === 'error'
                    ? 'text-red-400'
                    : 'text-blue-400'
                }`}
              >
                {msg.type === 'command' && <span className="text-gray-500">$ </span>}
                {msg.text}
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="px-3 py-2 bg-gray-800/90 border-t border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-mono text-xs">$</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-white font-mono text-xs outline-none"
              placeholder="Type a command..."
              autoComplete="off"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Command handlers
function handleGainXP(args: string[], manager?: CharacterSheetManager): string {
  if (!manager) {
    return 'Error: Character sheet manager not available';
  }

  if (args.length < 2) {
    return 'Error: Usage: gainXP <competence> <amount> [eternal]';
  }

  const competenceName = args[0].toUpperCase();
  const amount = parseInt(args[1], 10);
  const isEternal = args[2]?.toLowerCase() === 'eternal' || args[2]?.toLowerCase() === 'e';

  if (isNaN(amount) || amount <= 0) {
    return 'Error: Amount must be a positive number';
  }

  // Find competence by name
  const competence = Object.values(Competence).find(
    (c) => c === competenceName || getCompetenceName(c).toUpperCase() === competenceName
  );

  if (!competence) {
    return `Error: Competence '${competenceName}' not found. Use competence enum value (e.g., ARME, LUTTE, VISION)`;
  }

  // Add marks
  for (let i = 0; i < amount; i++) {
    manager.addCompetenceMark(competence, isEternal);
  }

  const totalMarks = manager.getTotalMarks(competence);
  const level = manager.getCompetenceLevel(competence);
  const comp = manager.getCompetence(competence);
  const requiredMarks = 100 - comp.eternalMarks; // Video game uses 100 marks (TTRPG uses 10)
  const eternalText = isEternal ? ' (eternal)' : '';

  return `Added ${amount} mark${amount > 1 ? 's' : ''}${eternalText} to ${getCompetenceName(competence)} compétence. Total: ${totalMarks}/${requiredMarks} (Level ${level})`;
}

function handleSetAttribute(args: string[], manager?: CharacterSheetManager): string {
  if (!manager) {
    return 'Error: Character sheet manager not available';
  }

  if (args.length < 2) {
    return 'Error: Usage: setAttribute <attribute> <value>';
  }

  const attrName = args[0].toUpperCase();
  const value = parseInt(args[1], 10);

  if (isNaN(value) || value < -50 || value > 50) {
    return 'Error: Value must be a number between -50 and 50';
  }

  const attribute = Object.values(Attribute).find(
    (a) => a === attrName || getAttributeName(a).toUpperCase() === attrName
  );

  if (!attribute) {
    return `Error: Attribute '${attrName}' not found. Use: FOR, AGI, DEX, VIG, EMP, PER, CRE, VOL`;
  }

  manager.setAttribute(attribute, value);
  const state = manager.getState();
  const currentValue = state.attributes[attribute];

  return `Set ${getAttributeName(attribute)} to ${currentValue}`;
}

function handleAddFreeMarks(args: string[], manager?: CharacterSheetManager): string {
  if (!manager) {
    return 'Error: Character sheet manager not available';
  }

  if (args.length < 1) {
    return 'Error: Usage: addFreeMarks <amount>';
  }

  const amount = parseInt(args[0], 10);

  if (isNaN(amount) || amount <= 0) {
    return 'Error: Amount must be a positive number';
  }

  const currentFreeMarks = manager.getFreeMarks();
  manager.addFreeMarks(amount);
  const newTotal = manager.getFreeMarks();

  return `Added ${amount} free mark${amount > 1 ? 's' : ''}. Total: ${newTotal}`;
}

function handleSetCompetence(args: string[], manager?: CharacterSheetManager): string {
  if (!manager) {
    return 'Error: Character sheet manager not available';
  }

  if (args.length < 2) {
    return 'Error: Usage: setCompetence <competence> <degreeCount>';
  }

  const competenceName = args[0].toUpperCase();
  const degreeCount = parseInt(args[1], 10);

  if (isNaN(degreeCount) || degreeCount < 0) {
    return 'Error: Degree count must be a non-negative number';
  }

  const competence = Object.values(Competence).find(
    (c) => c === competenceName || getCompetenceName(c).toUpperCase() === competenceName
  );

  if (!competence) {
    return `Error: Compétence '${competenceName}' not found`;
  }

  manager.setCompetenceDegree(competence, degreeCount);
  const level = manager.getCompetenceLevel(competence);

  return `Set ${getCompetenceName(competence)} to ${degreeCount} degree${degreeCount !== 1 ? 's' : ''} (Level ${level})`;
}

function handleReveal(args: string[], manager?: CharacterSheetManager): string {
  if (!manager) {
    return 'Error: Character sheet manager not available';
  }

  if (args.length < 1) {
    return 'Error: Usage: reveal <competence>';
  }

  const competenceName = args[0].toUpperCase();
  const competence = Object.values(Competence).find(
    (c) => c === competenceName || getCompetenceName(c).toUpperCase() === competenceName
  );

  if (!competence) {
    return `Error: Competence '${competenceName}' not found`;
  }

  manager.revealCompetence(competence);
  return `Revealed ${getCompetenceName(competence)} compétence`;
}

function handleGodMode(args: string[], godMode: boolean, setGodMode: (enabled: boolean) => void): string {
  if (args.length === 0) {
    // Toggle if no argument
    const newState = !godMode;
    setGodMode(newState);
    return `God mode ${newState ? 'ENABLED' : 'DISABLED'}. All CS fields are now ${newState ? 'editable' : 'locked'}.`;
  }
  
  const arg = args[0].toLowerCase();
  if (arg === 'on' || arg === '1' || arg === 'true' || arg === 'enable') {
    setGodMode(true);
    return 'God mode ENABLED. All CS fields are now editable.';
  } else if (arg === 'off' || arg === '0' || arg === 'false' || arg === 'disable') {
    setGodMode(false);
    return 'God mode DISABLED. CS fields are now locked.';
  } else {
    return 'Error: Usage: godmode [on|off]. Use without arguments to toggle.';
  }
}

function getHelpText(): string {
  return `Available commands:
  gainXP <competence> <amount> [eternal]  - Add marks to a compétence
  setAttribute <attribute> <value>       - Set attribute value (-50 to 50)
  addFreeMarks <amount>                    - Add free marks
  setCompetence <competence> <degreeCount> - Set compétence degree count
  reveal <competence>                      - Reveal a hidden compétence
  godmode [on|off]                         - Toggle God mode (enables editing all CS fields)
  help                                     - Show this help

Examples:
  gainXP ARME 5
  gainXP LUTTE 10 eternal
  setAttribute FOR 20
  addFreeMarks 50
  setCompetence VISION 5  - Set VISION compétence to 5 degrees
  reveal INVESTIGATION
  godmode on`;
}

