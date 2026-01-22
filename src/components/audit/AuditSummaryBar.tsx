/**
 * Audit Summary Bar
 * 
 * Displays session metrics at the top of the audit view:
 * - Session duration
 * - Total attempts
 * - Hints used
 * - Detection count
 * - Highest severity
 * - Session ID (shortened)
 */

import { Clock, Target, Lightbulb, AlertTriangle, Hash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatSessionId } from '@/lib/sanitize';
import type { AlertSeverity } from '@/types';

interface AuditSummaryBarProps {
  sessionId: string;
  duration: number;
  totalAttempts: number;
  hintsUsed: number;
  detectionCount: number;
  highestSeverity: Lowercase<AlertSeverity> | null;
  isLoading?: boolean;
}

const severityColors: Record<Lowercase<AlertSeverity>, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-warning/20 text-warning border-warning/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  critical: 'bg-destructive/20 text-destructive border-destructive/30',
};

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

export function AuditSummaryBar({
  sessionId,
  duration,
  totalAttempts,
  hintsUsed,
  detectionCount,
  highestSeverity,
  isLoading = false,
}: AuditSummaryBarProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 bg-card border-b border-border">
      {/* Left: Session ID */}
      <div className="flex items-center gap-2 min-w-0">
        <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <code className="font-mono text-sm text-muted-foreground truncate">
          {formatSessionId(sessionId)}
        </code>
      </div>
      
      {/* Center: Metrics */}
      <div className="flex items-center gap-6">
        {/* Duration */}
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            {isLoading ? '—' : formatDuration(duration)}
          </span>
        </div>
        
        {/* Attempts */}
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            <span className="font-medium">{isLoading ? '—' : totalAttempts}</span>
            <span className="text-muted-foreground ml-1">attempts</span>
          </span>
        </div>
        
        {/* Hints */}
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-warning" />
          <span className="text-sm">
            <span className="font-medium">{isLoading ? '—' : hintsUsed}</span>
            <span className="text-muted-foreground ml-1">hints</span>
          </span>
        </div>
        
        {/* Detections */}
        <div className="flex items-center gap-2">
          <AlertTriangle className={cn(
            'h-4 w-4',
            detectionCount > 0 ? 'text-destructive' : 'text-muted-foreground'
          )} />
          <span className="text-sm">
            <span className="font-medium">{isLoading ? '—' : detectionCount}</span>
            <span className="text-muted-foreground ml-1">detections</span>
          </span>
        </div>
      </div>
      
      {/* Right: Highest Severity Badge */}
      <div className="flex-shrink-0">
        {highestSeverity ? (
          <Badge 
            variant="outline"
            className={cn('uppercase text-xs', severityColors[highestSeverity])}
          >
            {highestSeverity} severity
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            No alerts
          </Badge>
        )}
      </div>
    </div>
  );
}
