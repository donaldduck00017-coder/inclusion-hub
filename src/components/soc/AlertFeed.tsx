/**
 * Alert Feed Component
 * 
 * Real-time stream of SOC alerts with severity coloring,
 * quick actions, and filtering.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAlertStore } from '@/store/alertStore';
import type { SOCAlert, AlertSeverity, AlertStatus } from '@/types';
import {
  Shield,
  AlertTriangle,
  Check,
  ArrowUp,
  Eye,
  X,
  MoreVertical,
  Clock,
  Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface AlertFeedProps {
  limit?: number;
  compact?: boolean;
}

export function AlertFeed({ limit, compact = false }: AlertFeedProps) {
  const {
    getFilteredAlerts,
    selectAlert,
    selectedAlertId,
    acknowledgeAlert,
    escalateAlert,
    resolveAlert,
    ignoreAlert,
    filters,
    setFilters,
    clearFilters,
  } = useAlertStore();

  const [showFilters, setShowFilters] = useState(false);

  const alerts = getFilteredAlerts();
  const displayAlerts = limit ? alerts.slice(0, limit) : alerts;

  const severityConfig: Record<AlertSeverity, { color: string; bg: string; icon: typeof Shield }> = {
    CRITICAL: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', icon: Shield },
    HIGH: { color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30', icon: AlertTriangle },
    MEDIUM: { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', icon: AlertTriangle },
    LOW: { color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30', icon: Eye },
  };

  const statusConfig: Record<AlertStatus, { label: string; color: string }> = {
    NEW: { label: 'New', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
    ACKNOWLEDGED: { label: 'Ack', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
    ESCALATED: { label: 'Escalated', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
    RESOLVED: { label: 'Resolved', color: 'bg-green-500/10 text-green-400 border-green-500/30' },
    IGNORED: { label: 'Ignored', color: 'bg-muted text-muted-foreground border-muted' },
  };

  const handleQuickAction = (alertId: string, action: 'ack' | 'escalate' | 'resolve' | 'ignore') => {
    switch (action) {
      case 'ack':
        acknowledgeAlert(alertId);
        break;
      case 'escalate':
        escalateAlert(alertId);
        break;
      case 'resolve':
        resolveAlert(alertId);
        break;
      case 'ignore':
        ignoreAlert(alertId);
        break;
    }
  };

  const renderAlert = (alert: SOCAlert) => {
    const severity = severityConfig[alert.severity];
    const status = statusConfig[alert.status];
    const isSelected = alert.alertId === selectedAlertId;

    return (
      <motion.div
        key={alert.alertId}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className={`
          p-3 rounded-lg border cursor-pointer transition-all
          ${severity.bg}
          ${isSelected ? 'ring-2 ring-primary' : 'hover:bg-accent/5'}
        `}
        onClick={() => selectAlert(alert.alertId)}
      >
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 ${severity.color}`}>
            <severity.icon className="w-4 h-4" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm truncate">{alert.title}</span>
              <Badge variant="outline" className={`text-xs ${status.color}`}>
                {status.label}
              </Badge>
            </div>

            {!compact && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {alert.description}
              </p>
            )}

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="font-mono">{alert.userId.slice(0, 12)}</span>
              {alert.challengeId && (
                <span className="truncate">{alert.challengeId}</span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
              </span>
            </div>
          </div>

          {!compact && alert.status === 'NEW' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleQuickAction(alert.alertId, 'ack'); }}>
                  <Check className="w-4 h-4 mr-2" />
                  Acknowledge
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleQuickAction(alert.alertId, 'escalate'); }}>
                  <ArrowUp className="w-4 h-4 mr-2" />
                  Escalate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleQuickAction(alert.alertId, 'resolve'); }}>
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                  Resolve
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleQuickAction(alert.alertId, 'ignore'); }}>
                  <X className="w-4 h-4 mr-2 text-muted-foreground" />
                  Ignore
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <Card className="cyber-card glow-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Alert Feed
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {Object.keys(filters).length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-primary/10' : ''}
            >
              <Filter className="w-4 h-4 mr-1" />
              Filter
            </Button>
          </div>
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2 pt-3"
          >
            {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as AlertSeverity[]).map((sev) => (
              <Badge
                key={sev}
                variant="outline"
                className={`cursor-pointer ${
                  filters.severity?.includes(sev) 
                    ? severityConfig[sev].bg + ' ' + severityConfig[sev].color
                    : 'opacity-50'
                }`}
                onClick={() => {
                  const current = filters.severity || [];
                  setFilters({
                    severity: current.includes(sev)
                      ? current.filter((s) => s !== sev)
                      : [...current, sev],
                  });
                }}
              >
                {sev}
              </Badge>
            ))}
          </motion.div>
        )}
      </CardHeader>

      <CardContent>
        <ScrollArea className={compact ? 'h-[300px]' : 'h-[500px]'}>
          <AnimatePresence mode="popLayout">
            {displayAlerts.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No alerts to display</p>
              </div>
            ) : (
              <div className="space-y-2 pr-4">
                {displayAlerts.map(renderAlert)}
              </div>
            )}
          </AnimatePresence>
        </ScrollArea>

        {limit && alerts.length > limit && (
          <div className="pt-4 text-center">
            <Button variant="ghost" size="sm">
              View all {alerts.length} alerts
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
