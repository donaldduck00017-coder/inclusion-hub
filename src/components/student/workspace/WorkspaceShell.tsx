import { useState } from 'react';
import type { Challenge } from '@/types';
import { SubmissionPanel } from './SubmissionPanel';
import { HintsPanel } from './HintsPanel';
import { TelemetryPanel } from './TelemetryPanel';
import { useFeatureStore } from '@/store/featureStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Clock, Target, AlertTriangle, FileText } from 'lucide-react';

interface WorkspaceShellProps {
  challenge: Challenge;
  sessionId: string | null;
  onSubmit: (answer: string) => Promise<{ correct: boolean; feedback: string }>;
  onHintReveal: (level: number) => void;
}

/**
 * Challenge Workspace Layout
 * 
 * Grid layout mimicking a SOC investigation console:
 * | Evidence / Scenario | Target Panel | Hints / Telemetry |
 */
export const WorkspaceShell = ({ 
  challenge, 
  sessionId,
  onSubmit, 
  onHintReveal 
}: WorkspaceShellProps) => {
  const { flags } = useFeatureStore();
  const [hintsRevealed, setHintsRevealed] = useState(0);

  const handleHintReveal = (level: number) => {
    setHintsRevealed(level + 1);
    onHintReveal(level);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'advanced': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'expert': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="h-[calc(100vh-4rem)] grid grid-cols-1 lg:grid-cols-12 gap-4 p-4">
      {/* Left Panel: Evidence / Scenario */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <div className="cyber-card p-4 glow-border">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Scenario Brief
            </h2>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline" className={getDifficultyColor(challenge.difficulty)}>
              {challenge.difficulty}
            </Badge>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              {getCategoryLabel(challenge.category)}
            </Badge>
            <Badge variant="outline" className="bg-muted text-muted-foreground">
              <Target className="w-3 h-3 mr-1" />
              {challenge.points} pts
            </Badge>
            <Badge variant="outline" className="bg-muted text-muted-foreground">
              <Clock className="w-3 h-3 mr-1" />
              {challenge.estimatedTime} min
            </Badge>
          </div>

          <h1 className="text-xl font-bold mb-2">{challenge.title}</h1>
          <p className="text-muted-foreground text-sm">{challenge.description}</p>
        </div>

        <div className="cyber-card flex-1 p-4 glow-border">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Investigation Details
            </h2>
          </div>
          
          <ScrollArea className="h-[calc(100%-3rem)]">
            <div className="prose prose-invert prose-sm max-w-none">
              <pre className="font-mono text-xs bg-background/50 p-4 rounded-lg border border-border whitespace-pre-wrap">
                {challenge.instructions}
              </pre>
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Center Panel: Target / Submission */}
      <div className="lg:col-span-4 flex flex-col">
        <SubmissionPanel 
          challengeId={challenge.id}
          onSubmit={onSubmit}
        />
      </div>

      {/* Right Panel: Hints + Telemetry */}
      <div className="lg:col-span-3 flex flex-col gap-4">
        <HintsPanel
          hints={challenge.hints}
          hintsRevealed={hintsRevealed}
          onRevealHint={handleHintReveal}
        />
        
        {/* Telemetry Panel - Dev only via feature flag */}
        {flags.auditMode && (
          <TelemetryPanel sessionId={sessionId} />
        )}
      </div>
    </div>
  );
};
