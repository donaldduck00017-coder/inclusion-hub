import type { TutorRequest, TutorResponse, TutorMode } from "@/types/tutor";

// Mock tutor service for development
export const tutorService = {
  async sendMessage(request: TutorRequest): Promise<TutorResponse> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 500));

    const responses = generateMockResponse(request);
    return responses;
  },
};

function generateMockResponse(request: TutorRequest): TutorResponse {
  const { mode, userMessage } = request;
  
  const responseTemplates: Record<TutorMode, string[]> = {
    learning: [
      "Let me explain the concept behind this challenge. The key is understanding how attackers exploit trust relationships.",
      "Good question! Consider the MITRE ATT&CK framework here - this maps to the Initial Access tactic.",
      "Think about this from the defender's perspective. What logs would you check first?",
    ],
    defensive: [
      "Your defensive posture needs attention. Consider implementing network segmentation to limit lateral movement.",
      "The detection rule you're missing should focus on anomalous process creation patterns.",
      "Strong defense requires understanding the attack chain. Let's map out the kill chain stages.",
    ],
    soc: [
      "A SOC analyst would prioritize this alert based on asset criticality. Check if this system has access to sensitive data.",
      "Correlate this event with authentication logs from the past 24 hours. Look for patterns.",
      "Document your findings in a structured format. Incident response requires clear communication.",
    ],
  };

  const templates = responseTemplates[mode];
  const message = templates[Math.floor(Math.random() * templates.length)];

  return {
    responseId: `resp-${Date.now()}`,
    mode,
    riskLevel: Math.random() > 0.7 ? "high" : Math.random() > 0.4 ? "medium" : "low",
    message,
    signals: [
      { type: "guidance", tag: mode },
    ],
    suggestedActions: [
      "Review the challenge documentation",
      "Check related alerts",
    ],
  };
}
