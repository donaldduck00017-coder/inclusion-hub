/**
 * TutorInput Component
 * 
 * Chat input with send button and keyboard handling.
 */

import { useState, useCallback } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TutorInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

export function TutorInput({ onSend, isLoading, placeholder = "Ask the tutor..." }: TutorInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleSend = useCallback(() => {
    if (inputValue.trim() && !isLoading) {
      onSend(inputValue);
      setInputValue("");
    }
  }, [inputValue, isLoading, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="p-4 border-t border-border/50 bg-card/50">
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          className={cn(
            "flex-1 bg-muted/30 border-border/50",
            "focus-visible:ring-primary/50 placeholder:text-muted-foreground/50"
          )}
        />
        <Button
          onClick={handleSend}
          disabled={!inputValue.trim() || isLoading}
          size="icon"
          className="bg-primary hover:bg-primary/90"
          style={{ boxShadow: "0 0 10px hsl(var(--primary) / 0.3)" }}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default TutorInput;
