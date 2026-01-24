import { BookOpen, Shield, MonitorDot } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TutorMode } from "@/types/tutor";

interface TutorModeToggleProps {
  mode: TutorMode;
  onModeChange: (mode: TutorMode) => void;
}

const modes: Array<{
  id: TutorMode;
  label: string;
  icon: typeof BookOpen;
  description: string;
}> = [
  {
    id: "learning",
    label: "Learning",
    icon: BookOpen,
    description: "Concept explanations",
  },
  {
    id: "defensive",
    label: "Defensive",
    icon: Shield,
    description: "Defense strategies",
  },
  {
    id: "soc",
    label: "SOC",
    icon: MonitorDot,
    description: "Analyst perspective",
  },
];

export function TutorModeToggle({ mode, onModeChange }: TutorModeToggleProps) {
  return (
    <div className="px-4 py-3 border-b border-border/30">
      <div className="flex items-center gap-1 p-1 bg-muted/40 rounded-lg">
        {modes.map(({ id, label, icon: Icon }) => {
          const isActive = mode === id;
          return (
            <button
              key={id}
              onClick={() => onModeChange(id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
              style={isActive ? { boxShadow: "0 0 12px hsl(var(--primary) / 0.3)" } : undefined}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
