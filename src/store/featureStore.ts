import { create } from 'zustand';
import type { FeatureFlags, KillSwitch, User } from '@/types';
import { config } from '@/lib/config';

interface FeatureState {
  // Computed flags
  flags: FeatureFlags;
  
  // Kill switches
  killSwitches: Map<string, KillSwitch>;
  
  // Loading state
  isLoading: boolean;
  
  // Actions
  computeFlags: (user: User | null) => void;
  setKillSwitch: (id: string, enabled: boolean, reason?: string) => void;
  loadKillSwitches: (switches: KillSwitch[]) => void;
  isFeatureEnabled: (feature: keyof FeatureFlags) => boolean;
  isKillSwitchActive: (id: string) => boolean;
  reset: () => void;
}

const defaultFlags: FeatureFlags = {
  aiTutor: false,
  advancedChallenges: false,
  socDashboard: false,
  auditMode: false,
  telemetryExport: false,
  customChallenges: false,
  healthPanel: false,
};

export const useFeatureStore = create<FeatureState>((set, get) => ({
  flags: defaultFlags,
  killSwitches: new Map(),
  isLoading: false,

  // Compute feature flags based on user and config
  computeFlags: (user) => {
    // Emergency shutdown - minimal features
    if (config.killSwitches.emergencyShutdown) {
      set({
        flags: {
          aiTutor: false,
          advancedChallenges: false,
          socDashboard: false,
          auditMode: false,
          telemetryExport: false,
          customChallenges: false,
          healthPanel: user?.role === 'admin',
        },
      });
      return;
    }

    // Read-only mode - view-only features
    if (config.killSwitches.readOnlyMode) {
      set({
        flags: {
          aiTutor: false,
          advancedChallenges: false,
          socDashboard: user?.role !== 'student',
          auditMode: user?.role === 'admin',
          telemetryExport: false,
          customChallenges: false,
          healthPanel: user?.role === 'admin',
        },
      });
      return;
    }

    // No user - minimal features
    if (!user) {
      set({ flags: defaultFlags });
      return;
    }

    // Normal feature computation
    set({
      flags: {
        aiTutor: config.features.aiTutor && !config.killSwitches.disableAiTutor,
        advancedChallenges: user.skillLevel >= 3,
        socDashboard: ['admin', 'instructor'].includes(user.role),
        auditMode: user.role === 'admin' && config.features.auditMode,
        telemetryExport: user.role === 'instructor' || user.role === 'admin',
        customChallenges: user.role === 'instructor' || user.role === 'admin',
        healthPanel: user.role === 'admin',
      },
    });
  },

  // Set a kill switch state
  setKillSwitch: (id, enabled, reason) => {
    const state = get();
    const existing = state.killSwitches.get(id);
    
    const updatedSwitch: KillSwitch = {
      id,
      name: existing?.name || id,
      enabled,
      reason,
      enabledAt: enabled ? Date.now() : undefined,
    };

    const newSwitches = new Map(state.killSwitches);
    newSwitches.set(id, updatedSwitch);

    set({ killSwitches: newSwitches });
  },

  // Load kill switches from service
  loadKillSwitches: (switches) => {
    const newMap = new Map<string, KillSwitch>();
    switches.forEach((s) => newMap.set(s.id, s));
    set({ killSwitches: newMap });
  },

  // Check if a specific feature is enabled
  isFeatureEnabled: (feature) => {
    return get().flags[feature];
  },

  // Check if a kill switch is active
  isKillSwitchActive: (id) => {
    const killSwitch = get().killSwitches.get(id);
    return killSwitch?.enabled || false;
  },

  // Reset store
  reset: () => {
    set({
      flags: defaultFlags,
      killSwitches: new Map(),
      isLoading: false,
    });
  },
}));
