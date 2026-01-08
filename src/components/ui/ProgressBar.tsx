'use client';

interface ProgressBarProps {
  value: number;
  max?: number;
  height?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
  level?: number;
  isFull?: boolean; // When marks reach 100% (10 marks), show pulsing/shining effect
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
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const heightConfig = {
    sm: 'h-[0.8rem]', // 0.75rem * 1.1 (10% increase)
    md: 'h-[1.125rem]', // 4.5 (1.5 * 3)
    lg: 'h-6', // 6 (1.5 * 4)
  };

  // Turquoise-blue color from theme for pulsing when full (#517c78)
  const tealTheme = '#517c78';

  return (
    <div 
      className={`w-full ${heightConfig[height]} bg-parchment-dark border border-border-dark rounded overflow-hidden relative ${className} ${
        isFull ? 'progress-bar-container-pulse' : ''
      }`}
    >
      <div
        className={`h-full transition-all duration-300 relative bg-gradient-to-r from-red-theme to-yellow-theme`}
        style={{
          width: `${percentage}%`,
          boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.3)',
        }}
      >
        {label && percentage >= 30 && (
          <span 
            className="absolute inset-0 flex items-center justify-center text-[0.55rem] font-medieval font-semibold text-text-cream whitespace-nowrap pointer-events-none"
            style={{ 
              fontVariant: 'small-caps',
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
              textTransform: 'uppercase',
            }}
          >
            {label.toUpperCase()}
          </span>
        )}
      </div>
      {label && (
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
          {label.toUpperCase()}
        </span>
      )}
    </div>
  );
}


