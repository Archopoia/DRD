'use client';

import { useEffect, useState } from 'react';
import { Competence, getCompetenceName, getCompetenceAptitude, getCompetenceEmoji } from '@/game/character/data/CompetenceData';
import { Aptitude } from '@/game/character/data/AptitudeData';

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

  // Get dark, desaturated, subtle background color for each aptitude
  const getAptitudeBackgroundColor = (aptitude: Aptitude): string => {
    // Dark, desaturated, subtle colors for each of the 8 aptitudes
    const colors: Record<Aptitude, string> = {
      [Aptitude.PUISSANCE]: 'rgba(120, 40, 40, 0.4)',      // Dark reddish-brown
      [Aptitude.AISANCE]: 'rgba(80, 100, 120, 0.4)',       // Dark blue-gray
      [Aptitude.PRECISION]: 'rgba(100, 100, 80, 0.4)',     // Dark olive-gray
      [Aptitude.ATHLETISME]: 'rgba(60, 120, 80, 0.4)',     // Dark green-gray
      [Aptitude.CHARISME]: 'rgba(120, 80, 120, 0.4)',      // Dark purple-gray
      [Aptitude.DETECTION]: 'rgba(80, 120, 100, 0.4)',     // Dark teal-gray
      [Aptitude.REFLEXION]: 'rgba(100, 100, 120, 0.4)',    // Dark indigo-gray
      [Aptitude.DOMINATION]: 'rgba(80, 60, 100, 0.4)',     // Dark violet-gray
    };
    return colors[aptitude] || 'rgba(80, 80, 80, 0.4)';
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
          const competenceEmoji = getCompetenceEmoji(item.competence);
          const timeColor = getTimeColor(item.remainingTime, timeframeMs);
          const aptitude = getCompetenceAptitude(item.competence);
          const aptitudeBgColor = getAptitudeBackgroundColor(aptitude);
          
          return (
            <div
              key={item.competence}
              className={`px-3 py-1.5 border border-gray-700/50 rounded transition-all duration-100 pointer-events-auto ${timeColor}`}
              style={{
                backgroundColor: aptitudeBgColor,
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.9)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {competenceEmoji && (
                    <span className="text-base" style={{ filter: 'drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.9))' }}>
                      {competenceEmoji}
                    </span>
                  )}
                  <span className="text-sm font-medium">{competenceName}</span>
                </div>
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

