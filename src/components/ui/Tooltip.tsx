'use client';

import { ReactNode, useState } from 'react';

interface TooltipProps {
  children: ReactNode;
  content: string | ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

/**
 * Reusable tooltip component with dark red background and cream text
 * Used throughout the character sheet for attribute names and other hints
 */
export default function Tooltip({
  children,
  content,
  position = 'top',
  delay = 200,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (delay > 0) {
      const id = setTimeout(() => {
        setIsVisible(true);
      }, delay);
      setTimeoutId(id);
    } else {
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-50 px-3 py-2 bg-red-theme border-2 border-border-dark rounded font-medieval text-sm text-text-cream whitespace-nowrap pointer-events-none ${positionClasses[position]}`}
          style={{
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.4), inset 0 0 0 1px #ceb68d',
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}
