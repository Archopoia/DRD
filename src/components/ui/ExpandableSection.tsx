'use client';

import { ReactNode } from 'react';

interface ExpandableSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  title: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  indicator?: 'arrow' | 'chevron';
  headerActions?: ReactNode; // Actions rendered outside the button (e.g., inputs, buttons)
  headerFooter?: ReactNode; // Content rendered right after header (e.g., progress bars)
}

/**
 * Reusable expandable section component
 * Used for Actions and Competences
 */
export default function ExpandableSection({
  isExpanded,
  onToggle,
  title,
  children,
  className = '',
  headerClassName = '',
  contentClassName = '',
  indicator = 'arrow',
  headerActions,
  headerFooter,
}: ExpandableSectionProps) {
  const indicatorChar = indicator === 'arrow' 
    ? (isExpanded ? '▼' : '▶')
    : (isExpanded ? '▼' : '▶');

  return (
    <div className={className}>
      <div className={`flex items-center gap-2 ${headerClassName}`}>
        <button
          onClick={onToggle}
          className="flex-1 text-left font-medieval font-semibold text-text-dark transition-colors duration-300 hover:text-red-theme"
        >
          <span className="flex items-center gap-1">
            <span>{indicatorChar}</span>
            {title}
          </span>
        </button>
        {headerActions && (
          <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
            {headerActions}
          </div>
        )}
      </div>
      
      {/* Header footer - always visible, rendered right after header */}
      {headerFooter && (
        <div className="mt-1">
          {headerFooter}
        </div>
      )}
      
      {isExpanded && (
        <div className={contentClassName}>
          {children}
        </div>
      )}
    </div>
  );
}

