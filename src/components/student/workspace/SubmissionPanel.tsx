import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, CheckCircle2, XCircle, Loader2, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SubmissionPanelProps {
  challengeId: string;
  onSubmit: (answer: string) => Promise<{ correct: boolean; feedback: string }>;
}

type SubmissionState = 'idle' | 'submitting' | 'success' | 'failure';

interface SubmissionResult {
  correct: boolean;
  feedback: string;
}

/**
 * Submission Panel
 * 
 * Handles answer submission with:
 * - Input validation
 * - Loading states
 * - Success/failure feedback
 * - Telemetry integration via parent callback
 */
export const SubmissionPanel = ({ challengeId, onSubmit }: SubmissionPanelProps) => {
  const [answer, setAnswer] = useState('');
  const [state, setState] = useState<SubmissionState>('idle');
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);

  const handleSubmit = async () => {
    if (!answer.trim() || state === 'submitting') return;

    setState('submitting');
    setAttemptCount(prev => prev + 1);

    try {
      const submissionResult = await onSubmit(answer);
      setResult(submissionResult);
      setState(submissionResult.correct ? 'success' : 'failure');
    } catch (error) {
      setResult({ correct: false, feedback: 'Submission failed. Please try again.' });
      setState('failure');
    }
  };

  const handleReset = () => {
    setAnswer('');
    setState('idle');
    setResult(null);
  };

  return (
    <Card className="cyber-card glow-border flex-1 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Analysis Submission
            </CardTitle>
          </div>
          {attemptCount > 0 && (
            <Badge variant="outline" className="bg-muted text-muted-foreground text-xs">
              Attempt {attemptCount}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4">
        <div className="flex-1 flex flex-col">
          <Textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Enter your analysis findings..."
            className="flex-1 min-h-[200px] bg-background/50 border-border focus:border-primary resize-none font-mono text-sm"
            disabled={state === 'submitting' || state === 'success'}
          />
          
          <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
            <span>{answer.length} characters</span>
            <span className="font-mono">ID: {challengeId.slice(0, 8)}</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-lg border ${
                result.correct 
                  ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                  : 'bg-destructive/10 border-destructive/30 text-destructive'
              }`}
            >
              <div className="flex items-start gap-3">
                {result.correct ? (
                  <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <p className="font-medium mb-1">
                    {result.correct ? 'Correct!' : 'Incorrect'}
                  </p>
                  <p className="text-sm opacity-80">{result.feedback}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2">
          {state === 'success' ? (
            <Button
              onClick={handleReset}
              variant="outline"
              className="flex-1 cyber-button"
            >
              Try Another
            </Button>
          ) : (
            <>
              <Button
                onClick={handleSubmit}
                disabled={!answer.trim() || state === 'submitting'}
                className="flex-1 cyber-button bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {state === 'submitting' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Analysis
                  </>
                )}
              </Button>
              {state === 'failure' && (
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="cyber-button"
                >
                  Reset
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
