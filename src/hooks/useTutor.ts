import { useState, useCallback, useRef, useEffect } from "react";
import type { TutorMode, TutorResponse, DetectionSignal } from "@/types/tutor";

export interface TutorMessage {
  id: string;
  role: "user" | "tutor";
  content: string;
  timestamp: number;
  severity?: "info" | "concept" | "warning" | "risk";
  signals?: Array<{ type: string; tag: string }>;
}

export interface TutorTelemetry {
  timeOnTask: number;
  attempts: number;
  hintsUsed: number;
  detectionSignals: DetectionSignal[];
}

export interface TutorContext {
  challengeId: string;
  challengeName: string;
  sessionId: string;
}

export interface UseTutorReturn {
  messages: TutorMessage[];
  sendMessage: (content: string) => Promise<void>;
  telemetry: TutorTelemetry;
  context: TutorContext;
  mode: TutorMode;
  setMode: (mode: TutorMode) => void;
  isOpen: boolean;
  toggleOpen: () => void;
  isLoading: boolean;
  clearMessages: () => void;
}

interface MockResponse {
  message: string;
  severity: "info" | "concept" | "warning" | "risk";
}

// Mock tutor responses based on mode
const getMockResponse = (userMessage: string, mode: TutorMode): MockResponse => {
  const responses: Record<TutorMode, MockResponse[]> = {
    learning: [
      { message: "Let's break this down step by step. The key concept here is understanding how the attacker establishes persistence. Look for unusual registry keys or scheduled tasks.", severity: "concept" },
      { message: "Good question! In phishing attacks, attackers often use lookalike domains. Check the email headers carefully for domain mismatches.", severity: "info" },
      { message: "Consider the attack surface here. What entry points does this system expose? Think about open ports and services.", severity: "concept" },
    ],
    defensive: [
      { message: "⚠️ Your current approach leaves a detection gap. The SIEM won't catch lateral movement without proper network segmentation logging.", severity: "warning" },
      { message: "Strong defense requires layered controls. Have you considered implementing endpoint detection and response (EDR) rules?", severity: "concept" },
      { message: "🔴 Critical: Your firewall rule allows outbound traffic on non-standard ports. This is a common exfiltration vector.", severity: "risk" },
    ],
    soc: [
      { message: "A SOC analyst would correlate this alert with recent authentication logs. Check for failed login attempts from the same source IP.", severity: "info" },
      { message: "⚠️ This pattern matches known C2 beacon behavior. The periodic timing and encoded payloads are red flags.", severity: "warning" },
      { message: "In a real SOC, you'd escalate this to Tier 2 immediately. The indicators suggest an active intrusion.", severity: "risk" },
    ],
  };

  const modeResponses = responses[mode];
  return modeResponses[Math.floor(Math.random() * modeResponses.length)];
};

export function useTutor(): UseTutorReturn {
  const [messages, setMessages] = useState<TutorMessage[]>([
    {
      id: "welcome-1",
      role: "tutor",
      content: "Welcome to the AI Tutor. I'm here to help you develop your cybersecurity skills. Ask me anything about the current challenge, or use the suggested prompts below.",
      timestamp: Date.now() - 60000,
      severity: "info",
    },
  ]);
  const [mode, setMode] = useState<TutorMode>("learning");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock telemetry data - in production this would come from telemetryStore
  const [telemetry] = useState<TutorTelemetry>({
    timeOnTask: 847, // seconds
    attempts: 3,
    hintsUsed: 1,
    detectionSignals: [
      { type: "rapid_attempts", severity: "LOW" },
      { type: "hint_dependency", severity: "MEDIUM" },
    ],
  });

  // Mock context - in production this would come from challengeStore
  const [context] = useState<TutorContext>({
    challengeId: "phish-001",
    challengeName: "Phishing Email Analysis",
    sessionId: "sess-a1b2c3d4e5f6",
  });

  const messageIdCounter = useRef(1);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: TutorMessage = {
      id: `msg-user-${messageIdCounter.current++}`,
      role: "user",
      content: content.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1200 + Math.random() * 800));

    const mockResponse = getMockResponse(content, mode);
    
    const tutorMessage: TutorMessage = {
      id: `msg-tutor-${messageIdCounter.current++}`,
      role: "tutor",
      content: mockResponse.message || "I'm analyzing your question...",
      timestamp: Date.now(),
      severity: mockResponse.severity || "info",
    };

    setMessages((prev) => [...prev, tutorMessage]);
    setIsLoading(false);
  }, [mode, isLoading]);

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([{
      id: "welcome-cleared",
      role: "tutor",
      content: "Chat cleared. How can I help you with the current challenge?",
      timestamp: Date.now(),
      severity: "info",
    }]);
  }, []);

  return {
    messages,
    sendMessage,
    telemetry,
    context,
    mode,
    setMode,
    isOpen,
    toggleOpen,
    isLoading,
    clearMessages,
  };
}
