import { useTelemetryStore } from '@/store/telemetryStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, Radio, Clock, Hash } from 'lucide-react';
import { motion } from 'framer-motion';

interface TelemetryPanelProps {
  sessionId: string | null;
}

/**
 * Telemetry Dev Panel
 * 
 * Real-time view of telemetry events for:
 * - Development debugging
 * - SOC preview
 * - Audit foundation
 * 
 * Only visible when auditMode feature flag is enabled
 */
export const TelemetryPanel = ({ sessionId }: TelemetryPanelProps) => {
  const { eventQueue, eventsTracked, isEnabled, isPrivacyMode } = useTelemetryStore();

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'challenge_start':
      case 'session_start':
        return '🚀';
      case 'session_end':
        return '🏁';
      case 'submission_attempt':
        return '📤';
      case 'hint_used':
        return '💡';
      case 'time_on_task':
        return '⏱️';
      default:
        return '📊';
    }
  };

  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <Card className="cyber-card glow-border flex-1 min-h-[200px]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyber-purple" />
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Telemetry
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isPrivacyMode && (
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 text-xs">
                Privacy
              </Badge>
            )}
            <Badge 
              variant="outline" 
              className={`text-xs ${
                isEnabled 
                  ? 'bg-primary/10 text-primary border-primary/30' 
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <Radio className={`w-2 h-2 mr-1 ${isEnabled ? 'animate-pulse' : ''}`} />
              {isEnabled ? 'Live' : 'Off'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Session Info */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
            <Hash className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">Session:</span>
            <span className="font-mono text-foreground truncate">
              {sessionId?.slice(0, 12) || 'None'}
            </span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">Events:</span>
            <span className="font-mono text-primary">{eventsTracked}</span>
          </div>
        </div>

        {/* Event Stream */}
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="bg-muted/30 px-3 py-1.5 border-b border-border">
            <span className="text-xs font-mono text-muted-foreground">
              Event Stream ({eventQueue.length} queued)
            </span>
          </div>
          
          <ScrollArea className="h-[150px]">
            <div className="p-2 space-y-1">
              {eventQueue.length === 0 ? (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  No events in queue
                </div>
              ) : (
                eventQueue.slice(-10).reverse().map((event, idx) => (
                  <motion.div
                    key={`${event.timestamp}-${idx}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 p-2 bg-background/50 rounded text-xs font-mono"
                  >
                    <span>{getEventIcon(event.type)}</span>
                    <span className="text-muted-foreground">
                      {formatTimestamp(event.timestamp)}
                    </span>
                    <span className="text-foreground flex-1 truncate">
                      {event.type}
                    </span>
                    {event.metadata && (
                      <span className="text-muted-foreground">
                        {Object.keys(event.metadata).length} meta
                      </span>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Dev panel • SOC preview mode
        </p>
      </CardContent>
    </Card>
  );
};
