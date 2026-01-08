'use client';

import { ReactNode, useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
  maxWidth?: string;
}

/**
 * Reusable stylized tooltip component with dark red fill
 * Matches the medieval game aesthetic
 */
export default function Tooltip({
  content,
  children,
  position = 'top',
  delay = 300,
  className = '',
  maxWidth = '300px',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const scrollY = window.scrollY || window.pageYOffset;
    const scrollX = window.scrollX || window.pageXOffset;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = triggerRect.top + scrollY - tooltipRect.height - 8;
        left = triggerRect.left + scrollX + triggerRect.width / 2 - tooltipRect.width / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + scrollY + 8;
        left = triggerRect.left + scrollX + triggerRect.width / 2 - tooltipRect.width / 2;
        break;
      case 'left':
        top = triggerRect.top + scrollY + triggerRect.height / 2 - tooltipRect.height / 2;
        left = triggerRect.left + scrollX - tooltipRect.width - 8;
        break;
      case 'right':
        top = triggerRect.top + scrollY + triggerRect.height / 2 - tooltipRect.height / 2;
        left = triggerRect.right + scrollX + 8;
        break;
    }

    // Keep tooltip within viewport
    const padding = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < padding) left = padding;
    if (left + tooltipRect.width > viewportWidth - padding) {
      left = viewportWidth - tooltipRect.width - padding;
    }
    if (top < padding) top = padding;
    if (top + tooltipRect.height > viewportHeight - padding) {
      top = viewportHeight - tooltipRect.height - padding;
    }

    setTooltipPosition({ top, left });
  };

  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      // Calculate position after a brief delay to ensure tooltip is rendered
      setTimeout(() => {
        calculatePosition();
      }, 10);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible) {
      calculatePosition();
      const handleScroll = () => calculatePosition();
      const handleResize = () => calculatePosition();
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isVisible]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getArrowStyles = () => {
    const arrowSize = 8;
    const borderWidth = 2;
    
    switch (position) {
      case 'top':
        return {
          bottom: `-${arrowSize}px`,
          left: '50%',
          transform: 'translateX(-50%)',
          borderLeft: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize}px solid transparent`,
          borderTop: `${arrowSize}px solid #643030`,
        };
      case 'bottom':
        return {
          top: `-${arrowSize}px`,
          left: '50%',
          transform: 'translateX(-50%)',
          borderLeft: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid #643030`,
        };
      case 'left':
        return {
          right: `-${arrowSize}px`,
          top: '50%',
          transform: 'translateY(-50%)',
          borderTop: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid transparent`,
          borderLeft: `${arrowSize}px solid #643030`,
        };
      case 'right':
        return {
          left: `-${arrowSize}px`,
          top: '50%',
          transform: 'translateY(-50%)',
          borderTop: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize}px solid #643030`,
        };
    }
  };

  const getArrowBorderStyles = () => {
    const arrowSize = 8;
    const borderWidth = 1;
    
    switch (position) {
      case 'top':
        return {
          bottom: `-${arrowSize + borderWidth}px`,
          left: '50%',
          transform: 'translateX(-50%)',
          borderLeft: `${arrowSize + borderWidth}px solid transparent`,
          borderRight: `${arrowSize + borderWidth}px solid transparent`,
          borderTop: `${arrowSize + borderWidth}px solid #674B1B`,
        };
      case 'bottom':
        return {
          top: `-${arrowSize + borderWidth}px`,
          left: '50%',
          transform: 'translateX(-50%)',
          borderLeft: `${arrowSize + borderWidth}px solid transparent`,
          borderRight: `${arrowSize + borderWidth}px solid transparent`,
          borderBottom: `${arrowSize + borderWidth}px solid #674B1B`,
        };
      case 'left':
        return {
          right: `-${arrowSize + borderWidth}px`,
          top: '50%',
          transform: 'translateY(-50%)',
          borderTop: `${arrowSize + borderWidth}px solid transparent`,
          borderBottom: `${arrowSize + borderWidth}px solid transparent`,
          borderLeft: `${arrowSize + borderWidth}px solid #674B1B`,
        };
      case 'right':
        return {
          left: `-${arrowSize + borderWidth}px`,
          top: '50%',
          transform: 'translateY(-50%)',
          borderTop: `${arrowSize + borderWidth}px solid transparent`,
          borderBottom: `${arrowSize + borderWidth}px solid transparent`,
          borderRight: `${arrowSize + borderWidth}px solid #674B1B`,
        };
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className={`inline-block ${className}`}
      >
        {children}
      </div>
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-[10001] pointer-events-none animate-fade-in"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            maxWidth,
          }}
        >
          {/* Arrow border (outer) */}
          <div
            className="absolute w-0 h-0"
            style={getArrowBorderStyles()}
          />
          
          {/* Main tooltip */}
          <div
            className="bg-red-theme text-text-cream border-2 border-border-dark rounded px-3 py-2 font-medieval text-sm shadow-2xl relative"
            style={{
              boxShadow: '0 0 0 1px #643030, 0 0 0 2px #ffebc6, 0 4px 12px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 235, 198, 0.2)',
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Subtle texture overlay */}
            <div
              className="absolute inset-0 rounded pointer-events-none opacity-10"
              style={{
                background: `repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 2px,
                  rgba(255, 255, 255, 0.1) 2px,
                  rgba(255, 255, 255, 0.1) 4px
                )`,
              }}
            />
            
            {/* Content */}
            <div className="relative z-10">
              {typeof content === 'string' ? (
                <p className="leading-relaxed">{content}</p>
              ) : (
                content
              )}
            </div>
            
            {/* Arrow (inner) */}
            <div
              className="absolute w-0 h-0"
              style={getArrowStyles()}
            />
          </div>
        </div>
      )}
    </>
  );
}

