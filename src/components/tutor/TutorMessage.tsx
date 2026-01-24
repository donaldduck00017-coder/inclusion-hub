/**
 * TutorMessage Component
 * 
 * Renders individual chat messages with category-aware styling.
 * Detection-triggered responses have special visual treatment.
 */

import { Bot, User, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TutorMessage as TutorMessageType, MessageSeverity, ChallengeCategory } from "@/types/tutor";

interface TutorMessageProps {
  message: TutorMessageType;
}

// Severity-based styling
function getSeverityStyles(severity?: MessageSeverity): {
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

// Category badge colors
function getCategoryColor(category?: ChallengeCategory): string {
  const colors: Record<ChallengeCategory, string> = {
    phishing: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    malware: "bg-red-500/20 text-red-400 border-red-500/30",
    network: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    cryptography: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    "web-security": "bg-green-500/20 text-green-400 border-green-500/30",
    forensics: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    "social-engineering": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  };
  return category ? colors[category] : "";
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Simple markdown-like parsing for bold text
function renderContent(content: string): React.ReactNode {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export function TutorMessage({ message }: TutorMessageProps) {
  const isTutor = message.role === "tutor";
  const styles = isTutor ? getSeverityStyles(message.severity) : null;

  return (
    <div
      className={cn(
        "flex gap-3",
        isTutor ? "justify-start" : "justify-end"
      )}
    >
      {/* Tutor Avatar */}
      {isTutor && (
        <div className="flex-shrink-0 w-7 h-7 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center">
          <Bot className="w-4 h-4 text-primary" />
        </div>
      )}

      {/* Message Bubble */}
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
        {/* Detection Triggered Indicator */}
        {isTutor && message.detectionTriggered && (
          <div className="flex items-center gap-1.5 mb-2 text-[10px] text-warning">
            <Zap className="w-3 h-3" />
            <span className="uppercase font-medium">Detection-Triggered Response</span>
          </div>
        )}

        {/* Message Content */}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {renderContent(message.content)}
        </p>

        {/* Footer: Timestamp, Category, Severity */}
        <div className="flex items-center justify-between gap-2 mt-1.5">
          <div className="flex items-center gap-2">
            {/* Category Badge */}
            {isTutor && message.category && (
              <span className={cn(
                "text-[9px] px-1.5 py-0.5 rounded border uppercase font-medium",
                getCategoryColor(message.category)
              )}>
                {message.category}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Severity Indicator */}
            {isTutor && message.severity && message.severity !== "info" && (
              <div
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  styles?.indicator
                )}
                style={{ boxShadow: styles?.glow }}
              />
            )}
            {/* Timestamp */}
            <span className="text-[10px] text-muted-foreground font-mono">
              {formatTimestamp(message.timestamp)}
            </span>
          </div>
        </div>
      </div>

      {/* User Avatar */}
      {!isTutor && (
        <div className="flex-shrink-0 w-7 h-7 rounded-md bg-secondary border border-border flex items-center justify-center">
          <User className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

export default TutorMessage;
