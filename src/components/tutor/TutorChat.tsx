import { useEffect, useRef } from "react";
import { Bot, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TutorMessage } from "./TutorMessage";
import type { TutorMessage as TutorMessageType } from "@/types/tutor";

interface TutorChatProps {
  messages: TutorMessageType[];
  isLoading: boolean;
}

function getSeverityStyles(severity?: TutorMessage["severity"]): {
  border: string;
  bg: string;
  indicator: string;
  glow: string;
} {
  switch (severity) {
    case "concept":
      return {
        border: "border-l-[hsl(217_91%_60%)]",
        bg: "bg-[hsl(217_91%_60%_/_0.05)]",
        indicator: "bg-[hsl(217_91%_60%)]",
        glow: "0 0 8px hsl(217 91% 60% / 0.3)",
      };
    case "warning":
      return {
        border: "border-l-warning",
        bg: "bg-warning/5",
        indicator: "bg-warning",
        glow: "0 0 8px hsl(var(--warning) / 0.3)",
      };
    case "risk":
      return {
        border: "border-l-destructive",
        bg: "bg-destructive/5",
        indicator: "bg-destructive",
        glow: "0 0 8px hsl(var(--destructive) / 0.3)",
      };
    default:
      return {
        border: "border-l-primary/30",
        bg: "bg-transparent",
        indicator: "bg-primary/50",
        glow: "none",
      };
  }
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TutorChat({ messages, isLoading }: TutorChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <ScrollArea className="flex-1 px-4" ref={scrollRef}>
      <div className="py-4 space-y-4">
        {messages.map((message) => {
          const isTutor = message.role === "tutor";
          const styles = isTutor ? getSeverityStyles(message.severity) : null;

          return (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                isTutor ? "justify-start" : "justify-end"
              )}
            >
              {isTutor && (
                <div className="flex-shrink-0 w-7 h-7 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}

              <div
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2.5",
                  isTutor
                    ? cn(
                        "border-l-2 text-foreground",
                        styles?.border,
                        styles?.bg
                      )
                    : "bg-primary/15 text-foreground border border-primary/20"
                )}
                style={isTutor && styles?.glow !== "none" ? { boxShadow: styles.glow } : undefined}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
                <div className="flex items-center justify-end gap-2 mt-1.5">
                  {isTutor && message.severity && message.severity !== "info" && (
                    <div
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        styles?.indicator
                      )}
                      style={{ boxShadow: styles?.glow }}
                    />
                  )}
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {formatTimestamp(message.timestamp)}
                  </span>
                </div>
              </div>

              {!isTutor && (
                <div className="flex-shrink-0 w-7 h-7 rounded-md bg-secondary border border-border flex items-center justify-center">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-7 h-7 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-muted/30 rounded-lg px-4 py-3 border border-border/30">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>Analyzing...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
