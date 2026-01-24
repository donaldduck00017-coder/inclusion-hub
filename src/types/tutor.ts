// =====================================================
// TUTOR SYSTEM TYPES
// Challenge-aware, detection-reactive SOC mentor types
// =====================================================

// Challenge Categories - must match challenges.json
export type ChallengeCategory = 
  | "phishing" 
  | "malware" 
  | "network" 
  | "cryptography" 
  | "web-security" 
  | "forensics" 
  | "social-engineering";

// Difficulty Levels
export type ChallengeDifficulty = 
  | "beginner" 
  | "intermediate" 
  | "advanced" 
  | "expert";

// Tutor Operating Modes
export type TutorMode = "learning" | "defensive" | "soc";

// Reasoning Styles per category
export type ReasoningStyle = "analytical" | "forensic" | "systems" | "behavioral";

// Hint Strategies
export type HintStrategy = "progressive" | "penalty" | "guided";

// =====================================================
// DETECTION SIGNALS
// =====================================================

export type DetectionSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface DetectionSignal {
  type: string;
  severity: DetectionSeverity;
  timestamp?: number;
  description?: string;
}

// Detection signal types for behavior analysis
export type DetectionSignalType = 
  | "hint_dependency"      // Over-reliance on hints
  | "rapid_submissions"    // Too many attempts too fast
  | "focus_loss"           // Long idle periods
  | "repeated_failures"    // Same wrong answer pattern
  | "copy_paste_detected"  // Potential cheating indicator
  | "time_anomaly"         // Unusual time patterns
  | "off_topic_query";     // Asking unrelated questions

// =====================================================
// TUTOR CONTEXT
// =====================================================

export interface TutorSessionContext {
  sessionId: string;
  userId: string;
  role: "student" | "instructor" | "admin";
}

export interface TutorChallengeContext {
  challengeId: string;
  challengeName: string;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  instructions?: string;
  hints?: string[];
}

export interface TutorTelemetrySummary {
  timeOnTask: number;         // seconds
  attempts: number;
  hintsUsed: number;
  hintsAvailable: number;
  lastResult: "correct" | "incorrect" | "none";
  detectionSignals: DetectionSignal[];
  failedSubmissions: number;
  idleTime?: number;
}

// Complete context for tutor requests
export interface TutorContext {
  session: TutorSessionContext;
  challenge: TutorChallengeContext;
  telemetry: TutorTelemetrySummary;
  mode: TutorMode;
  lastUserMessage?: string;
}

// =====================================================
// TUTOR PROFILES (Category-specific reasoning)
// =====================================================

export interface TutorProfile {
  category: ChallengeCategory;
  displayName: string;
  allowedConcepts: string[];
  forbiddenConcepts: string[];   // Concepts from other domains
  reasoningStyle: ReasoningStyle;
  hintStrategy: HintStrategy;
  domainKeywords: string[];       // Keywords for this domain
  suggestedQuestions: string[];   // Context-appropriate prompts
}

// =====================================================
// TUTOR REQUEST/RESPONSE
// =====================================================

export interface TutorRequest {
  context: TutorContext;
  userMessage: string;
}

export interface TutorSignal {
  type: string;
  tag: string;
}

export type MessageSeverity = "info" | "concept" | "warning" | "risk";

export interface TutorResponse {
  responseId: string;
  mode: TutorMode;
  category: ChallengeCategory;
  riskLevel: "low" | "medium" | "high";
  severity: MessageSeverity;
  message: string;
  signals: TutorSignal[];
  suggestedActions: string[];
  detectionReaction?: string;     // Reaction to detection signals
  confidence: number;             // 0-1 confidence in response
}

// =====================================================
// TUTOR MESSAGE (UI Display)
// =====================================================

export interface TutorMessage {
  id: string;
  role: "user" | "tutor";
  content: string;
  timestamp: number;
  severity?: MessageSeverity;
  category?: ChallengeCategory;
  signals?: TutorSignal[];
  detectionTriggered?: boolean;   // Was this a detection-reactive response
}

// =====================================================
// API CONTRACT (for future backend integration)
// =====================================================

// POST /api/v1/tutor/respond
export interface TutorRespondRequest {
  context: TutorContext;
  userMessage: string;
}

// POST /api/v1/tutor/context/update
export interface TutorContextUpdateRequest {
  sessionId: string;
  challengeId: string;
  telemetryDelta: Partial<TutorTelemetrySummary>;
}

// GET /api/v1/tutor/profile/{category}
export interface TutorProfileResponse {
  profile: TutorProfile;
  available: boolean;
}
