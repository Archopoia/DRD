'use client';

import { ReactNode, useRef, useEffect, useState } from 'react';

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
 * Reusable expandable section component with smooth animations
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
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);
  const indicatorChar = indicator === 'arrow' 
    ? (isExpanded ? '▼' : '▶')
    : (isExpanded ? '▼' : '▶');

  // Measure content height from hidden element
  useEffect(() => {
    if (contentRef.current) {
      const height = contentRef.current.scrollHeight;
      if (height > 0) {
        setContentHeight(height);
      }
    }
  }, [children, isExpanded]);

  return (
    <div className={className}>
      <div className={`flex items-center gap-2 ${headerClassName}`}>
        <button
          onClick={onToggle}
          className="flex-1 text-left font-medieval font-semibold text-text-dark transition-colors duration-300 hover:text-red-theme"
        >
          <span className="flex items-center gap-1">
            <span 
              className="inline-block transition-transform duration-300"
              style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
            >
              ▼
            </span>
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
      
      {/* Hidden content for measurement */}
      <div
        ref={contentRef}
        className={`${contentClassName} invisible absolute`}
        style={{ height: 'auto', visibility: 'hidden', position: 'absolute', top: '-9999px' }}
        aria-hidden="true"
      >
        {children}
      </div>
      
      {/* Animated content container */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isExpanded && contentHeight > 0 ? `${contentHeight}px` : '0px',
          opacity: isExpanded ? 1 : 0,
          transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out',
        }}
      >
        <div 
          className={contentClassName}
          style={{
            transform: isExpanded ? 'translateY(0)' : 'translateY(-10px)',
            transition: 'transform 0.3s ease-in-out',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

