/**
 * Global Overview Panel
 * 
 * Displays high-level SOC metrics including:
 * - Active sessions
 * - Alerts by severity
 * - System health status
 * - Kill switch state
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAlertStore } from '@/store/alertStore';
import { useFeatureStore } from '@/store/featureStore';
import { mockSOCService } from '@/services/mockSOCService';
import {
  Shield,
  Users,
  AlertTriangle,
  Activity,
  Zap,
  Server,
  Radio,
  TrendingUp,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { AlertSeverity } from '@/types';

interface GlobalOverviewProps {
  isLoading?: boolean;
}

export function GlobalOverview({ isLoading = false }: GlobalOverviewProps) {
  const { stats } = useAlertStore();
  const { killSwitches } = useFeatureStore();
  const [activeSessions, setActiveSessions] = useState(0);

  useEffect(() => {
    mockSOCService.getStats().then((data) => {
      setActiveSessions(data.activeSessions);
    });
  }, []);

  const severityColors: Record<AlertSeverity, string> = {
    LOW: 'bg-cyan-500',
    MEDIUM: 'bg-yellow-500',
    HIGH: 'bg-orange-500',
    CRITICAL: 'bg-red-500',
  };

  const totalActiveAlerts = stats.total - stats.byStatus.RESOLVED - stats.byStatus.IGNORED;

  const statCards = [
    {
      title: 'Active Sessions',
      value: activeSessions,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Active Alerts',
      value: totalActiveAlerts,
      icon: AlertTriangle,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'Critical',
      value: stats.criticalUnresolved,
      icon: Shield,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      title: 'Last 24h',
      value: stats.newLast24h,
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Stat Cards */}
      {statCards.map((stat, idx) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
        >
          <Card className="cyber-card glow-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* Severity Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="md:col-span-2"
      >
        <Card className="cyber-card glow-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Alerts by Severity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as AlertSeverity[]).map((severity) => {
              const count = stats.bySeverity[severity];
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;

              return (
                <div key={severity} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{severity}</span>
                    <span className="font-mono">{count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${severityColors[severity]} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>

      {/* System Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="md:col-span-2"
      >
        <Card className="cyber-card glow-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Server className="w-4 h-4" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Telemetry Pipeline</span>
              </div>
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                Active
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Detection Engine</span>
              </div>
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                Running
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Kill Switches</span>
              </div>
              <Badge 
                variant="outline" 
                className={
                  Array.from(killSwitches.values()).some(k => k.enabled)
                    ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                    : 'bg-green-500/10 text-green-400 border-green-500/30'
                }
              >
                {Array.from(killSwitches.values()).filter(k => k.enabled).length} Active
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
