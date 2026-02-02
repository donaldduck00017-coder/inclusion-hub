/**
 * Metrics Collection
 * 
 * Collects and exposes platform metrics for monitoring.
 * In production, these would be exported to a metrics service.
 */

// ============= Metric Types =============

interface Counter {
  name: string;
  value: number;
  labels: Record<string, string>;
}

interface Gauge {
  name: string;
  value: number;
  labels: Record<string, string>;
}

interface Histogram {
  name: string;
  buckets: number[];
  counts: number[];
  sum: number;
  count: number;
  labels: Record<string, string>;
}

// ============= Storage =============

const counters = new Map<string, Counter>();
const gauges = new Map<string, Gauge>();
const histograms = new Map<string, Histogram>();

function getMetricKey(name: string, labels: Record<string, string>): string {
  const labelStr = Object.entries(labels)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join(',');
  return `${name}{${labelStr}}`;
}

// ============= Counter Operations =============

/**
 * Increment a counter
 */
export function incrementCounter(
  name: string,
  labels: Record<string, string> = {},
  amount = 1
): void {
  const key = getMetricKey(name, labels);
  const existing = counters.get(key);
  
  if (existing) {
    existing.value += amount;
  } else {
    counters.set(key, { name, value: amount, labels });
  }
}

/**
 * Get counter value
 */
export function getCounter(
  name: string,
  labels: Record<string, string> = {}
): number {
  const key = getMetricKey(name, labels);
  return counters.get(key)?.value || 0;
}

// ============= Gauge Operations =============

/**
 * Set a gauge value
 */
export function setGauge(
  name: string,
  value: number,
  labels: Record<string, string> = {}
): void {
  const key = getMetricKey(name, labels);
  gauges.set(key, { name, value, labels });
}

/**
 * Get gauge value
 */
export function getGauge(
  name: string,
  labels: Record<string, string> = {}
): number {
  const key = getMetricKey(name, labels);
  return gauges.get(key)?.value || 0;
}

// ============= Histogram Operations =============

const DEFAULT_BUCKETS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

/**
 * Record a histogram observation
 */
export function observeHistogram(
  name: string,
  value: number,
  labels: Record<string, string> = {},
  buckets = DEFAULT_BUCKETS
): void {
  const key = getMetricKey(name, labels);
  let histogram = histograms.get(key);
  
  if (!histogram) {
    histogram = {
      name,
      buckets,
      counts: new Array(buckets.length).fill(0),
      sum: 0,
      count: 0,
      labels,
    };
    histograms.set(key, histogram);
  }
  
  // Update counts
  histogram.sum += value;
  histogram.count++;
  
  for (let i = 0; i < histogram.buckets.length; i++) {
    if (value <= histogram.buckets[i]) {
      histogram.counts[i]++;
    }
  }
}

/**
 * Get histogram stats
 */
export function getHistogramStats(
  name: string,
  labels: Record<string, string> = {}
): { avg: number; count: number; p50: number; p95: number; p99: number } | null {
  const key = getMetricKey(name, labels);
  const histogram = histograms.get(key);
  
  if (!histogram || histogram.count === 0) {
    return null;
  }
  
  const avg = histogram.sum / histogram.count;
  
  // Approximate percentiles from buckets
  const p50Index = findPercentileIndex(histogram, 50);
  const p95Index = findPercentileIndex(histogram, 95);
  const p99Index = findPercentileIndex(histogram, 99);
  
  return {
    avg,
    count: histogram.count,
    p50: histogram.buckets[p50Index] || avg,
    p95: histogram.buckets[p95Index] || avg,
    p99: histogram.buckets[p99Index] || avg,
  };
}

function findPercentileIndex(histogram: Histogram, percentile: number): number {
  const threshold = (percentile / 100) * histogram.count;
  let cumulative = 0;
  
  for (let i = 0; i < histogram.counts.length; i++) {
    cumulative += histogram.counts[i];
    if (cumulative >= threshold) {
      return i;
    }
  }
  
  return histogram.buckets.length - 1;
}

// ============= Export All Metrics =============

/**
 * Get all metrics in a structured format
 */
export function getAllMetrics(): {
  counters: Counter[];
  gauges: Gauge[];
  histograms: Array<Histogram & { avg: number }>;
} {
  return {
    counters: Array.from(counters.values()),
    gauges: Array.from(gauges.values()),
    histograms: Array.from(histograms.values()).map(h => ({
      ...h,
      avg: h.count > 0 ? h.sum / h.count : 0,
    })),
  };
}

/**
 * Clear all metrics (for testing)
 */
export function clearMetrics(): void {
  counters.clear();
  gauges.clear();
  histograms.clear();
}
