/**
 * SOC Dashboard - Main Page
 * 
 * Real-time observability and detection console that simulates
 * security operations center workflows.
 */

import { useEffect, useState } from 'react';
import { StudentLayout } from '@/components/shared/StudentLayout';
import { useFeatureStore } from '@/store/featureStore';
import { useAlertStore } from '@/store/alertStore';
import { useAuthStore } from '@/store/authStore';
import { mockSOCService } from '@/services/mockSOCService';
import { GlobalOverview } from '@/components/soc/GlobalOverview';
import { AlertFeed } from '@/components/soc/AlertFeed';
import { AlertDetail } from '@/components/soc/AlertDetail';
import { SessionMonitor } from '@/components/soc/SessionMonitor';
import { DetectionTimeline } from '@/components/soc/DetectionTimeline';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Activity, Eye, GitBranch, Settings } from 'lucide-react';

export default function SOCDashboard() {
  const { user } = useAuthStore();
  const { flags } = useFeatureStore();
  const { addAlerts, selectedAlertId, stats } = useAlertStore();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Load initial alerts
  useEffect(() => {
    const loadAlerts = async () => {
      setIsLoading(true);
      try {
        const { alerts } = await mockSOCService.getAlerts();
        addAlerts(alerts);
      } catch (error) {
        console.error('[SOC] Failed to load alerts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAlerts();
  }, [addAlerts]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // In a real implementation, this would poll or use websockets
      console.info('[SOC] Checking for new alerts...');
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Security Operations Center
              </h1>
              <p className="text-sm text-muted-foreground">
                Real-time monitoring and detection console
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">Live</span>
            </div>
            
            {stats.criticalUnresolved > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/30">
                <span className="text-sm font-medium text-destructive">
                  {stats.criticalUnresolved} Critical
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 border border-border">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Alerts
              {stats.byStatus.NEW > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
                  {stats.byStatus.NEW}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Sessions
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              Timeline
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <GlobalOverview isLoading={isLoading} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AlertFeed limit={5} compact />
              <SessionMonitor limit={3} compact />
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <AlertFeed />
              </div>
              <div>
                {selectedAlertId ? (
                  <AlertDetail alertId={selectedAlertId} />
                ) : (
                  <div className="cyber-card glow-border p-8 text-center">
                    <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Select an alert to view details
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <SessionMonitor />
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <DetectionTimeline />
          </TabsContent>
        </Tabs>
      </div>
    </StudentLayout>
  );
}
