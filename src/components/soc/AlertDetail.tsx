/**
 * Alert Detail Component
 * 
 * Shows detailed information for a selected alert including:
 * - Full description
 * - Trigger details
 * - Recommended action
 * - Analyst notes
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAlertStore } from '@/store/alertStore';
import { useAuthStore } from '@/store/authStore';
import type { AlertSeverity, AlertStatus } from '@/types';
import {
  Shield,
  Clock,
  User,
  Target,
  Lightbulb,
  MessageSquare,
  Check,
  ArrowUp,
  X,
  ExternalLink,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { motion } from 'framer-motion';

interface AlertDetailProps {
  alertId: string;
}

export function AlertDetail({ alertId }: AlertDetailProps) {
  const { getAlertById, getNotesForAlert, addNote, acknowledgeAlert, escalateAlert, resolveAlert, ignoreAlert } = useAlertStore();
  const { user } = useAuthStore();
  const [noteContent, setNoteContent] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  const alert = getAlertById(alertId);
  const notes = getNotesForAlert(alertId);

  if (!alert) {
    return (
      <Card className="cyber-card glow-border">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Alert not found</p>
        </CardContent>
      </Card>
    );
  }

  const severityColors: Record<AlertSeverity, string> = {
    CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/30',
    HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    MEDIUM: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    LOW: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  };

  const statusColors: Record<AlertStatus, string> = {
    NEW: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    ACKNOWLEDGED: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    ESCALATED: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    RESOLVED: 'bg-green-500/10 text-green-400 border-green-500/30',
    IGNORED: 'bg-muted text-muted-foreground border-muted',
  };

  const handleAddNote = () => {
    if (!noteContent.trim() || !user) return;

    addNote(alertId, {
      authorId: user.id,
      authorRole: user.role,
      content: noteContent,
      tags: [],
    });

    setNoteContent('');
    setIsAddingNote(false);
  };

  return (
    <Card className="cyber-card glow-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={severityColors[alert.severity]}>
                {alert.severity}
              </Badge>
              <Badge variant="outline" className={statusColors[alert.status]}>
                {alert.status}
              </Badge>
            </div>
            <CardTitle className="text-lg">{alert.title}</CardTitle>
          </div>
          
          <div className="text-right text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
            </div>
            <div className="font-mono mt-1">
              {format(alert.timestamp, 'HH:mm:ss')}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Description
          </h4>
          <p className="text-sm">{alert.description}</p>
        </div>

        <Separator />

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <User className="w-3 h-3" />
              User
            </div>
            <p className="font-mono">{alert.userId}</p>
          </div>

          {alert.challengeId && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground text-xs">
                <Target className="w-3 h-3" />
                Challenge
              </div>
              <p className="font-mono">{alert.challengeId}</p>
            </div>
          )}

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <Shield className="w-3 h-3" />
              Rule
            </div>
            <p className="font-mono text-xs">{alert.triggeredBy}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              Confidence
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all confidence-bar"
                  style={{ width: `${alert.confidenceScore}%` }}
                />
              </div>
              <span className="text-xs font-mono">{alert.confidenceScore}%</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Recommended Action */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Lightbulb className="w-3 h-3" />
            Recommended Action
          </h4>
          <p className="text-sm text-primary bg-primary/5 p-3 rounded-lg border border-primary/20">
            {alert.recommendedAction}
          </p>
        </div>

        {/* Quick Actions */}
        {alert.status !== 'RESOLVED' && alert.status !== 'IGNORED' && (
          <>
            <Separator />
            <div className="flex flex-wrap gap-2">
              {alert.status === 'NEW' && (
                <Button size="sm" variant="outline" onClick={() => acknowledgeAlert(alertId)}>
                  <Check className="w-3 h-3 mr-1" />
                  Acknowledge
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => escalateAlert(alertId)}>
                <ArrowUp className="w-3 h-3 mr-1" />
                Escalate
              </Button>
              <Button size="sm" variant="outline" className="text-green-500" onClick={() => resolveAlert(alertId)}>
                <Check className="w-3 h-3 mr-1" />
                Resolve
              </Button>
              <Button size="sm" variant="ghost" onClick={() => ignoreAlert(alertId)}>
                <X className="w-3 h-3 mr-1" />
                Ignore
              </Button>
            </div>
          </>
        )}

        <Separator />

        {/* Notes Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              Analyst Notes ({notes.length})
            </h4>
            {!isAddingNote && (
              <Button size="sm" variant="ghost" onClick={() => setIsAddingNote(true)}>
                Add Note
              </Button>
            )}
          </div>

          {isAddingNote && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              <Textarea
                placeholder="Enter your analysis notes..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddNote} disabled={!noteContent.trim()}>
                  Save Note
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsAddingNote(false)}>
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}

          <ScrollArea className="max-h-[200px]">
            <div className="space-y-2">
              {notes.map((note) => (
                <div key={note.id} className="p-3 bg-muted/30 rounded-lg text-sm">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <span className="font-mono">{note.authorId.slice(0, 12)}</span>
                    <span>•</span>
                    <span>{note.authorRole}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(note.createdAt, { addSuffix: true })}</span>
                  </div>
                  <p>{note.content}</p>
                  {note.outcome && (
                    <Badge variant="outline" className="mt-2">
                      {note.outcome.replace('_', ' ')}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Session Replay Link */}
        {alert.sessionId && (
          <>
            <Separator />
            <Button variant="outline" className="w-full" size="sm">
              <ExternalLink className="w-3 h-3 mr-2" />
              Open Session Replay
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
