import { config } from '@/lib/config';
import killSwitchesData from '@/data/kill-switches.json';
import type { KillSwitch, User } from '@/types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Extended kill switch type with description and category
interface KillSwitchConfig extends KillSwitch {
  description: string;
  category: 'feature' | 'emergency' | 'operational' | 'privacy';
}

// In-memory kill switch state (mutable for demo)
const killSwitchState = new Map<string, KillSwitch>();

// Initialize from JSON data
killSwitchesData.switches.forEach((switchConfig) => {
  killSwitchState.set(switchConfig.id, {
    id: switchConfig.id,
    name: switchConfig.name,
    enabled: switchConfig.enabled,
  });
});

// Kill switch descriptions for UI
export const KILL_SWITCH_DESCRIPTIONS: Record<string, KillSwitchConfig> = {
  disableTelemetry: {
    id: 'disableTelemetry',
    name: 'Disable Telemetry',
    description: 'Disable all telemetry tracking and event collection',
    enabled: false,
    category: 'feature',
  },
  disableAiTutor: {
    id: 'disableAiTutor',
    name: 'Disable AI Tutor',
    description: 'Disable AI tutor service for all users',
    enabled: false,
    category: 'feature',
  },
  disableAuditMode: {
    id: 'disableAuditMode',
    name: 'Disable Audit Mode',
    description: 'Disable session recording and replay features',
    enabled: false,
    category: 'feature',
  },
  readOnlyMode: {
    id: 'readOnlyMode',
    name: 'Read Only Mode',
    description: 'Disable all write operations (view only)',
    enabled: false,
    category: 'emergency',
  },
  emergencyShutdown: {
    id: 'emergencyShutdown',
    name: 'Emergency Shutdown',
    description: 'Disable all features except health monitoring',
    enabled: false,
    category: 'emergency',
  },
  maintenanceMode: {
    id: 'maintenanceMode',
    name: 'Maintenance Mode',
    description: 'Show maintenance banner and limit features',
    enabled: false,
    category: 'operational',
  },
  enhancedPrivacy: {
    id: 'enhancedPrivacy',
    name: 'Enhanced Privacy',
    description: 'Enable maximum data minimization',
    enabled: false,
    category: 'privacy',
  },
};

export const mockAdminService = {
  // Get all kill switches
  async getKillSwitches(): Promise<KillSwitch[]> {
    await delay(config.mockDelay);
    return Array.from(killSwitchState.values());
  },

  // Get a specific kill switch
  async getKillSwitch(switchId: string): Promise<KillSwitch | null> {
    await delay(config.mockDelay / 2);
    return killSwitchState.get(switchId) || null;
  },

  // Set kill switch state
  async setKillSwitch(
    switchId: string,
    enabled: boolean,
    reason?: string,
    user?: User
  ): Promise<{ success: boolean; currentState: KillSwitch }> {
    await delay(config.mockDelay);

    const existing = killSwitchState.get(switchId);
    if (!existing) {
      throw new Error(`Kill switch not found: ${switchId}`);
    }

    const updatedSwitch: KillSwitch = {
      ...existing,
      enabled,
      reason,
      enabledBy: user?.email,
      enabledAt: enabled ? Date.now() : undefined,
    };

    killSwitchState.set(switchId, updatedSwitch);

    // Also update the runtime config (for demo purposes)
    if (switchId in config.killSwitches) {
      (config.killSwitches as Record<string, boolean>)[switchId] = enabled;
    }

    console.info(
      `[Admin] Kill switch "${switchId}" ${enabled ? 'ENABLED' : 'DISABLED'}${reason ? ` - Reason: ${reason}` : ''}`
    );

    return {
      success: true,
      currentState: updatedSwitch,
    };
  },

  // Toggle kill switch
  async toggleKillSwitch(
    switchId: string,
    reason?: string,
    user?: User
  ): Promise<{ success: boolean; currentState: KillSwitch }> {
    const current = await this.getKillSwitch(switchId);
    if (!current) {
      throw new Error(`Kill switch not found: ${switchId}`);
    }

    return this.setKillSwitch(switchId, !current.enabled, reason, user);
  },

  // Bulk update kill switches
  async bulkSetKillSwitches(
    updates: Array<{ switchId: string; enabled: boolean; reason?: string }>,
    user?: User
  ): Promise<{ success: boolean; updated: number }> {
    await delay(config.mockDelay);

    let updated = 0;
    for (const update of updates) {
      try {
        await this.setKillSwitch(update.switchId, update.enabled, update.reason, user);
        updated++;
      } catch (error) {
        console.error(`Failed to update kill switch: ${update.switchId}`, error);
      }
    }

    return { success: updated > 0, updated };
  },

  // Get kill switch descriptions
  getKillSwitchDescriptions(): Record<string, KillSwitchConfig> {
    return KILL_SWITCH_DESCRIPTIONS;
  },

  // Check if any emergency kill switch is active
  isEmergencyActive(): boolean {
    const emergency = killSwitchState.get('emergencyShutdown');
    const readOnly = killSwitchState.get('readOnlyMode');
    return emergency?.enabled || readOnly?.enabled || false;
  },

  // Get active kill switches only
  async getActiveKillSwitches(): Promise<KillSwitch[]> {
    await delay(config.mockDelay / 2);
    return Array.from(killSwitchState.values()).filter((s) => s.enabled);
  },

  // Reset all kill switches (for testing)
  async resetAllKillSwitches(): Promise<void> {
    await delay(config.mockDelay);
    
    killSwitchState.forEach((_, key) => {
      const current = killSwitchState.get(key);
      if (current) {
        killSwitchState.set(key, { ...current, enabled: false, reason: undefined, enabledBy: undefined, enabledAt: undefined });
      }
    });

    // Reset runtime config
    Object.keys(config.killSwitches).forEach((key) => {
      (config.killSwitches as Record<string, boolean>)[key] = false;
    });
  },
};

export type MockAdminService = typeof mockAdminService;
