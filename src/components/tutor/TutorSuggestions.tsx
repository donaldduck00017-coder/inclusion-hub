/**
 * TutorSuggestions Component
 * 
 * Displays suggested prompts based on challenge category and mode.
 * Each mode (Learning, Defensive, SOC) has unique questions.
 */

import { Lightbulb, Shield, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TutorMode } from "@/types/tutor";

interface TutorSuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  isLoading: boolean;
  mode?: TutorMode;
}

const modeConfig: Record<TutorMode, { icon: React.ElementType; label: string; color: string }> = {
  learning: {
    icon: Lightbulb,
    label: "Learning Mode Tips",
    color: "text-blue-400",
  },
  defensive: {
    icon: Shield,
    label: "Defensive Mode Tips",
    color: "text-green-400",
  },
  soc: {
    icon: Radio,
    label: "SOC Analyst Tips",
    color: "text-orange-400",
  },
};

export function TutorSuggestions({ 
  suggestions, 
  onSelect, 
  isLoading, 
  mode = "learning" 
}: TutorSuggestionsProps) {
  if (suggestions.length === 0) return null;

  const config = modeConfig[mode];
  const Icon = config.icon;

  return (
    <div className="px-4 py-3 border-t border-border/30 bg-muted/5">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("w-3.5 h-3.5", config.color)} />
        <span className={cn("text-[10px] font-medium uppercase tracking-wide", config.color)}>
          {config.label}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((suggestion, index) => (
          <button
            key={`${mode}-${index}`}
            onClick={() => onSelect(suggestion)}
            disabled={isLoading}
            className={cn(
              "px-2.5 py-1.5 text-[11px] rounded-md border transition-all duration-200",
              "border-border/40 text-muted-foreground bg-background/50",
              "hover:border-primary/50 hover:text-primary hover:bg-primary/5",
              "hover:shadow-[0_0_8px_hsl(var(--primary)/0.2)]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "focus:outline-none focus:ring-1 focus:ring-primary/50",
              "text-left leading-tight"
            )}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

export default TutorSuggestions;
