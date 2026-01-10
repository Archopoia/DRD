'use client';

import { useEffect, useState } from 'react';
import { Competence, getCompetenceName } from '@/game/character/data/CompetenceData';

interface ActiveCT {
  competence: Competence;
  remainingTime: number; // in milliseconds
}

interface ActiveCompetencesDisplayProps {
  activeCompetencesWithTime: Array<{ competence: Competence; remainingTime: number }>;
}

/**
 * Active Competences Display Component
 * Shows currently active CTs with their remaining time
 * Only visible in god mode, positioned in bottom right
 */
export default function ActiveCompetencesDisplay({ activeCompetencesWithTime }: ActiveCompetencesDisplayProps) {
  // Format remaining time as seconds with 1 decimal place
  const formatTime = (ms: number): string => {
    const seconds = ms / 1000;
    return seconds.toFixed(1);
  };

  // Get color based on remaining time (green -> yellow -> red as time runs out)
  const getTimeColor = (remainingMs: number, totalMs: number): string => {
    const percentage = remainingMs / totalMs;
    if (percentage > 0.6) return 'text-green-400';
    if (percentage > 0.3) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Don't render if no active competences
  if (activeCompetencesWithTime.length === 0) {
    return null;
  }

  // Assume 2000ms timeframe (can be made dynamic later)
  const timeframeMs = 2000;

  return (
    <div
      className="fixed bottom-4 right-4 max-w-xs pointer-events-none"
      style={{
        position: 'fixed',
        zIndex: 40, // Behind character sheet (z-50) but above event log
      }}
    >
      <div className="space-y-1">
        {activeCompetencesWithTime.map((item) => {
          const competenceName = getCompetenceName(item.competence);
          const timeColor = getTimeColor(item.remainingTime, timeframeMs);
          
          return (
            <div
              key={item.competence}
              className={`px-3 py-1.5 bg-gray-900/90 border border-gray-700/50 rounded transition-all duration-100 pointer-events-auto ${timeColor}`}
              style={{
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.9)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{competenceName}</span>
                <span className={`text-xs font-mono ${timeColor}`}>
                  {formatTime(item.remainingTime)}s
                </span>
              </div>
              {/* Progress bar showing remaining time */}
              <div className="mt-1 h-0.5 bg-gray-800/50 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-100 ${
                    item.remainingTime / timeframeMs > 0.6
                      ? 'bg-green-400'
                      : item.remainingTime / timeframeMs > 0.3
                      ? 'bg-yellow-400'
                      : 'bg-red-400'
                  }`}
                  style={{
                    width: `${(item.remainingTime / timeframeMs) * 100}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

