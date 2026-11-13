import { useState, useEffect, useMemo, RefObject } from 'react';

export interface VirtualListOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

/**
 * Hook de virtualización para listas largas (1.000+ elementos)
 * Renderiza exclusivamente los elementos visibles dentro del viewport más un buffer de overscan
 */
export function useVirtualList<T>(
  items: T[],
  containerRef: RefObject<HTMLElement | null>,
  options: VirtualListOptions
) {
  const { itemHeight, containerHeight, overscan = 4 } = options;
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollTop(el.scrollTop);
          ticking = false;
        });
        ticking = true;
      }
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [containerRef]);

  return useMemo(() => {
    const totalCount = items.length;
    const totalHeight = totalCount * itemHeight;

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 2 * overscan;
    const endIndex = Math.min(totalCount, startIndex + visibleCount);

    const virtualItems = items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
      offsetTop: (startIndex + index) * itemHeight,
    }));

    return {
      virtualItems,
      totalHeight,
      startIndex,
      endIndex,
    };
  }, [items, scrollTop, itemHeight, containerHeight, overscan]);
}
