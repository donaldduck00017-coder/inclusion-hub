/**
 * Audit Mode Page
 * 
 * Security forensics interface for session replay.
 * Accessible only to admin and instructor roles.
 */

import { useParams, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useAuditSession } from '@/hooks/useAuditSession';
import { StudentLayout } from '@/components/shared/StudentLayout';
import {
  AuditSummaryBar,
  AuditPlaybackControls,
  AuditReplayView,
  AuditTimelinePanel,
} from '@/components/audit';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

// Default session for demo when no ID provided
const DEMO_SESSION_ID = 'session-001';

export default function AuditMode() {
  const { sessionId } = useParams<{ sessionId?: string }>();
  const { user } = useAuthStore();
  
  // Use demo session if no ID provided
  const activeSessionId = sessionId || DEMO_SESSION_ID;
  
  const {
    session,
    events,
    detections,
    activeSnapshot,
    playbackTime,
    playbackSpeed,
    isPlaying,
    loading,
    error,
    sessionDuration,
    totalAttempts,
    hintsUsed,
    detectionCount,
    highestSeverity,
    play,
    pause,
    reset,
    jumpToDetection,
    jumpToTime,
    setSpeed,
  } = useAuditSession({ sessionId: activeSessionId });
  
  // Additional role check (ProtectedRoute already handles this, but defense in depth)
  if (user && !['admin', 'instructor'].includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return (
    <StudentLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="m-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Summary Bar */}
        <AuditSummaryBar
          sessionId={activeSessionId}
          duration={sessionDuration}
          totalAttempts={totalAttempts}
          hintsUsed={hintsUsed}
          detectionCount={detectionCount}
          highestSeverity={highestSeverity}
          isLoading={loading}
        />
        
        {/* Main Content: Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: Replay View */}
          <div className="w-1/2 border-r border-border overflow-hidden">
            <AuditReplayView
              snapshot={activeSnapshot}
              sessionStartTime={session?.startTime || 0}
              currentTime={playbackTime}
              isLoading={loading}
            />
          </div>
          
          {/* Right Panel: Timeline */}
          <div className="w-1/2 overflow-hidden">
            <AuditTimelinePanel
              events={events}
              detections={detections}
              sessionStartTime={session?.startTime || 0}
              currentTime={playbackTime}
              onJumpToDetection={jumpToDetection}
              onJumpToTime={jumpToTime}
            />
          </div>
        </div>
        
        {/* Playback Controls */}
        <AuditPlaybackControls
          isPlaying={isPlaying}
          currentTime={playbackTime}
          duration={sessionDuration}
          speed={playbackSpeed}
          onPlay={play}
          onPause={pause}
          onSeek={jumpToTime}
          onSpeedChange={setSpeed}
          onReset={reset}
          disabled={loading || !session}
        />
      </div>
    </StudentLayout>
  );
}
