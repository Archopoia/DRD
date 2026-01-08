'use client';

interface ProgressBarProps {
  value: number;
  max?: number;
  height?: 'sm' | 'md' | 'lg';
  className?: string;
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
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const heightConfig = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  return (
    <div className={`w-full ${heightConfig[height]} bg-parchment-dark border border-border-dark rounded overflow-hidden ${className}`}>
      <div
        className={`h-full bg-gradient-to-r from-red-theme to-yellow-theme transition-all duration-300`}
        style={{
          width: `${percentage}%`,
          boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.3)',
        }}
      />
    </div>
  );
}


