/**
 * Audit Replay View (Left Panel)
 * 
 * Displays the simulated student UI:
 * - Current route
 * - Read-only input fields from snapshot
 * - Scroll position indicator
 * - Environment status panel
 * 
 * SECURITY: All snapshot data is treated as untrusted.
 * Never use dangerouslySetInnerHTML.
 */

import { Monitor, MapPin, FormInput, Server, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { escapeHtml, sanitizeUrl } from '@/lib/sanitize';
import type { AuditUISnapshot, EnvironmentStatus } from '@/types/audit';

interface AuditReplayViewProps {
  snapshot: AuditUISnapshot | null;
  sessionStartTime: number;
  currentTime: number;
  isLoading?: boolean;
}

const environmentStatusConfig: Record<EnvironmentStatus, { 
  label: string; 
  color: string; 
  icon: string 
}> = {
  starting: { label: 'Starting', color: 'text-warning', icon: '⏳' },
  ready: { label: 'Ready', color: 'text-success', icon: '✓' },
  stopped: { label: 'Stopped', color: 'text-muted-foreground', icon: '⏹' },
  error: { label: 'Error', color: 'text-destructive', icon: '✕' },
};

function EnvironmentPanel({ 
  environment 
}: { 
  environment: AuditUISnapshot['environment'] 
}) {
  if (!environment) {
    return (
      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
        <Server className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Environment Offline
        </span>
      </div>
    );
  }
  
  const config = environmentStatusConfig[environment.status];
  const sanitizedEndpoint = environment.endpoint 
    ? sanitizeUrl(environment.endpoint) 
    : null;
  
  // Calculate time remaining if expiresAt exists
  const now = Date.now();
  const timeRemaining = environment.expiresAt 
    ? Math.max(0, environment.expiresAt - now) 
    : null;
  
  return (
    <div className="p-3 bg-muted/30 rounded-md border border-border space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Challenge Environment</span>
        </div>
        <Badge 
          variant="outline" 
          className={cn('text-xs', config.color)}
        >
          {config.icon} {config.label}
        </Badge>
      </div>
      
      {sanitizedEndpoint && (
        <div className="text-xs font-mono text-muted-foreground truncate">
          {escapeHtml(sanitizedEndpoint)}
        </div>
      )}
      
      {timeRemaining !== null && timeRemaining > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            Expires in {Math.floor(timeRemaining / 60000)}m
          </span>
        </div>
      )}
      
      {environment.status === 'stopped' && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="h-3 w-3" />
          <span>Environment was unavailable during replay</span>
        </div>
      )}
    </div>
  );
}

function InputStateDisplay({ 
  inputState 
}: { 
  inputState: Record<string, unknown> 
}) {
  const entries = Object.entries(inputState);
  
  if (entries.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No input state captured
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {entries.map(([key, value]) => (
        <div key={key} className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground font-medium uppercase">
            {escapeHtml(key)}
          </label>
          <div className="font-mono text-sm bg-muted/50 px-3 py-2 rounded-md border border-border text-foreground">
            {/* Safely render value as string */}
            {typeof value === 'string' 
              ? escapeHtml(value) || <span className="text-muted-foreground italic">empty</span>
              : JSON.stringify(value)}
          </div>
        </div>
      ))}
    </div>
  );
}

export function AuditReplayView({
  snapshot,
  sessionStartTime,
  currentTime,
  isLoading = false,
}: AuditReplayViewProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-background/50">
        <div className="text-center space-y-2">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }
  
  if (!snapshot) {
    return (
      <div className="flex items-center justify-center h-full bg-background/50">
        <div className="text-center space-y-2">
          <Monitor className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">No snapshot available</p>
        </div>
      </div>
    );
  }
  
  const relativeTime = snapshot.timestamp - sessionStartTime;
  const isCurrentSnapshot = Math.abs(relativeTime - currentTime) < 30000; // Within 30s
  
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header: Current Route */}
      <div className="px-4 py-3 border-b border-border bg-card flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <code className="font-mono text-sm">
            {escapeHtml(snapshot.route)}
          </code>
        </div>
        
        <Badge 
          variant={isCurrentSnapshot ? 'default' : 'outline'}
          className="text-xs"
        >
          {isCurrentSnapshot ? 'Live' : 'Historical'}
        </Badge>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Environment Status */}
        <EnvironmentPanel environment={snapshot.environment} />
        
        <Separator />
        
        {/* Input State */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FormInput className="h-4 w-4" />
              Captured Input State
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InputStateDisplay inputState={snapshot.inputState} />
          </CardContent>
        </Card>
        
        {/* Scroll Position */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Scroll Position</span>
            <span className="font-mono">{snapshot.scrollY}px</span>
          </div>
          <Progress 
            value={Math.min(100, (snapshot.scrollY / 1000) * 100)} 
            className="h-1"
          />
        </div>
      </div>
      
      {/* Read-only Overlay Indicator */}
      <div className="px-4 py-2 bg-muted/30 border-t border-border flex items-center justify-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-xs text-muted-foreground">
          🔒 Audit Mode — Read Only
        </span>
      </div>
    </div>
  );
}
