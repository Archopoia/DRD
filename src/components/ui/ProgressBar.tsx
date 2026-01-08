'use client';

import { useState, useEffect } from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  height?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
  level?: number;
  isFull?: boolean; // When marks reach 100% (10 marks), show pulsing/shining effect
  onClick?: () => void; // Click handler for realization
  showRealizeLabel?: boolean; // Show "RÉALISER" instead of level name when full
}

/**
 * Reusable progress bar component for marks display
 * Used for Souffrances and Competences marks
 */
export default function ProgressBar({
  value,
  max = 100,
  height = 'md',
  className = '',
  label,
  level,
  isFull = false, // When marks reach 100% (10 marks), show pulsing/shining effect
  onClick,
  showRealizeLabel = false, // Show "RÉALISER" instead of level name when full
}: ProgressBarProps) {
  const [isRealizing, setIsRealizing] = useState(false);
  const percentage = Math.min((value / max) * 100, 100);
  
  // Reset realizing state when value changes (after realization clears marks)
  useEffect(() => {
    if (!isFull && isRealizing) {
      setIsRealizing(false);
    }
  }, [value, isFull, isRealizing]);
  
  // Determine the label to show
  const displayLabel = showRealizeLabel && isFull ? 'RÉALISER' : (label || '');
  const isClickable = isFull && onClick;

  const heightConfig = {
    sm: 'h-[0.8rem]', // 0.75rem * 1.1 (10% increase)
    md: 'h-[1.125rem]', // 4.5 (1.5 * 3)
    lg: 'h-6', // 6 (1.5 * 4)
  };

  // Handle click - animate color change then call onClick
  const handleClick = (e: React.MouseEvent) => {
    if (!isClickable || !onClick) return;
    
    e.stopPropagation();
    setIsRealizing(true);
    
    // Call the onClick handler after a brief delay to show the animation
    setTimeout(() => {
      onClick();
      // Reset the animation state after the realization completes
      setTimeout(() => {
        setIsRealizing(false);
      }, 300);
    }, 200);
  };

  // Determine fill color - only change to bluish-white when clicked
  const fillColor = isRealizing
    ? 'bg-gradient-to-r from-blue-300 via-blue-200 to-blue-100' // Bluish-white when clicked
    : 'bg-gradient-to-r from-red-theme to-yellow-theme'; // Normal gradient

  return (
    <div 
      className={`w-full ${heightConfig[height]} bg-parchment-dark border border-border-dark rounded relative ${className} ${
        isFull ? 'progress-bar-container-pulse' : 'overflow-hidden'
      } ${isClickable ? 'cursor-pointer' : ''}`}
      style={isFull ? { overflow: 'visible', position: 'relative', zIndex: 1 } : {}}
      onClick={handleClick}
    >
      <div
        className={`h-full transition-all duration-200 relative ${fillColor} ${
          isFull ? 'progress-bar-fill-pulse' : ''
        }`}
        style={{
          width: `${percentage}%`,
          boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.3)',
        }}
      >
        {displayLabel && percentage >= 30 && (
          <span 
            className="absolute inset-0 flex items-center justify-center text-[0.55rem] font-medieval font-semibold text-text-cream whitespace-nowrap pointer-events-none"
            style={{ 
              fontVariant: 'small-caps',
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
              textTransform: 'uppercase',
            }}
          >
            {displayLabel}
          </span>
        )}
      </div>
      {displayLabel && (
        <span 
          className={`absolute inset-0 flex items-center justify-center text-[0.55rem] font-medieval font-semibold whitespace-nowrap pointer-events-none ${
            percentage >= 30 ? 'opacity-0' : 'text-text-dark'
          }`}
          style={{ 
            fontVariant: 'small-caps',
            textShadow: percentage >= 30 ? 'none' : '1px 1px 2px rgba(255, 255, 255, 0.5)',
            textTransform: 'uppercase',
          }}
        >
          {displayLabel}
        </span>
      )}
    </div>
  );
}


