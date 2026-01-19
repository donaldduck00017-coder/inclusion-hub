import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Lock, Unlock, ChevronDown, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface HintsPanelProps {
  hints: string[];
  hintsRevealed: number;
  onRevealHint: (level: number) => void;
}

/**
 * Hints Panel
 * 
 * Progressive hint reveal system:
 * - 3-tier hints (mild → moderate → major)
 * - Confirmation before reveal
 * - Telemetry integration via parent callback
 * 
 * Behavioral signal: hint usage indicates struggle
 */
export const HintsPanel = ({ hints, hintsRevealed, onRevealHint }: HintsPanelProps) => {
  const [expandedHint, setExpandedHint] = useState<number | null>(null);

  const getHintLabel = (index: number) => {
    switch (index) {
      case 0: return 'Direction';
      case 1: return 'Approach';
      case 2: return 'Solution Path';
      default: return `Hint ${index + 1}`;
    }
  };

  const getHintCost = (index: number) => {
    // Higher hints = more point reduction (simulated)
    return (index + 1) * 10;
  };

  return (
    <Card className="cyber-card glow-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-warning" />
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Assistance
            </CardTitle>
          </div>
          <Badge variant="outline" className="bg-muted text-muted-foreground text-xs">
            {hintsRevealed}/{hints.length} used
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {hints.map((hint, index) => {
          const isRevealed = index < hintsRevealed;
          const isNext = index === hintsRevealed;
          const isLocked = index > hintsRevealed;

          return (
            <div key={index} className="space-y-2">
              <div
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  isRevealed
                    ? 'bg-warning/10 border-warning/30'
                    : isNext
                    ? 'bg-muted/50 border-border hover:border-warning/50 cursor-pointer'
                    : 'bg-muted/20 border-border/50 opacity-60'
                }`}
                onClick={() => isRevealed && setExpandedHint(expandedHint === index ? null : index)}
              >
                <div className="flex items-center gap-3">
                  {isRevealed ? (
                    <Unlock className="w-4 h-4 text-warning" />
                  ) : (
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{getHintLabel(index)}</p>
                    <p className="text-xs text-muted-foreground">
                      {isRevealed ? 'Click to expand' : `-${getHintCost(index)}% points`}
                    </p>
                  </div>
                </div>

                {isRevealed ? (
                  <ChevronDown 
                    className={`w-4 h-4 text-muted-foreground transition-transform ${
                      expandedHint === index ? 'rotate-180' : ''
                    }`}
                  />
                ) : isNext ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-xs h-7 hover:bg-warning/20 hover:text-warning hover:border-warning/50"
                      >
                        Reveal
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="cyber-card border-border">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-warning" />
                          Reveal Hint?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Using this hint will reduce your potential score by {getHintCost(index)}%. 
                          This action is logged for learning analytics.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-muted hover:bg-muted/80">
                          Keep Trying
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onRevealHint(index)}
                          className="bg-warning text-warning-foreground hover:bg-warning/90"
                        >
                          Reveal Hint
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : null}
              </div>

              <AnimatePresence>
                {isRevealed && expandedHint === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 bg-warning/5 rounded-lg border border-warning/20 ml-7">
                      <p className="text-sm text-foreground/80 font-mono">{hint}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {hintsRevealed === hints.length && (
          <div className="p-3 bg-muted/30 rounded-lg border border-border text-center">
            <p className="text-xs text-muted-foreground">
              All hints revealed. Good luck with your analysis!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
