/**
 * useTutorSession Hook
 * 
 * Challenge-aware, detection-reactive tutor session management.
 * Integrates with challenge context and telemetry signals.
 * 
 * This is the primary hook for tutor functionality.
 */

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import type {
  TutorMode,
  TutorMessage,
  TutorContext,
  TutorChallengeContext,
  TutorTelemetrySummary,
  DetectionSignal,
  ChallengeCategory,
  ChallengeDifficulty,
} from "@/types/tutor";
import { mockTutorService } from "@/services/mockTutorService";
import { getSuggestedQuestions } from "@/lib/tutorProfiles";
import { escapeHtml } from "@/lib/sanitize";

// =====================================================
// HOOK INTERFACE
// =====================================================

export interface UseTutorSessionReturn {
  // Messages
  messages: TutorMessage[];
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  
  // Context
  context: TutorContext;
  challenge: TutorChallengeContext;
  telemetry: TutorTelemetrySummary;
  
  // Mode
  mode: TutorMode;
  setMode: (mode: TutorMode) => void;
  
  // UI State
  isOpen: boolean;
  toggleOpen: () => void;
  setOpen: (open: boolean) => void;
  isLoading: boolean;
  
  // Suggestions
  suggestedQuestions: string[];
  
  // Actions
  updateTelemetry: (delta: Partial<TutorTelemetrySummary>) => void;
  setChallenge: (challenge: TutorChallengeContext) => void;
  addDetectionSignal: (signal: DetectionSignal) => void;
}

export interface UseTutorSessionOptions {
  initialChallenge?: TutorChallengeContext;
  initialMode?: TutorMode;
  sessionId?: string;
  userId?: string;
}

// =====================================================
// DEFAULT VALUES
// =====================================================

const defaultChallenge: TutorChallengeContext = {
  challengeId: "ch-001",
  challengeName: "Phishing Email Analysis",
  category: "phishing",
  difficulty: "beginner",
  instructions: "Analyze the suspicious email and identify phishing indicators.",
};

const defaultTelemetry: TutorTelemetrySummary = {
  timeOnTask: 0,
  attempts: 0,
  hintsUsed: 0,
  hintsAvailable: 3,
  lastResult: "none",
  detectionSignals: [],
  failedSubmissions: 0,
};

// =====================================================
// HOOK IMPLEMENTATION
// =====================================================

export function useTutorSession(options: UseTutorSessionOptions = {}): UseTutorSessionReturn {
  const {
    initialChallenge = defaultChallenge,
    initialMode = "learning",
    sessionId = `sess-${Date.now().toString(36)}`,
    userId = "user-001",
  } = options;

  // State
  const [messages, setMessages] = useState<TutorMessage[]>(() => [
    createWelcomeMessage(initialChallenge.category, initialChallenge.challengeName),
  ]);
  const [mode, setMode] = useState<TutorMode>(initialMode);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [challenge, setChallenge] = useState<TutorChallengeContext>(initialChallenge);
  const [telemetry, setTelemetry] = useState<TutorTelemetrySummary>(defaultTelemetry);

  const messageIdCounter = useRef(1);
  const timeOnTaskInterval = useRef<NodeJS.Timeout | null>(null);

  // Track time on task when panel is open
  useEffect(() => {
    if (isOpen) {
      timeOnTaskInterval.current = setInterval(() => {
        setTelemetry(prev => ({
          ...prev,
          timeOnTask: prev.timeOnTask + 1,
        }));
      }, 1000);
    } else {
      if (timeOnTaskInterval.current) {
        clearInterval(timeOnTaskInterval.current);
        timeOnTaskInterval.current = null;
      }
    }

    return () => {
      if (timeOnTaskInterval.current) {
        clearInterval(timeOnTaskInterval.current);
      }
    };
  }, [isOpen]);

  // Build full context
  const context: TutorContext = useMemo(() => ({
    session: {
      sessionId,
      userId,
      role: "student",
    },
    challenge,
    telemetry,
    mode,
    lastUserMessage: messages.filter(m => m.role === "user").slice(-1)[0]?.content,
  }), [sessionId, userId, challenge, telemetry, mode, messages]);

  // Get suggested questions based on category and mode
  const suggestedQuestions = useMemo(() => 
    getSuggestedQuestions(challenge.category, mode),
    [challenge.category, mode]
  );

  // Send message to tutor
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const sanitizedContent = escapeHtml(content.trim());
    
    // Add user message
    const userMessage: TutorMessage = {
      id: `msg-user-${messageIdCounter.current++}`,
      role: "user",
      content: sanitizedContent,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Call mock tutor service
      const response = await mockTutorService.respond({
        context: {
          ...context,
          lastUserMessage: sanitizedContent,
        },
        userMessage: sanitizedContent,
      });

      // Add tutor response
      const tutorMessage: TutorMessage = {
        id: `msg-tutor-${messageIdCounter.current++}`,
        role: "tutor",
        content: response.message,
        timestamp: Date.now(),
        severity: response.severity,
        category: response.category,
        signals: response.signals,
        detectionTriggered: !!response.detectionReaction,
      };

      setMessages(prev => [...prev, tutorMessage]);

      // Update telemetry
      setTelemetry(prev => ({
        ...prev,
        attempts: prev.attempts + 1,
      }));

    } catch (error) {
      console.error("[TutorSession] Error sending message:", error);
      
      // Add error message
      const errorMessage: TutorMessage = {
        id: `msg-error-${messageIdCounter.current++}`,
        role: "tutor",
        content: "I encountered an issue processing your request. Let's continue - what would you like to explore?",
        timestamp: Date.now(),
        severity: "info",
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [context, isLoading]);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([
      createWelcomeMessage(challenge.category, challenge.challengeName),
    ]);
  }, [challenge.category, challenge.challengeName]);

  // Toggle panel
  const toggleOpen = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Update telemetry
  const updateTelemetry = useCallback((delta: Partial<TutorTelemetrySummary>) => {
    setTelemetry(prev => ({ ...prev, ...delta }));
  }, []);

  // Add detection signal
  const addDetectionSignal = useCallback((signal: DetectionSignal) => {
    setTelemetry(prev => ({
      ...prev,
      detectionSignals: [...prev.detectionSignals, signal],
    }));
  }, []);

  // Handle challenge change
  const handleSetChallenge = useCallback((newChallenge: TutorChallengeContext) => {
    setChallenge(newChallenge);
    // Reset telemetry for new challenge
    setTelemetry(defaultTelemetry);
    // Add context message
    setMessages(prev => [
      ...prev,
      {
        id: `msg-context-${messageIdCounter.current++}`,
        role: "tutor",
        content: `Now working on: ${newChallenge.challengeName}. This is a ${newChallenge.difficulty} level ${newChallenge.category} challenge. How can I help you approach this?`,
        timestamp: Date.now(),
        severity: "info",
        category: newChallenge.category,
      },
    ]);
  }, []);

  // Handle mode change
  const handleSetMode = useCallback((newMode: TutorMode) => {
    setMode(newMode);
    // Add mode change message
    const modeMessages: Record<TutorMode, string> = {
      learning: "Switched to Learning mode. I'll focus on explaining concepts and building understanding.",
      defensive: "Switched to Defensive mode. I'll focus on mitigation strategies and security controls.",
      soc: "Switched to SOC mode. I'll think like a Security Operations analyst - triage, correlation, and response.",
    };
    
    setMessages(prev => [
      ...prev,
      {
        id: `msg-mode-${messageIdCounter.current++}`,
        role: "tutor",
        content: modeMessages[newMode],
        timestamp: Date.now(),
        severity: "info",
      },
    ]);
  }, []);

  return {
    messages,
    sendMessage,
    clearMessages,
    context,
    challenge,
    telemetry,
    mode,
    setMode: handleSetMode,
    isOpen,
    toggleOpen,
    setOpen: setIsOpen,
    isLoading,
    suggestedQuestions,
    updateTelemetry,
    setChallenge: handleSetChallenge,
    addDetectionSignal,
  };
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function createWelcomeMessage(category: ChallengeCategory, challengeName: string): TutorMessage {
  const categoryIntros: Record<ChallengeCategory, string> = {
    phishing: "I'll help you analyze email headers, identify spoofed domains, and recognize social engineering tactics.",
    malware: "I'll guide you through file analysis, identifying persistence mechanisms, and understanding malware behavior.",
    network: "I'll help you analyze traffic patterns, identify anomalies, and trace network-based attacks.",
    cryptography: "I'll help you understand cipher types, perform analysis techniques, and break encryption challenges.",
    "web-security": "I'll guide you through identifying injection points, testing vulnerabilities, and understanding web attack vectors.",
    forensics: "I'll help you build timelines, analyze artifacts, and preserve evidence integrity.",
    "social-engineering": "I'll help you identify manipulation tactics, understand psychological triggers, and recognize social engineering attempts.",
  };

  return {
    id: "msg-welcome",
    role: "tutor",
    content: `Welcome to **${challengeName}**. ${categoryIntros[category]}\n\nAsk me anything about this challenge, or use the suggested prompts below. I'll adapt my guidance based on your progress.`,
    timestamp: Date.now() - 1000,
    severity: "info",
    category,
  };
}

export default useTutorSession;
