/**
 * TutorSuggestions Component
 * 
 * Displays suggested prompts based on challenge category and mode.
 */

import { cn } from "@/lib/utils";

interface TutorSuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  isLoading: boolean;
}

export function TutorSuggestions({ suggestions, onSelect, isLoading }: TutorSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="px-4 py-3 border-t border-border/30">
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onSelect(suggestion)}
            disabled={isLoading}
            className={cn(
              "px-2.5 py-1 text-[11px] rounded-md border transition-all duration-200",
              "border-border/50 text-muted-foreground bg-muted/20",
              "hover:border-primary/50 hover:text-primary hover:bg-primary/5",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "focus:outline-none focus:ring-1 focus:ring-primary/50"
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
