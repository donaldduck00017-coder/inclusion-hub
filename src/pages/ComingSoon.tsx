import { Construction, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ComingSoonProps {
  feature: string;
  phase?: string;
  description?: string;
}

export function ComingSoon({ 
  feature, 
  phase = "Phase X", 
  description = "This feature is coming soon" 
}: ComingSoonProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-6">
        <div className="relative">
          <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Construction className="w-12 h-12 text-primary animate-pulse" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-warning/20 rounded-full flex items-center justify-center">
            <span className="text-lg">🚧</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">{feature}</h1>
          <p className="text-muted-foreground text-lg">{description}</p>
        </div>
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border">
          <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
          <span className="text-sm text-muted-foreground">
            Currently in development — {phase}
          </span>
        </div>

        <Button 
          variant="outline" 
          onClick={() => navigate("/dashboard")}
          className="mt-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
