/**
 * Detection Timeline Component
 * 
 * Visual event chain showing:
 * - Sequence of events leading to alerts
 * - Root cause analysis visualization
 * - Event filtering and navigation
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAlertStore } from '@/store/alertStore';
import { useTelemetryStore } from '@/store/telemetryStore';
import type { TelemetryEvent, SOCAlert } from '@/types';
import {
  GitBranch,
  Play,
  AlertTriangle,
  Lightbulb,
  Send,
  Clock,
  Activity,
  Filter,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

export function DetectionTimeline() {
  const { alerts, getAlertById } = useAlertStore();
  const { eventQueue } = useTelemetryStore();
  const [selectedAlertId, setSelectedAlertId] = useState<string>('');
  const [timelineEvents, setTimelineEvents] = useState<Array<{
    type: 'event' | 'alert';
    data: TelemetryEvent | SOCAlert;
    timestamp: number;
  }>>([]);

  // Build combined timeline
  useEffect(() => {
    const combined: typeof timelineEvents = [];

    // Add telemetry events
    eventQueue.forEach((event) => {
      combined.push({
        type: 'event',
        data: event,
        timestamp: event.timestamp,
      });
    });

    // Add alerts
    alerts.forEach((alert) => {
      combined.push({
        type: 'alert',
        data: alert,
        timestamp: alert.timestamp,
      });
    });

    // Sort by timestamp
    combined.sort((a, b) => a.timestamp - b.timestamp);

    // Filter if an alert is selected
    if (selectedAlertId) {
      const alert = getAlertById(selectedAlertId);
      if (alert) {
        const alertTime = alert.timestamp;
        const windowStart = alertTime - 5 * 60 * 1000; // 5 min before
        const filtered = combined.filter(
          (e) => e.timestamp >= windowStart && e.timestamp <= alertTime + 60 * 1000
        );
        setTimelineEvents(filtered);
        return;
      }
    }

    setTimelineEvents(combined.slice(-50)); // Last 50 events
  }, [alerts, eventQueue, selectedAlertId, getAlertById]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'challenge_start':
      case 'session_start':
        return { icon: Play, color: 'text-green-400', bg: 'bg-green-500/10' };
      case 'submission_attempt':
        return { icon: Send, color: 'text-blue-400', bg: 'bg-blue-500/10' };
      case 'hint_used':
        return { icon: Lightbulb, color: 'text-yellow-400', bg: 'bg-yellow-500/10' };
      case 'focus_lost':
        return { icon: Activity, color: 'text-orange-400', bg: 'bg-orange-500/10' };
      default:
        return { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted' };
    }
  };

  const renderTimelineItem = (item: typeof timelineEvents[0], index: number) => {
    if (item.type === 'alert') {
      const alert = item.data as SOCAlert;
      return (
        <motion.div
          key={`alert-${alert.alertId}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex items-start gap-3"
        >
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-red-500/10 border-2 border-red-500 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            {index < timelineEvents.length - 1 && (
              <div className="w-0.5 h-12 bg-red-500/30" />
            )}
          </div>
          
          <div className="flex-1 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
                ALERT
              </Badge>
              <span className="text-xs text-muted-foreground">
                {format(alert.timestamp, 'HH:mm:ss')}
              </span>
            </div>
            <p className="text-sm font-medium">{alert.title}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Triggered by: {alert.triggeredBy}
            </p>
          </div>
        </motion.div>
      );
    }

    const event = item.data as TelemetryEvent;
    const iconConfig = getEventIcon(event.type);

    return (
      <motion.div
        key={`event-${event.timestamp}-${index}`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        className="flex items-start gap-3"
      >
        <div className="flex flex-col items-center">
          <div className={`w-8 h-8 rounded-full ${iconConfig.bg} flex items-center justify-center`}>
            <iconConfig.icon className={`w-4 h-4 ${iconConfig.color}`} />
          </div>
          {index < timelineEvents.length - 1 && (
            <div className="w-0.5 h-8 bg-border" />
          )}
        </div>
        
        <div className="flex-1 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono">{event.type}</span>
            <span className="text-xs text-muted-foreground">
              {format(event.timestamp, 'HH:mm:ss')}
            </span>
          </div>
          {event.metadata && Object.keys(event.metadata).length > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              {Object.entries(event.metadata).slice(0, 3).map(([key, value]) => (
                <span key={key} className="mr-2">
                  {key}: {String(value)}
                </span>
              ))}
            </div>
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
            <GitBranch className="w-4 h-4 text-primary" />
            Detection Timeline
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Select value={selectedAlertId} onValueChange={setSelectedAlertId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by alert" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Events</SelectItem>
                {alerts.slice(0, 10).map((alert) => (
                  <SelectItem key={alert.alertId} value={alert.alertId}>
                    {alert.title.slice(0, 25)}...
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[600px]">
          {timelineEvents.length === 0 ? (
            <div className="text-center py-12">
              <GitBranch className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No events to display</p>
              <p className="text-xs text-muted-foreground mt-2">
                Events will appear here as they occur
              </p>
            </div>
          ) : (
            <div className="space-y-0 pr-4">
              {timelineEvents.map((item, index) => renderTimelineItem(item, index))}
            </div>
          )}
        </ScrollArea>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 pt-4 mt-4 border-t border-border">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-green-500/10 border border-green-500" />
            <span className="text-muted-foreground">Session Start</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-blue-500/10 border border-blue-500" />
            <span className="text-muted-foreground">Submission</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-yellow-500/10 border border-yellow-500" />
            <span className="text-muted-foreground">Hint Used</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-red-500/10 border-2 border-red-500" />
            <span className="text-muted-foreground">Alert Triggered</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
