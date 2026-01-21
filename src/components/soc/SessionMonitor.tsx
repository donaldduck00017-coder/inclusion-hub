/**
 * Session Monitor Component
 * 
 * Live view of active sessions showing:
 * - Current page
 * - Time on task
 * - Attempt counts
 * - Hint usage
 * - Event timeline
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { mockSOCService } from '@/services/mockSOCService';
import type { SessionSnapshot } from '@/types';
import {
  Eye,
  Clock,
  Target,
  Lightbulb,
  Send,
  Activity,
  User,
  ExternalLink,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface SessionMonitorProps {
  limit?: number;
  compact?: boolean;
}

export function SessionMonitor({ limit, compact = false }: SessionMonitorProps) {
  const [sessions, setSessions] = useState<SessionSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  useEffect(() => {
    const loadSessions = async () => {
      setIsLoading(true);
      try {
        const data = await mockSOCService.getActiveSessions();
        setSessions(data);
      } catch (error) {
        console.error('[SOC] Failed to load sessions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSessions();

    // Refresh periodically
    const interval = setInterval(loadSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  const displaySessions = limit ? sessions.slice(0, limit) : sessions;

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderSession = (session: SessionSnapshot) => {
    const isSelected = session.sessionId === selectedSession;

    return (
      <motion.div
        key={session.sessionId}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`
          p-4 rounded-lg border border-border cursor-pointer transition-all
          ${isSelected ? 'bg-primary/5 border-primary/30' : 'bg-card hover:bg-accent/5'}
        `}
        onClick={() => setSelectedSession(isSelected ? null : session.sessionId)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${session.isActive ? 'bg-green-500 animate-pulse' : 'bg-muted'}`} />
            <span className="font-mono text-sm">{session.userId.slice(0, 12)}</span>
          </div>
          <Badge variant="outline" className={session.isActive ? 'bg-green-500/10 text-green-400 border-green-500/30' : ''}>
            {session.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-muted-foreground" />
            <span className="truncate">{session.challengeId || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>{formatDuration(session.timeOnTask)}</span>
          </div>
        </div>

        {!compact && (
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border">
            <div className="text-center">
              <div className="text-lg font-bold text-primary">{session.attemptCount}</div>
              <div className="text-xs text-muted-foreground">Attempts</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-400">{session.hintsUsed}</div>
              <div className="text-xs text-muted-foreground">Hints</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{session.events.length}</div>
              <div className="text-xs text-muted-foreground">Events</div>
            </div>
          </div>
        )}

        {isSelected && !compact && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 pt-4 border-t border-border space-y-3"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Current Page</span>
              <span className="font-mono">{session.currentPage}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Session Start</span>
              <span>{formatDistanceToNow(session.startTime, { addSuffix: true })}</span>
            </div>
            
            <Button variant="outline" size="sm" className="w-full">
              <ExternalLink className="w-3 h-3 mr-2" />
              Open Session Replay
            </Button>
          </motion.div>
        )}
      </motion.div>
    );
  };

  return (
    <Card className="cyber-card glow-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            Active Sessions
          </CardTitle>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            {sessions.filter(s => s.isActive).length} Live
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted/30 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <ScrollArea className={compact ? 'h-[300px]' : 'h-[500px]'}>
            {displaySessions.length === 0 ? (
              <div className="text-center py-8">
                <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No active sessions</p>
              </div>
            ) : (
              <div className="space-y-3 pr-4">
                {displaySessions.map(renderSession)}
              </div>
            )}
          </ScrollArea>
        )}

        {limit && sessions.length > limit && (
          <div className="pt-4 text-center">
            <Button variant="ghost" size="sm">
              View all {sessions.length} sessions
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
