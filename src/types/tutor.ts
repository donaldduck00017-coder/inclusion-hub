export type TutorMode = "learning" | "defensive" | "soc";

export interface TutorSessionContext {
  sessionId: string;
  userId: string;
  role: "student" | "instructor" | "admin";
}

export interface TutorChallengeContext {
  challengeId: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface DetectionSignal {
  type: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
}

export interface TutorTelemetrySummary {
  timeOnTask: number;
  attempts: number;
  hintsUsed: number;
  lastResult: "correct" | "incorrect" | "none";
  detectionSignals: DetectionSignal[];
}

export interface TutorRequest {
  session: TutorSessionContext;
  challenge: TutorChallengeContext;
  telemetrySummary: TutorTelemetrySummary;
  mode: TutorMode;
  userMessage: string;
}

export interface TutorSignal {
  type: string;
  tag: string;
}

export interface TutorResponse {
  responseId: string;
  mode: TutorMode;
  riskLevel: "low" | "medium" | "high";
  message: string;
  signals: TutorSignal[];
  suggestedActions: string[];
}

