import { create } from 'zustand';
import type { FeatureFlags, KillSwitch, User } from '@/types';
import { config } from '@/lib/config';

interface FeatureState {
  
  flags: FeatureFlags;
  

  killSwitches: Map<string, KillSwitch>;
  

  isLoading: boolean;
  
 
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

  
  computeFlags: (user) => {
    
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

   
    if (!user) {
      set({ flags: defaultFlags });
      return;
    }

    
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

  
  loadKillSwitches: (switches) => {
    const newMap = new Map<string, KillSwitch>();
    switches.forEach((s) => newMap.set(s.id, s));
    set({ killSwitches: newMap });
  },

  
  isFeatureEnabled: (feature) => {
    return get().flags[feature];
  },


  isKillSwitchActive: (id) => {
    const killSwitch = get().killSwitches.get(id);
    return killSwitch?.enabled || false;
  },

 
  reset: () => {
    set({
      flags: defaultFlags,
      killSwitches: new Map(),
      isLoading: false,
    });
  },
}));
