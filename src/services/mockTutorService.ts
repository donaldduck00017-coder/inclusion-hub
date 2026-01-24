/**
 * Mock Tutor Service
 * 
 * Category-aware, detection-reactive AI tutor responses.
 * Designed for future backend compatibility with real AI systems.
 * 
 * API Contract:
 * POST /api/v1/tutor/respond
 * POST /api/v1/tutor/context/update
 * GET  /api/v1/tutor/profile/{category}
 */

import type {
  TutorRequest,
  TutorResponse,
  TutorContext,
  TutorProfile,
  ChallengeCategory,
  TutorMode,
  DetectionSignal,
  MessageSeverity,
} from "@/types/tutor";
import { 
  tutorProfiles, 
  modeModifiers, 
  getDetectionReaction,
  getSuggestedQuestions,
} from "@/lib/tutorProfiles";
import { escapeHtml } from "@/lib/sanitize";

// =====================================================
// CATEGORY-SPECIFIC RESPONSE TEMPLATES
// =====================================================

interface ResponseTemplate {
  message: string;
  severity: MessageSeverity;
  confidence: number;
}

const categoryResponses: Record<ChallengeCategory, Record<TutorMode, ResponseTemplate[]>> = {
  phishing: {
    learning: [
      {
        message: "Email headers tell the real story. Check the 'From' field versus the 'Reply-To' - attackers often use lookalike domains that differ by just one character. Look for typosquatting patterns.",
        severity: "concept",
        confidence: 0.92,
      },
      {
        message: "Hover over any links without clicking. The displayed text and actual URL often don't match in phishing emails. Look for URL shorteners or unusual domains.",
        severity: "concept",
        confidence: 0.88,
      },
      {
        message: "Social engineering relies on urgency and authority. Phrases like 'Your account will be suspended' or 'CEO needs this immediately' are red flags designed to bypass critical thinking.",
        severity: "warning",
        confidence: 0.85,
      },
    ],
    defensive: [
      {
        message: "⚠️ Implement DMARC, SPF, and DKIM authentication to prevent domain spoofing. These controls verify sender legitimacy at the email gateway level.",
        severity: "warning",
        confidence: 0.90,
      },
      {
        message: "Deploy URL rewriting and sandboxing for email links. Real-time link analysis catches zero-day phishing sites that signature-based detection misses.",
        severity: "concept",
        confidence: 0.87,
      },
    ],
    soc: [
      {
        message: "As a SOC analyst, correlate this phishing attempt with other alerts. Check if similar emails hit other users - campaign detection reveals the threat scope.",
        severity: "info",
        confidence: 0.91,
      },
      {
        message: "Document the IOCs: sender domain, reply-to address, link destinations, and any attachment hashes. These feed into threat intelligence for future detection.",
        severity: "concept",
        confidence: 0.89,
      },
    ],
  },

  malware: {
    learning: [
      {
        message: "File hashes (MD5, SHA256) are digital fingerprints. Calculate the hash and check it against threat intelligence databases like VirusTotal. A single byte change creates a completely different hash.",
        severity: "concept",
        confidence: 0.93,
      },
      {
        message: "Persistence mechanisms are how malware survives reboots. Check registry Run keys, scheduled tasks, and startup folders. These are the first places to look.",
        severity: "concept",
        confidence: 0.90,
      },
      {
        message: "🔴 Never analyze malware on a production system. Use an isolated sandbox environment. The malware may detect analysis tools and change behavior.",
        severity: "risk",
        confidence: 0.95,
      },
    ],
    defensive: [
      {
        message: "Application whitelisting is your strongest defense. Only allow known-good executables to run. This stops most malware regardless of signature detection.",
        severity: "concept",
        confidence: 0.88,
      },
      {
        message: "⚠️ Endpoint Detection and Response (EDR) provides visibility into process creation, file modifications, and network connections. Essential for catching fileless malware.",
        severity: "warning",
        confidence: 0.91,
      },
    ],
    soc: [
      {
        message: "Build a kill chain timeline: initial access, execution, persistence, C2 communication. Understanding the attack stages helps identify what else might be compromised.",
        severity: "concept",
        confidence: 0.92,
      },
      {
        message: "Check for lateral movement indicators. If one system is infected, assume others may be. Query your EDR for similar process behaviors across the network.",
        severity: "warning",
        confidence: 0.89,
      },
    ],
  },

  network: {
    learning: [
      {
        message: "Packet captures reveal the ground truth. Use Wireshark to analyze protocols, examine payloads, and follow TCP streams. Start with the protocol hierarchy to understand traffic composition.",
        severity: "concept",
        confidence: 0.91,
      },
      {
        message: "Beaconing behavior is periodic outbound connections to C2 servers. Look for consistent timing intervals (every 60 seconds, 5 minutes) and similar packet sizes.",
        severity: "concept",
        confidence: 0.88,
      },
      {
        message: "DNS tunneling hides data in DNS queries. Look for unusually long subdomain names, high query volumes to single domains, and TXT record queries.",
        severity: "warning",
        confidence: 0.86,
      },
    ],
    defensive: [
      {
        message: "Network segmentation limits lateral movement. Critical assets should be isolated with strict firewall rules. Zero-trust architecture assumes breach.",
        severity: "concept",
        confidence: 0.90,
      },
      {
        message: "⚠️ Deploy network intrusion detection (IDS) with regularly updated signatures. Combine with anomaly detection for unknown threats.",
        severity: "warning",
        confidence: 0.87,
      },
    ],
    soc: [
      {
        message: "Correlate network alerts with endpoint telemetry. A suspicious outbound connection becomes high priority when combined with process creation logs.",
        severity: "info",
        confidence: 0.92,
      },
      {
        message: "Create flow baselines for critical systems. Deviations from normal traffic patterns indicate potential data exfiltration or compromise.",
        severity: "concept",
        confidence: 0.89,
      },
    ],
  },

  cryptography: {
    learning: [
      {
        message: "First distinguish encoding from encryption. Base64, hex, and URL encoding are NOT encryption - they're reversible without a key. True encryption requires a secret key.",
        severity: "concept",
        confidence: 0.94,
      },
      {
        message: "Frequency analysis works on substitution ciphers. Count character occurrences and compare to expected language frequencies. 'E' is most common in English.",
        severity: "concept",
        confidence: 0.91,
      },
      {
        message: "Entropy measures randomness. High entropy suggests encryption or compression. Low entropy with patterns suggests simple encoding or weak encryption.",
        severity: "concept",
        confidence: 0.88,
      },
    ],
    defensive: [
      {
        message: "Use strong, well-tested encryption algorithms (AES-256, RSA-2048+). Never roll your own crypto. Implement proper key management and rotation.",
        severity: "concept",
        confidence: 0.93,
      },
      {
        message: "⚠️ ECB mode is dangerous - it reveals patterns in encrypted data. Always use CBC, GCM, or other modes with proper IV handling.",
        severity: "warning",
        confidence: 0.90,
      },
    ],
    soc: [
      {
        message: "When investigating encrypted traffic, focus on metadata: connection timing, volume, destinations. You can't decrypt, but patterns reveal behavior.",
        severity: "info",
        confidence: 0.87,
      },
      {
        message: "Certificate analysis reveals C2 infrastructure. Self-signed certs, recently issued certs, or certs with unusual fields are indicators of malicious activity.",
        severity: "concept",
        confidence: 0.85,
      },
    ],
  },

  "web-security": {
    learning: [
      {
        message: "SQL injection occurs when user input is concatenated into queries without sanitization. Look for input fields that might feed into database queries - login forms, search boxes, URL parameters.",
        severity: "concept",
        confidence: 0.92,
      },
      {
        message: "XSS (Cross-Site Scripting) allows attackers to inject scripts into pages viewed by other users. Test for reflection of input in the page source without proper encoding.",
        severity: "concept",
        confidence: 0.89,
      },
      {
        message: "🔴 Authentication bypass often exploits logical flaws: password reset flows, session management, or trusting client-side validation.",
        severity: "risk",
        confidence: 0.91,
      },
    ],
    defensive: [
      {
        message: "Parameterized queries prevent SQL injection by separating code from data. Never concatenate user input into SQL strings.",
        severity: "concept",
        confidence: 0.94,
      },
      {
        message: "Implement Content Security Policy (CSP) headers to mitigate XSS. Restrict script sources and disable inline scripts.",
        severity: "concept",
        confidence: 0.88,
      },
    ],
    soc: [
      {
        message: "WAF logs reveal attack patterns. Look for common payloads: ' OR 1=1, <script> tags, path traversal sequences (../). Alert on clusters of similar attempts.",
        severity: "info",
        confidence: 0.90,
      },
      {
        message: "⚠️ Successful exploitation often follows failed attempts. If you see attack signatures followed by normal application behavior, investigate for compromise.",
        severity: "warning",
        confidence: 0.87,
      },
    ],
  },

  forensics: {
    learning: [
      {
        message: "Timeline analysis is foundational. Correlate file system timestamps (MACB times), event logs, and registry modifications to reconstruct attacker activity.",
        severity: "concept",
        confidence: 0.93,
      },
      {
        message: "Evidence preservation is critical. Always work from forensic images, never the original. Calculate and verify hashes to prove integrity.",
        severity: "concept",
        confidence: 0.95,
      },
      {
        message: "Prefetch files, jump lists, and browser history reveal user activity. These artifacts persist even when the user tries to cover their tracks.",
        severity: "concept",
        confidence: 0.88,
      },
    ],
    defensive: [
      {
        message: "Enable comprehensive logging before incidents occur. You can't investigate what you didn't log. PowerShell script block logging catches fileless attacks.",
        severity: "warning",
        confidence: 0.91,
      },
      {
        message: "Maintain forensic readiness: documented procedures, trained responders, pre-authorized tools, and legal frameworks in place before an incident.",
        severity: "concept",
        confidence: 0.87,
      },
    ],
    soc: [
      {
        message: "Chain of custody documentation is legally required. Record who accessed evidence, when, and what actions were taken. This matters for prosecution.",
        severity: "warning",
        confidence: 0.94,
      },
      {
        message: "Prioritize volatile evidence: memory, network connections, running processes. This data disappears when systems are powered off.",
        severity: "risk",
        confidence: 0.92,
      },
    ],
  },

  "social-engineering": {
    learning: [
      {
        message: "Pretexting creates a fabricated scenario to manipulate the target. Attackers impersonate IT support, executives, or vendors to establish trust before making their request.",
        severity: "concept",
        confidence: 0.90,
      },
      {
        message: "Authority and urgency are powerful psychological triggers. 'The CEO needs this now' bypasses normal verification procedures. Always verify through independent channels.",
        severity: "warning",
        confidence: 0.92,
      },
      {
        message: "Information gathering precedes targeted attacks. Attackers research organizations through LinkedIn, press releases, and social media to craft convincing pretexts.",
        severity: "concept",
        confidence: 0.87,
      },
    ],
    defensive: [
      {
        message: "Implement verification procedures for sensitive requests. Call back using known numbers, not numbers provided in the request. Verify email requests in person.",
        severity: "concept",
        confidence: 0.91,
      },
      {
        message: "⚠️ Security awareness training must include realistic simulations. Employees need to experience social engineering attempts to recognize them.",
        severity: "warning",
        confidence: 0.88,
      },
    ],
    soc: [
      {
        message: "Social engineering often precedes technical attacks. If you detect a successful pretext, assume the attacker has credentials or access. Hunt for follow-on activity.",
        severity: "warning",
        confidence: 0.89,
      },
      {
        message: "Document the attack methodology for awareness training. What worked? What didn't? Use real incidents (sanitized) to train staff.",
        severity: "info",
        confidence: 0.85,
      },
    ],
  },
};

// =====================================================
// DETECTION-REACTIVE RESPONSE GENERATION
// =====================================================

function getDetectionTriggeredResponse(
  signals: DetectionSignal[],
  category: ChallengeCategory,
  mode: TutorMode
): { modifier: string; severity: MessageSeverity } | null {
  if (signals.length === 0) return null;

  // Prioritize by severity
  const sortedSignals = [...signals].sort((a, b) => {
    const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return order[a.severity] - order[b.severity];
  });

  const highestSignal = sortedSignals[0];
  const reaction = getDetectionReaction(highestSignal.type);

  if (reaction) {
    return {
      modifier: reaction.responseModifier,
      severity: highestSignal.severity === "HIGH" || highestSignal.severity === "CRITICAL" 
        ? "warning" 
        : "info",
    };
  }

  return null;
}

// =====================================================
// MOCK TUTOR SERVICE
// =====================================================

export const mockTutorService = {
  /**
   * POST /api/v1/tutor/respond
   * Generate a context-aware tutor response
   */
  async respond(request: TutorRequest): Promise<TutorResponse> {
    const { context, userMessage } = request;
    const { challenge, telemetry, mode } = context;
    const category = challenge.category;

    // Simulate network latency
    await new Promise(resolve => 
      setTimeout(resolve, 800 + Math.random() * 700)
    );

    // Get category-specific responses
    const categoryTemplates = categoryResponses[category];
    if (!categoryTemplates) {
      return createFallbackResponse(mode, category);
    }

    const modeTemplates = categoryTemplates[mode];
    const template = modeTemplates[Math.floor(Math.random() * modeTemplates.length)];

    // Check for detection-reactive modifier
    const detectionReaction = getDetectionTriggeredResponse(
      telemetry.detectionSignals,
      category,
      mode
    );

    // Build response message
    let message = template.message;
    let severity = template.severity;

    if (detectionReaction) {
      message = detectionReaction.modifier + "\n\n" + message;
      severity = detectionReaction.severity;
    }

    // Sanitize output
    message = escapeHtml(message);

    const profile = tutorProfiles[category];
    const suggestedActions = getSuggestedQuestions(category, mode).slice(0, 3);

    return {
      responseId: `resp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      mode,
      category,
      riskLevel: severity === "risk" ? "high" : severity === "warning" ? "medium" : "low",
      severity,
      message,
      signals: [
        { type: "guidance", tag: mode },
        { type: "domain", tag: category },
      ],
      suggestedActions,
      detectionReaction: detectionReaction?.modifier,
      confidence: template.confidence,
    };
  },

  /**
   * POST /api/v1/tutor/context/update
   * Update tutor context with new telemetry
   */
  async updateContext(
    sessionId: string,
    challengeId: string,
    telemetryDelta: Partial<TutorContext["telemetry"]>
  ): Promise<{ success: boolean }> {
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log("[MockTutor] Context updated:", { sessionId, challengeId, telemetryDelta });
    return { success: true };
  },

  /**
   * GET /api/v1/tutor/profile/{category}
   * Get tutor profile for a challenge category
   */
  async getProfile(category: ChallengeCategory): Promise<{ profile: TutorProfile; available: boolean }> {
    await new Promise(resolve => setTimeout(resolve, 50));
    const profile = tutorProfiles[category];
    return {
      profile,
      available: !!profile,
    };
  },
};

function createFallbackResponse(mode: TutorMode, category: ChallengeCategory): TutorResponse {
  return {
    responseId: `resp-fallback-${Date.now()}`,
    mode,
    category,
    riskLevel: "low",
    severity: "info",
    message: "I'm analyzing your question. Let's approach this systematically based on the evidence available.",
    signals: [{ type: "fallback", tag: "generic" }],
    suggestedActions: ["Review the challenge instructions", "Examine available evidence"],
    confidence: 0.5,
  };
}

export default mockTutorService;
