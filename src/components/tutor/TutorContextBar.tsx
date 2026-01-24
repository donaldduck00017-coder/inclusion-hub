import { Clock, Target, Lightbulb, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { TutorTelemetry } from "@/hooks/useTutor";

interface TutorContextBarProps {
  telemetry: TutorTelemetry;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getSeverityColor(severity: "LOW" | "MEDIUM" | "HIGH"): string {
  switch (severity) {
    case "LOW":
      return "text-primary bg-primary/10 border-primary/30";
    case "MEDIUM":
      return "text-warning bg-warning/10 border-warning/30";
    case "HIGH":
      return "text-destructive bg-destructive/10 border-destructive/30";
    default:
      return "text-muted-foreground bg-muted/10 border-muted/30";
  }
}

function getSeverityGlow(severity: "LOW" | "MEDIUM" | "HIGH"): string {
  switch (severity) {
    case "LOW":
      return "0 0 6px hsl(var(--primary) / 0.4)";
    case "MEDIUM":
      return "0 0 6px hsl(var(--warning) / 0.4)";
    case "HIGH":
      return "0 0 6px hsl(var(--destructive) / 0.4)";
    default:
      return "none";
  }
}

export function TutorContextBar({ telemetry }: TutorContextBarProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b border-border/30">
        {/* Metrics Row */}
        <div className="flex items-center gap-4">
          {/* Time on Task */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 text-xs">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span className="font-mono text-foreground">{formatTime(telemetry.timeOnTask)}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Time on task
            </TooltipContent>
          </Tooltip>

          <div className="w-px h-4 bg-border/50" />

          {/* Attempts */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 text-xs">
                <Target className="w-3.5 h-3.5 text-cyber-blue" style={{ color: "hsl(217 91% 60%)" }} />
                <span className="font-mono text-foreground">{telemetry.attempts}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Submission attempts
            </TooltipContent>
          </Tooltip>

          <div className="w-px h-4 bg-border/50" />

          {/* Hints Used */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 text-xs">
                <Lightbulb className="w-3.5 h-3.5 text-warning" />
                <span className="font-mono text-foreground">{telemetry.hintsUsed}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Hints used
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Detection Signals */}
        <div className="flex items-center gap-2">
          {telemetry.detectionSignals.length > 0 ? (
            telemetry.detectionSignals.map((signal, index) => (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <div
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${getSeverityColor(signal.severity)}`}
                    style={{ boxShadow: getSeverityGlow(signal.severity) }}
                  >
                    <AlertTriangle className="w-2.5 h-2.5" />
                    <span className="uppercase">{signal.severity}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs max-w-[200px]">
                  <span className="font-medium">Detection Signal:</span>{" "}
                  {signal.type.replace(/_/g, " ")}
                </TooltipContent>
              </Tooltip>
            ))
          ) : (
            <span className="text-[10px] text-muted-foreground">No signals</span>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
