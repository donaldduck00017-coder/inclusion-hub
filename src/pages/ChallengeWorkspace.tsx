import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StudentLayout } from '@/components/shared/StudentLayout';
import { WorkspaceShell } from '@/components/student/workspace';
import { TutorPanel } from '@/components/tutor';
import { useChallengeSession } from '@/hooks/useChallengeSession';
import { mockChallengeService } from '@/services/mockChallengeService';
import { useAuthStore } from '@/store/authStore';
import type { Challenge } from '@/types';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';


const ChallengeWorkspace = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);

  // Initialize session tracking
  const { 
    sessionId, 
    trackSubmission, 
    trackHintUsed 
  } = useChallengeSession(id || '', user?.id || 'anonymous');

  // Load challenge data
  useEffect(() => {
    const loadChallenge = async () => {
      if (!id) {
        setError('No challenge ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await mockChallengeService.getChallenge(id);
        
        if (!data) {
          setError('Challenge not found');
        } else {
          setChallenge(data);
        }
      } catch (err) {
        setError('Failed to load challenge');
      } finally {
        setLoading(false);
      }
    };

    loadChallenge();
  }, [id]);

  // Handle submission with telemetry
  const handleSubmit = useCallback(async (answer: string) => {
    if (!challenge) return { correct: false, feedback: 'No challenge loaded' };
    
    const attemptId = `attempt_${Date.now()}`;
    setAttemptCount(prev => prev + 1);
    
    // Track submission (metadata only - no raw answer)
    trackSubmission(answer.length, attemptCount + 1);
    
    try {
      const result = await mockChallengeService.submitAnswer(
        challenge.id,
        answer,
        attemptId
      );
      
      return {
        correct: result.correct,
        feedback: result.feedback,
      };
    } catch (err) {
      return {
        correct: false,
        feedback: 'Submission failed. Please try again.',
      };
    }
  }, [challenge, attemptCount, trackSubmission]);

  // Handle hint reveal with telemetry
  const handleHintReveal = useCallback((level: number) => {
    trackHintUsed(level);
  }, [trackHintUsed]);

  // Loading state
  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Loading challenge...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  // Error state
  if (error || !challenge) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center space-y-4 max-w-md">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold">Challenge Not Found</h2>
            <p className="text-muted-foreground">
              {error || 'The requested challenge could not be loaded.'}
            </p>
            <Button onClick={() => navigate('/challenges')} className="cyber-button">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Challenges
            </Button>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <WorkspaceShell
        challenge={challenge}
        sessionId={sessionId}
        onSubmit={handleSubmit}
        onHintReveal={handleHintReveal}
      />
      <TutorPanel />
    </StudentLayout>
  );
};

export default ChallengeWorkspace;
