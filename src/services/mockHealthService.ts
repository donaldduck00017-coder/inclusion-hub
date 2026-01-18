import { config } from '@/lib/config';
import healthMetricsData from '@/data/health-metrics.json';
import { mockTelemetryService } from './mockTelemetryService';
import { getDeprecationNotice } from './api-contract';
import type { HealthMetrics, ServiceStatus, TelemetryHealth, ApiHealth, FeatureHealth } from '@/types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Simulated latency for service checks
const simulateLatency = (): number => {
  return Math.floor(Math.random() * 100) + 20; // 20-120ms
};

// Simulate service status with occasional degradation
const simulateServiceStatus = (baseStatus: ServiceStatus): ServiceStatus => {
  const random = Math.random();
  let status = baseStatus.status;
  
  // 2% chance of degradation, 0.5% chance of down
  if (random < 0.005) {
    status = 'down';
  } else if (random < 0.02) {
    status = 'degraded';
  }

  return {
    ...baseStatus,
    status,
    latency: simulateLatency(),
    lastCheck: Date.now(),
  };
};

export const mockHealthService = {
  // Get overall system health
  async getHealth(): Promise<HealthMetrics> {
    await delay(config.mockDelay);

    const [services, telemetry, api, features] = await Promise.all([
      this.getServiceStatus(),
      this.getTelemetryHealth(),
      this.getApiHealth(),
      this.getFeatureHealth(),
    ]);

    // Calculate overall status
    const hasDown = services.some((s) => s.status === 'down');
    const hasDegraded = services.some((s) => s.status === 'degraded');

    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (hasDown) {
      status = 'critical';
    } else if (hasDegraded) {
      status = 'degraded';
    }

    return {
      status,
      timestamp: Date.now(),
      services,
      telemetry,
      api,
      features,
    };
  },

  // Get individual service statuses
  async getServiceStatus(): Promise<ServiceStatus[]> {
    await delay(config.mockDelay / 2);

    const baseServices = healthMetricsData.services as ServiceStatus[];
    return baseServices.map(simulateServiceStatus);
  },

  // Get telemetry pipeline health
  async getTelemetryHealth(): Promise<TelemetryHealth> {
    await delay(config.mockDelay / 2);

    const queueStatus = mockTelemetryService.getQueueStatus();

    return {
      queueSize: queueStatus.queueSize,
      queueCapacity: queueStatus.queueCapacity,
      eventsProcessed24h: healthMetricsData.telemetry.eventsProcessed24h + Math.floor(Math.random() * 100),
      failedFlushes: queueStatus.failedFlushes,
      lastFlush: queueStatus.lastFlushTime,
      dataMinimizationActive: config.dataMinimization.enabled,
    };
  },

  // Get API performance metrics
  async getApiHealth(): Promise<ApiHealth> {
    await delay(config.mockDelay / 2);

    const deprecationNotice = getDeprecationNotice(config.apiVersion);
    const deprecationWarnings = deprecationNotice ? [deprecationNotice] : [];

    // Add some variance to metrics
    const variance = () => Math.floor(Math.random() * 20) - 10;

    return {
      version: config.apiVersion,
      latencyP50: Math.max(10, healthMetricsData.api.latencyP50 + variance()),
      latencyP95: Math.max(50, healthMetricsData.api.latencyP95 + variance()),
      latencyP99: Math.max(100, healthMetricsData.api.latencyP99 + variance()),
      requestRate: healthMetricsData.api.requestRate + Math.floor(Math.random() * 20),
      errorRate: Math.max(0, healthMetricsData.api.errorRate + (Math.random() * 0.1 - 0.05)),
      deprecationWarnings,
    };
  },

  // Get feature health (flags and kill switches)
  async getFeatureHealth(): Promise<FeatureHealth> {
    await delay(config.mockDelay / 2);

    // Get active feature flags based on config
    const activeFlags = {
      aiTutor: config.features.aiTutor && !config.killSwitches.disableAiTutor,
      advancedChallenges: true,
      socDashboard: true,
      auditMode: config.features.auditMode,
      telemetryExport: config.features.telemetry,
      customChallenges: false,
      healthPanel: true,
    };

    // Convert kill switches to array format
    const killSwitches = Object.entries(config.killSwitches)
      .filter(([, enabled]) => enabled)
      .map(([id]) => ({
        id,
        name: id.replace(/([A-Z])/g, ' $1').trim(),
        enabled: true,
      }));

    return {
      activeFlags,
      killSwitches,
      flagOverrides: killSwitches.length,
    };
  },

  // Ping a specific service (for health checks)
  async pingService(serviceName: string): Promise<{ status: 'up' | 'down'; latency: number }> {
    await delay(config.mockDelay / 4);

    const latency = simulateLatency();
    const isUp = Math.random() > 0.01; // 99% uptime

    return {
      status: isUp ? 'up' : 'down',
      latency,
    };
  },
};

export type MockHealthService = typeof mockHealthService;
