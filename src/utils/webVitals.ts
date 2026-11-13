/**
 * Real User Monitoring (RUM) y Métricas Web Core Vitals
 * Monitorea LCP, FID/INP, CLS, TTFB y FCP en dispositivos móviles y redes lentas
 */

export interface MetricReport {
  name: 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  navigationType?: string;
}

export function reportWebVitals(onReport?: (metric: MetricReport) => void) {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

  const logMetric = (metric: MetricReport) => {
    if (onReport) {
      onReport(metric);
    } else if (import.meta.env.DEV) {
      const color =
        metric.rating === 'good'
          ? '#10b981'
          : metric.rating === 'needs-improvement'
          ? '#f59e0b'
          : '#ef4444';
      console.log(
        `%c[Web Vitals] ${metric.name}: ${metric.value.toFixed(1)}ms (${metric.rating})`,
        `color: ${color}; font-weight: bold;`
      );
    }
  };

  try {
    // 1. Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        const val = lastEntry.startTime;
        logMetric({
          name: 'LCP',
          value: val,
          rating: val <= 2500 ? 'good' : val <= 4000 ? 'needs-improvement' : 'poor',
        });
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

    // 2. Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries() as any[]) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      logMetric({
        name: 'CLS',
        value: clsValue,
        rating: clsValue <= 0.1 ? 'good' : clsValue <= 0.25 ? 'needs-improvement' : 'poor',
      });
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });

    // 3. Time to First Byte (TTFB)
    const navEntries = performance.getEntriesByType('navigation');
    if (navEntries.length > 0) {
      const nav = navEntries[0] as PerformanceNavigationTiming;
      const ttfb = nav.responseStart - nav.requestStart;
      logMetric({
        name: 'TTFB',
        value: ttfb,
        rating: ttfb <= 800 ? 'good' : ttfb <= 1800 ? 'needs-improvement' : 'poor',
      });
    }
  } catch (err) {
    // Los navegadores sin soporte completo de PerformanceObserver continuarán normalmente
  }
}
