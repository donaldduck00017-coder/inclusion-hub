/**
 * Audit Timeline Panel (Right Panel)
 * 
 * Displays chronological feed of:
 * - Telemetry events
 * - Detection signals (highlighted by severity)
 * - Clickable entries to jump replay to that moment
 */

import { useCallback, useMemo, useRef, useEffect } from 'react';
import { 
  Play, 
  AlertTriangle, 
  Lightbulb, 
  Target, 
  Navigation, 
  Eye,
  EyeOff,
  Clock,
  Flag
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { escapeHtml } from '@/lib/sanitize';
import type { AuditTelemetryEvent, AuditDetection } from '@/types/audit';
import type { AlertSeverity, TelemetryEventType } from '@/types';

interface AuditTimelinePanelProps {
  events: AuditTelemetryEvent[];
  detections: AuditDetection[];
  sessionStartTime: number;
  currentTime: number;
  onJumpToDetection: (detection: AuditDetection) => void;
  onJumpToTime: (time: number) => void;
}

type TimelineItem = 
  | { type: 'event'; data: AuditTelemetryEvent; timestamp: number }
  | { type: 'detection'; data: AuditDetection; timestamp: number };

const eventIcons: Partial<Record<TelemetryEventType | string, React.ReactNode>> = {
  session_start: <Play className="h-3.5 w-3.5 text-success" />,
  session_end: <Flag className="h-3.5 w-3.5 text-muted-foreground" />,
  challenge_start: <Play className="h-3.5 w-3.5 text-primary" />,
  hint_used: <Lightbulb className="h-3.5 w-3.5 text-warning" />,
  submission_attempt: <Target className="h-3.5 w-3.5 text-primary" />,
  navigation: <Navigation className="h-3.5 w-3.5 text-muted-foreground" />,
  focus_lost: <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />,
  time_on_task: <Clock className="h-3.5 w-3.5 text-muted-foreground" />,
};

const severityStyles: Record<Lowercase<AlertSeverity>, string> = {
  low: 'border-l-muted-foreground bg-muted/30',
  medium: 'border-l-warning bg-warning/10',
  high: 'border-l-orange-500 bg-orange-500/10',
  critical: 'border-l-destructive bg-destructive/10',
};

function formatRelativeTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function getEventLabel(event: AuditTelemetryEvent): string {
  switch (event.type) {
    case 'session_start':
      return 'Session Started';
    case 'session_end':
      return 'Session Ended';
    case 'challenge_start':
      return 'Challenge Started';
    case 'hint_used':
      const hintLevel = (event.payload as { hintLevel?: number })?.hintLevel;
      return hintLevel ? `Hint ${hintLevel} Used` : 'Hint Used';
    case 'submission_attempt':
      const success = (event.payload as { success?: boolean })?.success;
      return success ? 'Submission (Correct)' : 'Submission (Incorrect)';
    case 'navigation':
      return 'Page Navigation';
    case 'focus_lost':
      return 'Focus Lost';
    case 'time_on_task':
      return 'Heartbeat';
    default:
      return escapeHtml(String(event.type));
  }
}

function EventItem({ 
  event, 
  relativeTime,
  isActive,
  onClick 
}: { 
  event: AuditTelemetryEvent; 
  relativeTime: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-3 py-2 border-l-2 border-l-transparent transition-colors',
        'hover:bg-muted/50',
        isActive && 'bg-primary/10 border-l-primary'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {eventIcons[event.type] || <Eye className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">{getEventLabel(event)}</div>
          {event.type === 'submission_attempt' && (
            <div className="text-xs text-muted-foreground font-mono truncate">
              {escapeHtml(String((event.payload as { answer?: unknown })?.answer || ''))}
            </div>
          )}
        </div>
        <span className="text-xs font-mono text-muted-foreground flex-shrink-0">
          {formatRelativeTime(relativeTime)}
        </span>
      </div>
    </button>
  );
}

function DetectionItem({ 
  detection, 
  relativeTime,
  isActive,
  onClick 
}: { 
  detection: AuditDetection; 
  relativeTime: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-3 py-2 border-l-4 transition-colors',
        severityStyles[detection.severity],
        'hover:opacity-80',
        isActive && 'ring-1 ring-primary ring-inset'
      )}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className={cn(
          'h-4 w-4 mt-0.5 flex-shrink-0',
          detection.severity === 'critical' && 'text-destructive',
          detection.severity === 'high' && 'text-orange-500',
          detection.severity === 'medium' && 'text-warning',
          detection.severity === 'low' && 'text-muted-foreground'
        )} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Detection Signal</span>
            <Badge variant="outline" className="text-[10px] uppercase">
              {detection.severity}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {escapeHtml(detection.message)}
          </div>
          <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
            <span className="font-mono">{escapeHtml(detection.ruleId)}</span>
            <span>{Math.round(detection.confidence * 100)}% confidence</span>
          </div>
        </div>
        <span className="text-xs font-mono text-muted-foreground flex-shrink-0">
          {formatRelativeTime(relativeTime)}
        </span>
      </div>
    </button>
  );
}

export function AuditTimelinePanel({
  events,
  detections,
  sessionStartTime,
  currentTime,
  onJumpToDetection,
  onJumpToTime,
}: AuditTimelinePanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Combine and sort events + detections by timestamp
  const timelineItems = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [
      ...events.map(e => ({ type: 'event' as const, data: e, timestamp: e.timestamp })),
      ...detections.map(d => ({ type: 'detection' as const, data: d, timestamp: d.timestamp })),
    ];
    
    return items.sort((a, b) => a.timestamp - b.timestamp);
  }, [events, detections]);
  
  // Find active item based on current playback time
  const activeTimestamp = sessionStartTime + currentTime;
  
  const isItemActive = useCallback((itemTimestamp: number) => {
    const relativeTime = itemTimestamp - sessionStartTime;
    return Math.abs(relativeTime - currentTime) < 5000; // Within 5 seconds
  }, [sessionStartTime, currentTime]);
  
  // Auto-scroll to active item
  useEffect(() => {
    if (!scrollRef.current) return;
    
    const activeElement = scrollRef.current.querySelector('[data-active="true"]');
    if (activeElement) {
      activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeTimestamp]);
  
  if (timelineItems.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-background/50">
        <div className="text-center space-y-2">
          <Clock className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">No timeline events</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-card flex items-center justify-between">
        <h3 className="text-sm font-medium">Session Timeline</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{events.length} events</span>
          <span>•</span>
          <span>{detections.length} detections</span>
        </div>
      </div>
      
      {/* Timeline */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="divide-y divide-border">
          {timelineItems.map((item, index) => {
            const relativeTime = item.timestamp - sessionStartTime;
            const isActive = isItemActive(item.timestamp);
            
            if (item.type === 'detection') {
              return (
                <div key={`detection-${index}`} data-active={isActive}>
                  <DetectionItem
                    detection={item.data}
                    relativeTime={relativeTime}
                    isActive={isActive}
                    onClick={() => onJumpToDetection(item.data)}
                  />
                </div>
              );
            }
            
            return (
              <div key={`event-${index}`} data-active={isActive}>
                <EventItem
                  event={item.data}
                  relativeTime={relativeTime}
                  isActive={isActive}
                  onClick={() => onJumpToTime(relativeTime)}
                />
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
