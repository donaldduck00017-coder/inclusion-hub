import { create } from 'zustand';
import type { HealthMetrics, ServiceStatus, HealthStatus } from '@/types';

interface HealthState {
  // Health data
  health: HealthMetrics | null;
  
  // Individual service statuses (for quick access)
  serviceStatuses: Map<string, ServiceStatus>;
  
  // Overall status
  overallStatus: HealthStatus;
  
  // Loading/refresh state
  isLoading: boolean;
  lastRefresh: number | null;
  autoRefreshInterval: number; // in ms
  
  // Actions
  setHealth: (health: HealthMetrics) => void;
  setLoading: (loading: boolean) => void;
  updateServiceStatus: (name: string, status: ServiceStatus) => void;
  calculateOverallStatus: () => HealthStatus;
  reset: () => void;
}

export const useHealthStore = create<HealthState>((set, get) => ({
  health: null,
  serviceStatuses: new Map(),
  overallStatus: 'healthy',
  isLoading: false,
  lastRefresh: null,
  autoRefreshInterval: 30000, // 30 seconds

  // Set full health data
  setHealth: (health) => {
    const serviceMap = new Map<string, ServiceStatus>();
    health.services.forEach((s) => serviceMap.set(s.name, s));

    set({
      health,
      serviceStatuses: serviceMap,
      overallStatus: health.status,
      lastRefresh: Date.now(),
    });
  },

  // Set loading state
  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  // Update individual service status
  updateServiceStatus: (name, status) => {
    const state = get();
    const newStatuses = new Map(state.serviceStatuses);
    newStatuses.set(name, status);

    set({ serviceStatuses: newStatuses });

    // Recalculate overall status
    const newOverallStatus = get().calculateOverallStatus();
    set({ overallStatus: newOverallStatus });
  },

  // Calculate overall status from service statuses
  calculateOverallStatus: () => {
    const state = get();
    const statuses = Array.from(state.serviceStatuses.values());

    if (statuses.length === 0) {
      return 'healthy';
    }

    const hasDown = statuses.some((s) => s.status === 'down');
    const hasDegraded = statuses.some((s) => s.status === 'degraded');

    if (hasDown) {
      return 'critical';
    }
    if (hasDegraded) {
      return 'degraded';
    }
    return 'healthy';
  },

  // Reset store
  reset: () => {
    set({
      health: null,
      serviceStatuses: new Map(),
      overallStatus: 'healthy',
      isLoading: false,
      lastRefresh: null,
    });
  },
}));
