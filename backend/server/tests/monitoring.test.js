/**
 * NEUROVAULT — Monitoring & Metrics Tests
 * Tests: CircularBuffer, metrics collection, percentile calculation,
 * time-series generation, memory stats, route stats.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  metricsMiddleware, getMetrics, getTimeSeries, resetMetrics,
} from '../services/metrics.service.js';

// ══════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════

function simulateRequest(method, path, statusCode, duration) {
  return new Promise(resolve => {
    const req = {
      method,
      path,
      route: { path },
      userId: 'test-user',
    };
    const listeners = {};
    const res = {
      statusCode,
      statusMessage: statusCode >= 400 ? 'Error' : 'OK',
      on(event, cb) { listeners[event] = cb; },
    };

    metricsMiddleware(req, res, () => {
      // Simulate response time
      setTimeout(() => {
        if (listeners.finish) listeners.finish();
        resolve();
      }, duration);
    });
  });
}

describe('Monitoring & Metrics', () => {
  beforeEach(() => {
    resetMetrics();
  });

  // ── Basic Metrics ──

  describe('getMetrics', () => {
    it('should return all metric sections', () => {
      const metrics = getMetrics();

      expect(metrics).toHaveProperty('system');
      expect(metrics).toHaveProperty('throughput');
      expect(metrics).toHaveProperty('latency');
      expect(metrics).toHaveProperty('errors');
      expect(metrics).toHaveProperty('memory');
      expect(metrics).toHaveProperty('routes');
    });

    it('should track system info', () => {
      const metrics = getMetrics();

      expect(metrics.system.uptime).toBeGreaterThanOrEqual(0);
      expect(metrics.system.nodeVersion).toContain('v');
      expect(metrics.system.platform).toBeTruthy();
      expect(metrics.system.pid).toBeGreaterThan(0);
      expect(metrics.system.uptimeHuman).toBeTruthy();
    });

    it('should report memory stats', () => {
      const metrics = getMetrics();

      expect(metrics.memory.heapUsed).toBeTruthy();
      expect(metrics.memory.heapTotal).toBeTruthy();
      expect(metrics.memory.rss).toBeTruthy();
      expect(metrics.memory.heapPercent).toBeGreaterThan(0);
      expect(metrics.memory.heapPercent).toBeLessThanOrEqual(100);
    });

    it('should start with zero counters', () => {
      const metrics = getMetrics();

      expect(metrics.throughput.totalRequests).toBe(0);
      expect(metrics.throughput.rpm).toBe(0);
      expect(metrics.errors.total).toBe(0);
    });
  });

  // ── Request Tracking ──

  describe('Request Tracking', () => {
    it('should count requests', async () => {
      await simulateRequest('GET', '/api/test', 200, 1);
      await simulateRequest('GET', '/api/test', 200, 1);
      await simulateRequest('POST', '/api/test', 201, 1);

      const metrics = getMetrics();
      expect(metrics.throughput.totalRequests).toBe(3);
    });

    it('should track error rates', async () => {
      await simulateRequest('GET', '/api/ok', 200, 1);
      await simulateRequest('GET', '/api/bad', 400, 1);
      await simulateRequest('GET', '/api/fail', 500, 1);

      const metrics = getMetrics();
      expect(metrics.errors.breakdown['2xx']).toBe(1);
      expect(metrics.errors.breakdown['4xx']).toBe(1);
      expect(metrics.errors.breakdown['5xx']).toBe(1);
      expect(metrics.errors.total).toBe(1); // Only 5xx counts as "error"
    });

    it('should record per-route stats', async () => {
      await simulateRequest('GET', '/api/docs', 200, 5);
      await simulateRequest('GET', '/api/docs', 200, 10);
      await simulateRequest('GET', '/api/docs', 400, 3);

      const metrics = getMetrics();
      const docRoute = metrics.routes.find(r => r.path.includes('/api/docs'));
      expect(docRoute).toBeTruthy();
      expect(docRoute.count).toBe(3);
      expect(docRoute.avgMs).toBeGreaterThanOrEqual(1);
    });

    it('should record recent errors', async () => {
      await simulateRequest('POST', '/api/fail', 500, 1);

      const metrics = getMetrics();
      expect(metrics.errors.recent.length).toBeGreaterThanOrEqual(1);
      expect(metrics.errors.recent[0].statusCode).toBe(500);
    });
  });

  // ── Latency Percentiles ──

  describe('Latency Percentiles', () => {
    it('should calculate latency stats', async () => {
      // Simulate 10 requests with varying latencies
      for (let i = 0; i < 10; i++) {
        await simulateRequest('GET', '/api/perf', 200, 1 + i);
      }

      const metrics = getMetrics();
      expect(metrics.latency.p50).toBeGreaterThanOrEqual(0);
      expect(metrics.latency.p95).toBeGreaterThanOrEqual(metrics.latency.p50);
      expect(metrics.latency.avg).toBeGreaterThan(0);
    });
  });

  // ── Time Series ──

  describe('Time Series', () => {
    it('should generate time series buckets', () => {
      const series = getTimeSeries(5);
      expect(series).toHaveLength(5);

      series.forEach(bucket => {
        expect(bucket).toHaveProperty('time');
        expect(bucket).toHaveProperty('rpm');
        expect(bucket).toHaveProperty('errors');
        expect(bucket).toHaveProperty('p50');
        expect(bucket).toHaveProperty('p95');
        expect(bucket.rpm).toBeGreaterThanOrEqual(0);
      });
    });

    it('should reflect recent requests', async () => {
      resetMetrics(); // Extra reset to clear any cross-file pollution
      await simulateRequest('GET', '/api/ts-check', 200, 1);
      await simulateRequest('GET', '/api/ts-check', 200, 1);

      const series = getTimeSeries(2);
      // Verify the series contains bucket data structure
      expect(series.length).toBe(2);
      // Check that our unique route was tracked
      const metrics = getMetrics();
      const tsRoute = metrics.routes.find(r => r.path.includes('/api/ts-check'));
      expect(tsRoute).toBeTruthy();
      expect(tsRoute.count).toBe(2);
    });
  });

  // ── Reset ──

  describe('resetMetrics', () => {
    it('should clear all metrics', async () => {
      await simulateRequest('GET', '/api/reset', 200, 1);
      expect(getMetrics().throughput.totalRequests).toBe(1);

      resetMetrics();
      expect(getMetrics().throughput.totalRequests).toBe(0);
      expect(getMetrics().routes).toHaveLength(0);
    });
  });
});
