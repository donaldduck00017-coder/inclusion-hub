import { Bot, X, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TutorContext } from "@/hooks/useTutor";

interface TutorHeaderProps {
  context: TutorContext;
  onClose: () => void;
}

export function TutorHeader({ context, onClose }: TutorHeaderProps) {
  const shortSessionId = context.sessionId.slice(-6);

  return (
    <div className="flex items-center justify-between p-4 border-b border-border/50">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/30">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-success animate-pulse" 
               style={{ boxShadow: "0 0 8px hsl(var(--success))" }} />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">AI Tutor</span>
            <Badge 
              variant="outline" 
              className="text-[10px] px-1.5 py-0 h-4 border-warning/50 text-warning bg-warning/10"
            >
              <Sparkles className="w-2.5 h-2.5 mr-1" />
              Mock Mode
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <span className="truncate max-w-[140px]">{context.challengeName}</span>
            <span className="text-border">•</span>
            <span className="text-primary/70">#{shortSessionId}</span>
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-destructive/10"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
