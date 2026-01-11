'use client';

import { useEffect, useState } from 'react';
import { getEventLog, GameEvent, EventType } from '@/game/utils/EventLog';

interface EventLogProps {
  maxVisible?: number;
}

/**
 * Event Log Component
 * Displays recent game world events in the bottom left corner
 * Newest events at the bottom (most visible)
 * Events fade out after 10 seconds
 */
export default function EventLog({ maxVisible = 10 }: EventLogProps) {
  const [events, setEvents] = useState<GameEvent[]>([]);
  const eventLog = getEventLog();

  useEffect(() => {
    // Initial events
    const initialEvents = eventLog.getRecentEvents(maxVisible);
    setEvents(initialEvents);

    // Subscribe to new events
    const unsubscribe = eventLog.subscribe((event) => {
      setEvents((prev) => {
        const newEvents = [event, ...prev].slice(0, maxVisible);
        return newEvents;
      });
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxVisible]);

  // Force re-renders to update opacity smoothly, and remove events older than 11 seconds
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const updateInterval = setInterval(() => {
      const now = Date.now();
      const maxAge = 11000; // 10 seconds visible + 1 second fade = 11 seconds total

      // Force re-render to update opacity
      setTick((prev) => prev + 1);

      // Remove events older than 11 seconds
      setEvents((currentEvents) => {
        return currentEvents.filter((event) => {
          const age = now - event.timestamp;
          return age < maxAge;
        });
      });
    }, 100); // Update every 100ms for smooth fade animation

    return () => clearInterval(updateInterval);
  }, []);

  // Get color for event type
  const getEventColor = (type: EventType): string => {
    switch (type) {
      case EventType.SOUFFRANCE_DAMAGE:
        return 'text-red-400';
      case EventType.SOUFFRANCE_RESISTED:
        return 'text-yellow-400';
      case EventType.COMPETENCE_USE:
        return 'text-blue-400';
      case EventType.HEALTH_STATE_CHANGE:
        return 'text-orange-400';
      case EventType.EXPERIENCE_GAIN:
        return 'text-green-400';
      case EventType.WARNING:
        return 'text-orange-300';
      case EventType.INFO:
        return 'text-gray-300';
      default:
        return 'text-gray-400';
    }
  };

  // Get background color for event type
  const getEventBgColor = (type: EventType): string => {
    switch (type) {
      case EventType.SOUFFRANCE_DAMAGE:
        return 'bg-red-900/30 border-red-700/50';
      case EventType.SOUFFRANCE_RESISTED:
        return 'bg-yellow-900/30 border-yellow-700/50';
      case EventType.COMPETENCE_USE:
        return 'bg-blue-900/30 border-blue-700/50';
      case EventType.HEALTH_STATE_CHANGE:
        return 'bg-orange-900/30 border-orange-700/50';
      case EventType.EXPERIENCE_GAIN:
        return 'bg-green-900/30 border-green-700/50';
      case EventType.WARNING:
        return 'bg-orange-900/30 border-orange-600/50';
      case EventType.INFO:
        return 'bg-gray-900/30 border-gray-700/50';
      default:
        return 'bg-gray-900/30 border-gray-700/50';
    }
  };

  // Format timestamp to relative time
  const getTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 1000) return 'just now';
    if (diff < 5000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    return `${Math.floor(diff / 60000)}m ago`;
  };

  return (
    <div 
      className="fixed bottom-4 left-4 max-w-md pointer-events-none"
      style={{ 
        position: 'fixed',
        zIndex: 40, // Behind character sheet (z-50)
      }}
    >
      <div className="space-y-0.5">
        {events.length === 0 ? (
          <div
            className="px-2 py-1 text-xs text-gray-300 pointer-events-auto"
            style={{
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.9)',
            }}
          >
            <p className="leading-tight italic opacity-60">
              Event log ready...
            </p>
          </div>
        ) : (
          [...events].reverse().map((event, index) => {
            // Calculate opacity based on age and position
            const now = Date.now();
            const age = now - event.timestamp;
            const fadeOutStart = 10000; // Start fading at 10 seconds
            const fadeOutDuration = 1000; // Fade over 1 second
            const maxAge = fadeOutStart + fadeOutDuration; // Remove after 11 seconds

            // Position-based opacity (for multiple events: older at top are more faded)
            const maxIndex = events.length - 1;
            const positionOpacity = maxIndex > 0 
              ? 0.2 + (index / maxIndex) * 0.8 // Fade from 0.2 (top, oldest) to 1.0 (bottom, newest)
              : 1.0;

            // Age-based fade-out: fade from positionOpacity to 0 over the last second
            let opacity = positionOpacity;
            if (age >= fadeOutStart) {
              const fadeProgress = (age - fadeOutStart) / fadeOutDuration; // 0 to 1
              opacity = positionOpacity * (1 - fadeProgress); // Fade from positionOpacity to 0
            }
            
            return (
              <div
                key={event.id}
                className={`px-2 py-0.5 text-base transition-opacity duration-1000 ease-out ${getEventColor(event.type)} pointer-events-auto`}
                style={{
                  opacity: Math.max(0, opacity), // Ensure opacity doesn't go below 0
                  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.9)',
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="leading-tight text-sm">
                      {event.message}
                    </p>
                  </div>
                  <span className="text-xs opacity-50 whitespace-nowrap">
                    {getTimeAgo(event.timestamp)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

