import React, { useState, useRef, useCallback, useEffect } from 'react';

export interface ResizableSplitProps {
  left: React.ReactNode;
  right: React.ReactNode;
  className?: string;
  initialRatio?: number;
  minRatio?: number;
  maxRatio?: number;
  onResize?: (ratio: number) => void;
}

const STORAGE_KEY = 'adaPT_splitRatio';
const DEFAULT_RATIO = 0.60;
const MIN_RATIO = 0.20;
const MAX_RATIO = 0.80;

export const ResizableSplit: React.FC<ResizableSplitProps> = ({
  left,
  right,
  className = '',
  initialRatio = DEFAULT_RATIO,
  minRatio = MIN_RATIO,
  maxRatio = MAX_RATIO,
  onResize,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Initialize ratio from localStorage if available, clamped to [minRatio, maxRatio]
  const [ratio, setRatio] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        const parsed = parseFloat(stored);
        if (!isNaN(parsed) && parsed >= minRatio && parsed <= maxRatio) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Unable to read split ratio from localStorage', e);
    }
    return Math.min(Math.max(initialRatio, minRatio), maxRatio);
  });

  const ratioRef = useRef(ratio);
  ratioRef.current = ratio;

  // Persist ratio whenever dragging concludes or ratio updates
  const persistRatio = useCallback((newRatio: number) => {
    try {
      localStorage.setItem(STORAGE_KEY, newRatio.toFixed(4));
    } catch (e) {
      console.warn('Unable to persist split ratio to localStorage', e);
    }
  }, []);

  const updateRatio = useCallback(
    (newRatio: number) => {
      const clamped = Math.min(Math.max(newRatio, minRatio), maxRatio);
      setRatio(clamped);
      onResize?.(clamped);
      // Trigger a window resize event so embedded components (like Monaco) re-layout
      window.dispatchEvent(new Event('resize'));
      return clamped;
    },
    [minRatio, maxRatio, onResize]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const divider = e.currentTarget;
    divider.setPointerCapture(e.pointerId);
    setIsDragging(true);

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;
      const newRatio = (moveEvent.clientX - rect.left) / rect.width;
      updateRatio(newRatio);
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      divider.removeEventListener('pointermove', onPointerMove);
      divider.removeEventListener('pointerup', onPointerUp);
      divider.removeEventListener('pointercancel', onPointerUp);
      try {
        divider.releasePointerCapture(upEvent.pointerId);
      } catch {
        // Pointer might already have been released
      }
      setIsDragging(false);
      persistRatio(ratioRef.current);
    };

    divider.addEventListener('pointermove', onPointerMove);
    divider.addEventListener('pointerup', onPointerUp);
    divider.addEventListener('pointercancel', onPointerUp);
  };

  const handleDoubleClick = () => {
    const defaultClamped = Math.min(Math.max(DEFAULT_RATIO, minRatio), maxRatio);
    updateRatio(defaultClamped);
    persistRatio(defaultClamped);
  };

  // Keyboard accessibility for splitter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    let nextRatio: number | null = null;
    const step = 0.02;

    if (e.key === 'ArrowLeft') {
      nextRatio = ratio - step;
    } else if (e.key === 'ArrowRight') {
      nextRatio = ratio + step;
    } else if (e.key === 'Home') {
      nextRatio = minRatio;
    } else if (e.key === 'End') {
      nextRatio = maxRatio;
    }

    if (nextRatio !== null) {
      e.preventDefault();
      const clamped = updateRatio(nextRatio);
      persistRatio(clamped);
    }
  };

  // Ensure window resize recalculates children correctly
  useEffect(() => {
    const handleWindowResize = () => {
      onResize?.(ratioRef.current);
    };
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [onResize]);

  return (
    <div
      ref={containerRef}
      className={`flex flex-row w-full h-full relative overflow-hidden select-auto ${
        isDragging ? 'select-none cursor-col-resize' : ''
      } ${className}`}
    >
      {/* Left Pane (Editor + Info Panel) */}
      <div
        className="h-full flex flex-row overflow-hidden"
        style={{ width: `${ratio * 100}%`, minWidth: `${minRatio * 100}%` }}
      >
        {left}
      </div>

      {/* Draggable Divider */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={Math.round(ratio * 100)}
        aria-valuemin={Math.round(minRatio * 100)}
        aria-valuemax={Math.round(maxRatio * 100)}
        aria-label="Panel splitter"
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        className={`w-1.5 flex-shrink-0 cursor-col-resize flex items-center justify-center relative select-none z-10 transition-colors group focus:outline-none focus:ring-1 focus:ring-sky-500 ${
          isDragging ? 'bg-sky-500' : 'bg-gutter hover:bg-sky-500 active:bg-sky-600'
        }`}
        title="Arrastra para redimensionar (doble clic para restablecer al 60%)"
      >
        <div className="flex flex-col gap-1 items-center pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity">
          <div className="w-0.5 h-0.5 rounded-full bg-txt-muted" />
          <div className="w-0.5 h-0.5 rounded-full bg-txt-muted" />
          <div className="w-0.5 h-0.5 rounded-full bg-txt-muted" />
        </div>
      </div>

      {/* Right Pane (Console + Previews) */}
      <div
        className="h-full flex flex-col overflow-hidden"
        style={{ width: `${(1 - ratio) * 100}%`, minWidth: `${(1 - maxRatio) * 100}%` }}
      >
        {right}
      </div>
    </div>
  );
};

export default ResizableSplit;
