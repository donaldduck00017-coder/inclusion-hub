/**
 * System Health Dashboard
 * 
 * Displays real-time health metrics for all platform services,
 * API performance, telemetry pipeline, and feature flags.
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Server,
  Database,
  Shield,
  Cpu,
  Radio,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Zap,
  Clock,
  TrendingUp,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { mockHealthService } from "@/services/mockHealthService";
import { useHealthStore } from "@/store/healthStore";
import type { 
  HealthMetrics, 
  ServiceStatus, 
  HealthStatus,
  TelemetryHealth,
  ApiHealth,
  FeatureHealth,
} from "@/types";

// =====================================================
// STATUS HELPERS
// =====================================================

const statusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  up: { color: "text-green-400", icon: CheckCircle2, label: "Operational" },
  degraded: { color: "text-yellow-400", icon: AlertTriangle, label: "Degraded" },
  down: { color: "text-red-400", icon: XCircle, label: "Down" },
  healthy: { color: "text-green-400", icon: CheckCircle2, label: "Healthy" },
  critical: { color: "text-red-400", icon: XCircle, label: "Critical" },
};

const serviceIcons: Record<string, React.ElementType> = {
  "Authentication": Shield,
  "Challenge Engine": Cpu,
  "Detection Engine": Radio,
  "AI Tutor": Activity,
  "Telemetry Pipeline": TrendingUp,
  "Database": Database,
};

function getStatusBadge(status: string) {
  const config = statusConfig[status] || statusConfig.up;
  const Icon = config.icon;
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "gap-1.5 px-2 py-0.5",
        status === "up" || status === "healthy" 
          ? "border-green-500/50 bg-green-500/10 text-green-400"
          : status === "degraded"
          ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400"
          : "border-red-500/50 bg-red-500/10 text-red-400"
      )}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}

// =====================================================
// SERVICE CARD COMPONENT
// =====================================================

interface ServiceCardProps {
  service: ServiceStatus;
}

function ServiceCard({ service }: ServiceCardProps) {
  const Icon = serviceIcons[service.name] || Server;
  const statusConf = statusConfig[service.status] || statusConfig.up;
  
  return (
    <Card className={cn(
      "glass border-border/50 transition-all duration-300",
      service.status === "down" && "border-red-500/30 shadow-[0_0_20px_hsl(0_70%_50%/0.1)]",
      service.status === "degraded" && "border-yellow-500/30 shadow-[0_0_20px_hsl(45_70%_50%/0.1)]",
      service.status === "up" && "hover:border-primary/30"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              service.status === "up" && "bg-primary/10",
              service.status === "degraded" && "bg-yellow-500/10",
              service.status === "down" && "bg-red-500/10"
            )}>
              <Icon className={cn("w-5 h-5", statusConf.color)} />
            </div>
            <div>
              <h3 className="font-medium text-sm">{service.name}</h3>
              <p className="text-[10px] text-muted-foreground">
                Last check: {new Date(service.lastCheck).toLocaleTimeString()}
              </p>
            </div>
          </div>
          {getStatusBadge(service.status)}
        </div>
        
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="text-center">
            <p className="text-lg font-mono font-bold text-foreground">
              {service.latency || 0}<span className="text-xs text-muted-foreground">ms</span>
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Latency</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-mono font-bold text-foreground">
              {service.uptime?.toFixed(2) || "99.99"}<span className="text-xs text-muted-foreground">%</span>
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Uptime</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-mono font-bold text-foreground">
              {service.errorRate?.toFixed(2) || "0.00"}<span className="text-xs text-muted-foreground">%</span>
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Error Rate</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// =====================================================
// TELEMETRY CARD COMPONENT
// =====================================================

interface TelemetryCardProps {
  telemetry: TelemetryHealth;
}

function TelemetryCard({ telemetry }: TelemetryCardProps) {
  const queuePercentage = (telemetry.queueSize / telemetry.queueCapacity) * 100;
  
  return (
    <Card className="glass border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Telemetry Pipeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Queue Utilization</span>
            <span className="font-mono">{telemetry.queueSize}/{telemetry.queueCapacity}</span>
          </div>
          <Progress 
            value={queuePercentage} 
            className={cn(
              "h-2",
              queuePercentage > 80 ? "[&>div]:bg-red-500" : 
              queuePercentage > 50 ? "[&>div]:bg-yellow-500" : 
              "[&>div]:bg-green-500"
            )}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-muted/20 rounded-lg">
            <p className="text-2xl font-mono font-bold text-primary">
              {(telemetry.eventsProcessed24h / 1000).toFixed(1)}k
            </p>
            <p className="text-[10px] text-muted-foreground">Events (24h)</p>
          </div>
          <div className="p-3 bg-muted/20 rounded-lg">
            <p className={cn(
              "text-2xl font-mono font-bold",
              telemetry.failedFlushes > 5 ? "text-red-400" : "text-green-400"
            )}>
              {telemetry.failedFlushes}
            </p>
            <p className="text-[10px] text-muted-foreground">Failed Flushes</p>
          </div>
        </div>
        
        <Separator className="bg-border/30" />
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Data Minimization</span>
          {telemetry.dataMinimizationActive ? (
            <Badge variant="outline" className="border-green-500/50 bg-green-500/10 text-green-400 text-[10px]">
              Active
            </Badge>
          ) : (
            <Badge variant="outline" className="border-muted-foreground/50 text-[10px]">
              Inactive
            </Badge>
          )}
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Last Flush</span>
          <span className="font-mono text-foreground">
            {new Date(telemetry.lastFlush).toLocaleTimeString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// =====================================================
// API HEALTH CARD COMPONENT
// =====================================================

interface ApiCardProps {
  api: ApiHealth;
}

function ApiCard({ api }: ApiCardProps) {
  return (
    <Card className="glass border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          API Performance
          <Badge variant="outline" className="ml-auto text-[10px]">{api.version}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 bg-muted/20 rounded-lg">
            <p className="text-lg font-mono font-bold text-green-400">{api.latencyP50}</p>
            <p className="text-[10px] text-muted-foreground">P50 (ms)</p>
          </div>
          <div className="text-center p-2 bg-muted/20 rounded-lg">
            <p className="text-lg font-mono font-bold text-yellow-400">{api.latencyP95}</p>
            <p className="text-[10px] text-muted-foreground">P95 (ms)</p>
          </div>
          <div className="text-center p-2 bg-muted/20 rounded-lg">
            <p className="text-lg font-mono font-bold text-red-400">{api.latencyP99}</p>
            <p className="text-[10px] text-muted-foreground">P99 (ms)</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-mono font-bold">{api.requestRate}/s</p>
              <p className="text-[10px] text-muted-foreground">Request Rate</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className={cn(
              "w-4 h-4",
              api.errorRate > 1 ? "text-red-400" : "text-muted-foreground"
            )} />
            <div>
              <p className={cn(
                "text-sm font-mono font-bold",
                api.errorRate > 1 ? "text-red-400" : "text-foreground"
              )}>
                {api.errorRate.toFixed(2)}%
              </p>
              <p className="text-[10px] text-muted-foreground">Error Rate</p>
            </div>
          </div>
        </div>
        
        {api.deprecationWarnings.length > 0 && (
          <>
            <Separator className="bg-border/30" />
            <div className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-[10px] font-medium text-yellow-400 mb-1">Deprecation Warning</p>
              {api.deprecationWarnings.map((warning, i) => (
                <p key={i} className="text-[10px] text-muted-foreground">
                  {warning.version} sunset: {warning.sunsetDate}
                </p>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// =====================================================
// FEATURE FLAGS CARD COMPONENT
// =====================================================

interface FeatureFlagsCardProps {
  features: FeatureHealth;
}

function FeatureFlagsCard({ features }: FeatureFlagsCardProps) {
  const flagEntries = Object.entries(features.activeFlags);
  
  return (
    <Card className="glass border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <ToggleRight className="w-4 h-4 text-primary" />
          Feature Flags
          {features.flagOverrides > 0 && (
            <Badge variant="outline" className="ml-auto border-yellow-500/50 bg-yellow-500/10 text-yellow-400 text-[10px]">
              {features.flagOverrides} overrides
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {flagEntries.map(([flag, enabled]) => (
            <div key={flag} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
              <span className="text-xs text-muted-foreground capitalize">
                {flag.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              {enabled ? (
                <div className="flex items-center gap-1.5">
                  <ToggleRight className="w-4 h-4 text-green-400" />
                  <span className="text-[10px] text-green-400 font-medium">ON</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground font-medium">OFF</span>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {features.killSwitches.length > 0 && (
          <>
            <Separator className="bg-border/30 my-3" />
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wide text-red-400 font-medium">
                Active Kill Switches
              </p>
              {features.killSwitches.map((ks) => (
                <div key={ks.id} className="flex items-center justify-between p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <span className="text-xs">{ks.name}</span>
                  <Badge variant="outline" className="border-red-500/50 bg-red-500/20 text-red-400 text-[10px]">
                    Enabled
                  </Badge>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function SystemHealth() {
  const navigate = useNavigate();
  const { setHealth, setLoading, isLoading } = useHealthStore();
  const [health, setLocalHealth] = useState<HealthMetrics | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    try {
      const data = await mockHealthService.getHealth();
      setLocalHealth(data);
      setHealth(data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("[SystemHealth] Error fetching health:", error);
    } finally {
      setLoading(false);
    }
  }, [setHealth, setLoading]);

  // Initial fetch
  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(fetchHealth, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [autoRefresh, fetchHealth]);

  const overallStatus = health?.status || "healthy";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/dashboard")}
                className="hover:bg-muted/50"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  overallStatus === "healthy" && "bg-green-500/10",
                  overallStatus === "degraded" && "bg-yellow-500/10",
                  overallStatus === "critical" && "bg-red-500/10"
                )}>
                  <Activity className={cn(
                    "w-6 h-6",
                    overallStatus === "healthy" && "text-green-400",
                    overallStatus === "degraded" && "text-yellow-400",
                    overallStatus === "critical" && "text-red-400"
                  )} />
                </div>
                <div>
                  <h1 className="text-lg font-bold">System Health</h1>
                  <p className="text-xs text-muted-foreground">
                    {lastRefresh ? `Last updated: ${lastRefresh.toLocaleTimeString()}` : "Loading..."}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {getStatusBadge(overallStatus)}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchHealth}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <ScrollArea className="h-[calc(100vh-65px)]">
        <main className="container mx-auto px-4 py-6">
          {!health ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Services Grid */}
              <section>
                <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">
                  Services
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {health.services.map((service) => (
                    <ServiceCard key={service.name} service={service} />
                  ))}
                </div>
              </section>

              {/* Metrics Grid */}
              <section>
                <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">
                  Platform Metrics
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <TelemetryCard telemetry={health.telemetry} />
                  <ApiCard api={health.api} />
                  <FeatureFlagsCard features={health.features} />
                </div>
              </section>

              {/* Auto Refresh Toggle */}
              <div className="flex items-center justify-center gap-2 pt-4">
                <span className="text-xs text-muted-foreground">Auto-refresh (30s)</span>
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={cn(
                    "relative w-10 h-5 rounded-full transition-colors",
                    autoRefresh ? "bg-primary" : "bg-muted"
                  )}
                >
                  <div className={cn(
                    "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                    autoRefresh ? "translate-x-5" : "translate-x-0.5"
                  )} />
                </button>
              </div>
            </div>
          )}
        </main>
      </ScrollArea>
    </div>
  );
}
