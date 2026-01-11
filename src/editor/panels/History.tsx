'use client';

import { useState, useEffect } from 'react';
import { HistoryManager, HistoryAction } from '../history/HistoryManager';

interface HistoryProps {
  historyManager: HistoryManager | null;
}

/**
 * History Panel - Shows undo/redo history with clickable timeline
 */
export default function History({ historyManager }: HistoryProps) {
  const [historyState, setHistoryState] = useState(historyManager?.getState() || { actions: [], currentIndex: -1, maxHistorySize: 100 });

  useEffect(() => {
    if (!historyManager) return;

    const unsubscribe = historyManager.subscribe((state) => {
      setHistoryState(state);
    });

    return unsubscribe;
  }, [historyManager]);

  if (!historyManager) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-800">
        <div className="text-gray-500 text-xs font-mono text-center py-8 px-4">
          History system not available
        </div>
      </div>
    );
  }

  const handleJumpToIndex = (index: number) => {
    historyManager.jumpToIndex(index);
  };

  const getActionIcon = (action: HistoryAction) => {
    switch (action.type) {
      case 'create_object':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        );
      case 'delete_object':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        );
      case 'transform_object':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          </svg>
        );
      case 'reparent_object':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
        );
      case 'property_change':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        );
      default:
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
            <circle cx="12" cy="12" r="10"/>
          </svg>
        );
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="h-full flex flex-col bg-gray-800">
      {/* Header */}
      <div className="p-2 border-b border-gray-700 flex-shrink-0 flex items-center justify-between">
        <div className="text-xs font-mono font-semibold text-gray-300">History</div>
        <div className="flex gap-1">
          <button
            onClick={() => historyManager.undo()}
            disabled={!historyManager.canUndo()}
            className="px-2 py-1 text-xs font-mono bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7v6h6"/>
              <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
            </svg>
          </button>
          <button
            onClick={() => historyManager.redo()}
            disabled={!historyManager.canRedo()}
            className="px-2 py-1 text-xs font-mono bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 7v6h-6"/>
              <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/>
            </svg>
          </button>
          <button
            onClick={() => historyManager.clear()}
            disabled={historyState.actions.length === 0}
            className="px-2 py-1 text-xs font-mono bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
            title="Clear History"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 min-h-0">
        {historyState.actions.length === 0 ? (
          <div className="text-gray-500 text-xs font-mono py-8 text-center">
            No history
            <br />
            <span className="text-gray-600 mt-2 block">
              Actions will appear here as you edit
            </span>
          </div>
        ) : (
          <div className="space-y-1">
            {historyState.actions.map((action, index) => {
              const isCurrent = index === historyState.currentIndex;
              const isPast = index < historyState.currentIndex;
              const isFuture = index > historyState.currentIndex;

              return (
                <button
                  key={action.id}
                  onClick={() => handleJumpToIndex(index)}
                  className={`w-full text-left p-2 rounded transition-all ${
                    isCurrent
                      ? 'bg-blue-600/30 border-l-2 border-blue-500 text-white'
                      : isPast
                      ? 'bg-gray-700/50 hover:bg-gray-700 text-gray-300'
                      : 'bg-gray-700/30 hover:bg-gray-700/50 text-gray-500'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 mt-0.5">
                      {getActionIcon(action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-mono font-semibold truncate">
                        {action.description}
                      </div>
                      <div className="text-xs font-mono text-gray-500 mt-0.5">
                        {formatTime(action.timestamp)}
                      </div>
                    </div>
                    {isCurrent && (
                      <div className="flex-shrink-0">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-blue-400">
                          <circle cx="12" cy="12" r="6"/>
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer - Info */}
      {historyState.actions.length > 0 && (
        <div className="p-2 border-t border-gray-700 flex-shrink-0 text-xs font-mono text-gray-500">
          {historyState.currentIndex + 1} / {historyState.actions.length} steps
        </div>
      )}
    </div>
  );
}

