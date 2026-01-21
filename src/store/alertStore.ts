/**
 * Alert Store
 * 
 * Manages SOC alerts and analyst notes.
 * Acts as the central state for the SOC Dashboard.
 */

import { create } from 'zustand';
import type { SOCAlert, AlertStatus, AlertSeverity, AnalystNote, UserRole } from '@/types';

interface AlertFilters {
  severity?: AlertSeverity[];
  category?: string[];
  status?: AlertStatus[];
  challengeId?: string;
  userId?: string;
  timeRange?: { start: number; end: number };
}

interface AlertStats {
  total: number;
  bySeverity: Record<AlertSeverity, number>;
  byStatus: Record<AlertStatus, number>;
  newLast24h: number;
  criticalUnresolved: number;
}

interface AlertState {
  // Alerts
  alerts: SOCAlert[];
  selectedAlertId: string | null;
  
  // Notes
  notes: Map<string, AnalystNote[]>;
  
  // Filters
  filters: AlertFilters;
  
  // Stats
  stats: AlertStats;
  
  // Loading
  isLoading: boolean;
  
  // Actions
  addAlert: (alert: SOCAlert) => void;
  addAlerts: (alerts: SOCAlert[]) => void;
  updateAlertStatus: (alertId: string, status: AlertStatus) => void;
  selectAlert: (alertId: string | null) => void;
  addNote: (alertId: string, note: Omit<AnalystNote, 'id' | 'alertId' | 'createdAt'>) => void;
  setFilters: (filters: Partial<AlertFilters>) => void;
  clearFilters: () => void;
  getFilteredAlerts: () => SOCAlert[];
  getAlertById: (alertId: string) => SOCAlert | undefined;
  getNotesForAlert: (alertId: string) => AnalystNote[];
  acknowledgeAlert: (alertId: string) => void;
  escalateAlert: (alertId: string) => void;
  resolveAlert: (alertId: string) => void;
  ignoreAlert: (alertId: string) => void;
  reset: () => void;
}

const calculateStats = (alerts: SOCAlert[]): AlertStats => {
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  const bySeverity: Record<AlertSeverity, number> = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    CRITICAL: 0,
  };

  const byStatus: Record<AlertStatus, number> = {
    NEW: 0,
    ACKNOWLEDGED: 0,
    ESCALATED: 0,
    RESOLVED: 0,
    IGNORED: 0,
  };

  let newLast24h = 0;
  let criticalUnresolved = 0;

  for (const alert of alerts) {
    bySeverity[alert.severity]++;
    byStatus[alert.status]++;
    
    if (alert.timestamp >= oneDayAgo) {
      newLast24h++;
    }
    
    if (alert.severity === 'CRITICAL' && alert.status !== 'RESOLVED' && alert.status !== 'IGNORED') {
      criticalUnresolved++;
    }
  }

  return {
    total: alerts.length,
    bySeverity,
    byStatus,
    newLast24h,
    criticalUnresolved,
  };
};

const generateNoteId = (): string => {
  return `note_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

export const useAlertStore = create<AlertState>((set, get) => ({
  // Initial state
  alerts: [],
  selectedAlertId: null,
  notes: new Map(),
  filters: {},
  stats: {
    total: 0,
    bySeverity: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
    byStatus: { NEW: 0, ACKNOWLEDGED: 0, ESCALATED: 0, RESOLVED: 0, IGNORED: 0 },
    newLast24h: 0,
    criticalUnresolved: 0,
  },
  isLoading: false,

  // Add single alert
  addAlert: (alert) => {
    set((state) => {
      const newAlerts = [alert, ...state.alerts];
      return {
        alerts: newAlerts,
        stats: calculateStats(newAlerts),
      };
    });
  },

  // Add multiple alerts
  addAlerts: (alerts) => {
    set((state) => {
      const newAlerts = [...alerts, ...state.alerts];
      return {
        alerts: newAlerts,
        stats: calculateStats(newAlerts),
      };
    });
  },

  // Update alert status
  updateAlertStatus: (alertId, status) => {
    set((state) => {
      const newAlerts = state.alerts.map((a) =>
        a.alertId === alertId ? { ...a, status } : a
      );
      return {
        alerts: newAlerts,
        stats: calculateStats(newAlerts),
      };
    });
  },

  // Select alert for detail view
  selectAlert: (alertId) => {
    set({ selectedAlertId: alertId });
  },

  // Add analyst note
  addNote: (alertId, noteData) => {
    set((state) => {
      const newNotes = new Map(state.notes);
      const existingNotes = newNotes.get(alertId) || [];
      
      const note: AnalystNote = {
        id: generateNoteId(),
        alertId,
        ...noteData,
        createdAt: Date.now(),
      };
      
      newNotes.set(alertId, [...existingNotes, note]);
      return { notes: newNotes };
    });
  },

  // Set filters
  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  // Clear filters
  clearFilters: () => {
    set({ filters: {} });
  },

  // Get filtered alerts
  getFilteredAlerts: () => {
    const { alerts, filters } = get();
    
    return alerts.filter((alert) => {
      if (filters.severity?.length && !filters.severity.includes(alert.severity)) {
        return false;
      }
      if (filters.status?.length && !filters.status.includes(alert.status)) {
        return false;
      }
      if (filters.category?.length && !filters.category.includes(alert.category)) {
        return false;
      }
      if (filters.challengeId && alert.challengeId !== filters.challengeId) {
        return false;
      }
      if (filters.userId && alert.userId !== filters.userId) {
        return false;
      }
      if (filters.timeRange) {
        if (alert.timestamp < filters.timeRange.start || alert.timestamp > filters.timeRange.end) {
          return false;
        }
      }
      return true;
    });
  },

  // Get alert by ID
  getAlertById: (alertId) => {
    return get().alerts.find((a) => a.alertId === alertId);
  },

  // Get notes for alert
  getNotesForAlert: (alertId) => {
    return get().notes.get(alertId) || [];
  },

  // Quick status actions
  acknowledgeAlert: (alertId) => {
    get().updateAlertStatus(alertId, 'ACKNOWLEDGED');
  },

  escalateAlert: (alertId) => {
    get().updateAlertStatus(alertId, 'ESCALATED');
  },

  resolveAlert: (alertId) => {
    get().updateAlertStatus(alertId, 'RESOLVED');
  },

  ignoreAlert: (alertId) => {
    get().updateAlertStatus(alertId, 'IGNORED');
  },

  // Reset store
  reset: () => {
    set({
      alerts: [],
      selectedAlertId: null,
      notes: new Map(),
      filters: {},
      stats: {
        total: 0,
        bySeverity: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
        byStatus: { NEW: 0, ACKNOWLEDGED: 0, ESCALATED: 0, RESOLVED: 0, IGNORED: 0 },
        newLast24h: 0,
        criticalUnresolved: 0,
      },
      isLoading: false,
    });
  },
}));
