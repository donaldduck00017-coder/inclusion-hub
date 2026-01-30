/**
 * Tutor Profiles - Category-specific reasoning engines
 * 
 * Each profile defines:
 * - Allowed concepts: What the tutor CAN discuss
 * - Forbidden concepts: What MUST NOT bleed from other domains
 * - Reasoning style: How the tutor approaches problems
 * - Hint strategy: How hints are delivered
 * - Domain keywords: Key terms for response generation
 */

import type { TutorProfile, ChallengeCategory, TutorMode } from "@/types/tutor";

// =====================================================
// CATEGORY-SPECIFIC TUTOR PROFILES
// =====================================================

export const tutorProfiles: Record<ChallengeCategory, TutorProfile> = {
  phishing: {
    category: "phishing",
    displayName: "Phishing Analysis",
    allowedConcepts: [
      "email headers",
      "sender reputation",
      "domain spoofing",
      "lookalike domains",
      "URL analysis",
      "attachment analysis",
      "social engineering tactics",
      "urgency language",
      "brand impersonation",
      "SPF/DKIM/DMARC",
      "reply-to manipulation",
      "embedded links",
      "credential harvesting",
    ],
    forbiddenConcepts: [
      "file hashes",
      "registry keys",
      "network packets",
      "encryption algorithms",
      "SQL injection",
      "memory forensics",
    ],
    reasoningStyle: "behavioral",
    hintStrategy: "progressive",
    domainKeywords: [
      "header", "From:", "Reply-To:", "domain", "link", "URL", 
      "hover", "spoofed", "impersonation", "urgency", "credential",
      "attachment", "macro", "sender", "recipient", "phish"
    ],
    suggestedQuestions: [
      "What email headers should I check first?",
      "How can I verify the sender's identity?",
      "What makes this link suspicious?",
      "What social engineering tactics are used here?",
    ],
  },

  malware: {
    category: "malware",
    displayName: "Malware Analysis",
    allowedConcepts: [
      "file hashes (MD5, SHA1, SHA256)",
      "static analysis",
      "dynamic analysis",
      "sandbox behavior",
      "persistence mechanisms",
      "registry modifications",
      "process injection",
      "command and control",
      "indicators of compromise",
      "malware families",
      "packing/obfuscation",
      "API calls",
      "strings analysis",
    ],
    forbiddenConcepts: [
      "email headers",
      "SPF records",
      "network topology",
      "cipher modes",
      "XSS vulnerabilities",
      "chain of custody",
    ],
    reasoningStyle: "forensic",
    hintStrategy: "guided",
    domainKeywords: [
      "hash", "MD5", "SHA", "signature", "persistence", "registry",
      "sandbox", "behavior", "dropper", "payload", "C2", "beacon",
      "process", "injection", "pack", "obfuscate", "IOC", "family"
    ],
    suggestedQuestions: [
      "How do I calculate and verify file hashes?",
      "What persistence mechanisms should I look for?",
      "How can I safely analyze this in a sandbox?",
      "What behavior patterns indicate C2 communication?",
    ],
  },

  network: {
    category: "network",
    displayName: "Network Analysis",
    allowedConcepts: [
      "packet capture analysis",
      "protocol analysis",
      "traffic patterns",
      "port scanning",
      "lateral movement",
      "data exfiltration",
      "DNS tunneling",
      "beaconing behavior",
      "flow analysis",
      "network segmentation",
      "firewall rules",
      "IDS/IPS signatures",
      "PCAP analysis",
    ],
    forbiddenConcepts: [
      "email authentication",
      "file carving",
      "cryptographic attacks",
      "web application flaws",
      "social engineering",
      "registry analysis",
    ],
    reasoningStyle: "analytical",
    hintStrategy: "progressive",
    domainKeywords: [
      "packet", "PCAP", "flow", "port", "protocol", "TCP", "UDP",
      "DNS", "HTTP", "exfiltration", "beacon", "tunnel", "lateral",
      "firewall", "IDS", "Snort", "Suricata", "Wireshark", "traffic"
    ],
    suggestedQuestions: [
      "What traffic patterns indicate data exfiltration?",
      "How do I identify beaconing behavior?",
      "What ports and protocols are suspicious here?",
      "How can I detect DNS tunneling?",
    ],
  },

  cryptography: {
    category: "cryptography",
    displayName: "Cryptography Challenge",
    allowedConcepts: [
      "encoding vs encryption",
      "symmetric encryption",
      "asymmetric encryption",
      "frequency analysis",
      "cipher types",
      "key management",
      "entropy analysis",
      "padding schemes",
      "cipher modes (ECB, CBC)",
      "hash functions",
      "digital signatures",
      "key exchange",
    ],
    forbiddenConcepts: [
      "network protocols",
      "malware behavior",
      "phishing tactics",
      "SQL injection",
      "file system forensics",
      "social engineering",
    ],
    reasoningStyle: "analytical",
    hintStrategy: "penalty",
    domainKeywords: [
      "cipher", "encrypt", "decrypt", "key", "plaintext", "ciphertext",
      "frequency", "entropy", "base64", "hex", "XOR", "AES", "RSA",
      "hash", "MD5", "SHA", "salt", "IV", "padding", "mode"
    ],
    suggestedQuestions: [
      "Is this encoding or encryption?",
      "How do I perform frequency analysis?",
      "What cipher type might this be?",
      "What patterns should I look for in the ciphertext?",
    ],
  },

  "web-security": {
    category: "web-security",
    displayName: "Web Application Security",
    allowedConcepts: [
      "SQL injection",
      "cross-site scripting (XSS)",
      "CSRF attacks",
      "authentication bypass",
      "session management",
      "input validation",
      "output encoding",
      "security headers",
      "OWASP Top 10",
      "directory traversal",
      "file upload vulnerabilities",
      "API security",
    ],
    forbiddenConcepts: [
      "email headers",
      "malware hashes",
      "network packets",
      "cryptographic algorithms",
      "memory forensics",
      "phishing domains",
    ],
    reasoningStyle: "systems",
    hintStrategy: "progressive",
    domainKeywords: [
      "injection", "SQL", "XSS", "CSRF", "cookie", "session", "token",
      "input", "sanitize", "encode", "header", "OWASP", "auth", "bypass",
      "traverse", "upload", "parameter", "payload", "exploit"
    ],
    suggestedQuestions: [
      "Where should I test for SQL injection?",
      "How can I identify XSS vulnerabilities?",
      "What authentication flaws might exist?",
      "How do I test for CSRF vulnerabilities?",
    ],
  },

  forensics: {
    category: "forensics",
    displayName: "Digital Forensics",
    allowedConcepts: [
      "timeline analysis",
      "artifact collection",
      "log analysis",
      "file system forensics",
      "memory forensics",
      "chain of custody",
      "evidence preservation",
      "timestamp analysis",
      "deleted file recovery",
      "registry forensics",
      "browser forensics",
      "metadata analysis",
    ],
    forbiddenConcepts: [
      "live attack mitigation",
      "phishing response",
      "cryptographic breaking",
      "web exploitation",
      "network scanning",
      "social engineering defense",
    ],
    reasoningStyle: "forensic",
    hintStrategy: "guided",
    domainKeywords: [
      "timeline", "artifact", "evidence", "log", "event", "timestamp",
      "registry", "prefetch", "browser", "metadata", "carve", "recover",
      "chain", "custody", "image", "acquisition", "hash", "integrity"
    ],
    suggestedQuestions: [
      "Where should I start my timeline analysis?",
      "What artifacts are most relevant here?",
      "How do I preserve evidence integrity?",
      "What logs should I prioritize?",
    ],
  },

  "social-engineering": {
    category: "social-engineering",
    displayName: "Social Engineering",
    allowedConcepts: [
      "pretexting",
      "authority manipulation",
      "urgency tactics",
      "trust exploitation",
      "impersonation",
      "information gathering",
      "vishing",
      "smishing",
      "tailgating",
      "baiting",
      "quid pro quo",
      "psychological triggers",
    ],
    forbiddenConcepts: [
      "technical exploits",
      "malware analysis",
      "network protocols",
      "cryptography",
      "code injection",
      "file forensics",
    ],
    reasoningStyle: "behavioral",
    hintStrategy: "progressive",
    domainKeywords: [
      "pretext", "authority", "urgency", "trust", "impersonate", "persona",
      "manipulation", "trigger", "emotion", "fear", "greed", "curiosity",
      "verify", "callback", "vish", "smish", "bait", "tailgate"
    ],
    suggestedQuestions: [
      "What pretexting technique is being used?",
      "How is authority being exploited here?",
      "What psychological triggers are present?",
      "How would you verify this request?",
    ],
  },
};

// =====================================================
// MODE-SPECIFIC RESPONSE MODIFIERS
// =====================================================

export interface ModeModifier {
  prefix: string;
  focusAreas: string[];
  responseStyle: string;
}

export const modeModifiers: Record<TutorMode, ModeModifier> = {
  learning: {
    prefix: "Let me explain the concept:",
    focusAreas: ["fundamentals", "theory", "examples", "step-by-step"],
    responseStyle: "educational and thorough",
  },
  defensive: {
    prefix: "From a defensive perspective:",
    focusAreas: ["mitigation", "prevention", "hardening", "monitoring"],
    responseStyle: "practical and action-oriented",
  },
  soc: {
    prefix: "As a SOC analyst would approach this:",
    focusAreas: ["triage", "correlation", "escalation", "documentation"],
    responseStyle: "operational and process-driven",
  },
};

// =====================================================
// DETECTION-REACTIVE BEHAVIOR MODIFIERS
// =====================================================

export interface DetectionReaction {
  signalType: string;
  behaviorChange: string;
  responseModifier: string;
}

export const detectionReactions: DetectionReaction[] = [
  {
    signalType: "hint_dependency",
    behaviorChange: "Switch to question-based guidance",
    responseModifier: "Instead of giving you the answer, let me ask you: ",
  },
  {
    signalType: "rapid_submissions",
    behaviorChange: "Slow down and ask for reasoning",
    responseModifier: "Before your next attempt, walk me through your reasoning. What evidence led you to that conclusion?",
  },
  {
    signalType: "focus_loss",
    behaviorChange: "Recommend structured analysis",
    responseModifier: "Let's refocus. I suggest a structured approach: ",
  },
  {
    signalType: "repeated_failures",
    behaviorChange: "Break problem into smaller steps",
    responseModifier: "Let's break this down into smaller pieces. First, let's focus on: ",
  },
  {
    signalType: "copy_paste_detected",
    behaviorChange: "Emphasize understanding over answers",
    responseModifier: "Understanding the 'why' is more important than the answer. Can you explain: ",
  },
  {
    signalType: "time_anomaly",
    behaviorChange: "Check understanding and engagement",
    responseModifier: "I noticed some unusual patterns. Let's make sure we're on the same page: ",
  },
  {
    signalType: "off_topic_query",
    behaviorChange: "Redirect to current challenge",
    responseModifier: "Let's stay focused on the current challenge. For this specific scenario: ",
  },
];

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

export function getProfileForCategory(category: ChallengeCategory): TutorProfile {
  return tutorProfiles[category];
}

export function getModeModifier(mode: TutorMode): ModeModifier {
  return modeModifiers[mode];
}

export function getDetectionReaction(signalType: string): DetectionReaction | undefined {
  return detectionReactions.find(r => r.signalType === signalType);
}

// =====================================================
// MODE-SPECIFIC QUESTIONS PER CATEGORY
// =====================================================

export interface CategoryModeQuestions {
  learning: string[];
  defensive: string[];
  soc: string[];
}

export const categoryModeQuestions: Record<ChallengeCategory, CategoryModeQuestions> = {
  phishing: {
    learning: [
      "What email headers reveal the true sender?",
      "How do SPF, DKIM, and DMARC work together?",
      "What are the signs of a lookalike domain?",
      "Explain how credential harvesting works",
    ],
    defensive: [
      "How do I configure email filtering rules?",
      "What training helps users spot phishing?",
      "How should I report phishing to my org?",
      "What controls prevent credential theft?",
    ],
    soc: [
      "How do I triage a reported phishing email?",
      "What artifacts should I collect for IOCs?",
      "How do I track a phishing campaign?",
      "What's the escalation path for spear phishing?",
    ],
  },
  
  malware: {
    learning: [
      "What's the difference between static and dynamic analysis?",
      "How do I calculate and verify file hashes?",
      "What persistence mechanisms are most common?",
      "How does command and control (C2) work?",
    ],
    defensive: [
      "How do I safely detonate malware in a sandbox?",
      "What endpoint protections stop this malware type?",
      "How do I write YARA rules for detection?",
      "What's the containment strategy for ransomware?",
    ],
    soc: [
      "How do I prioritize this malware alert?",
      "What's the incident response for active malware?",
      "How do I identify patient zero?",
      "What forensic artifacts confirm infection?",
    ],
  },
  
  network: {
    learning: [
      "How do I read a packet capture in Wireshark?",
      "What protocols are commonly abused by attackers?",
      "How does DNS tunneling work?",
      "What's the difference between IDS and IPS?",
    ],
    defensive: [
      "How do I configure firewall rules for this threat?",
      "What Snort/Suricata rules would detect this?",
      "How do I segment the network to limit spread?",
      "What's the best way to block C2 traffic?",
    ],
    soc: [
      "How do I correlate network events with endpoints?",
      "What's the timeline for this network intrusion?",
      "How do I identify lateral movement patterns?",
      "What evidence proves data exfiltration?",
    ],
  },
  
  cryptography: {
    learning: [
      "Is this encoding or encryption?",
      "How do I perform frequency analysis?",
      "What's the difference between symmetric and asymmetric?",
      "How do I identify the cipher type?",
    ],
    defensive: [
      "What makes encryption implementation secure?",
      "How should keys be stored and rotated?",
      "What cipher modes are vulnerable to attacks?",
      "How do I detect weak cryptographic usage?",
    ],
    soc: [
      "How do I analyze encrypted C2 channels?",
      "What indicates crypto-mining activity?",
      "How do I handle encrypted malware payloads?",
      "What's the playbook for ransomware encryption?",
    ],
  },
  
  "web-security": {
    learning: [
      "How does SQL injection actually work?",
      "What's the difference between reflected and stored XSS?",
      "How do CSRF tokens protect against attacks?",
      "What makes authentication vulnerable?",
    ],
    defensive: [
      "How do I implement proper input validation?",
      "What security headers should I configure?",
      "How do I protect against session hijacking?",
      "What's the secure way to handle file uploads?",
    ],
    soc: [
      "How do I analyze WAF alerts for true positives?",
      "What logs show SQL injection attempts?",
      "How do I trace the source of a web attack?",
      "What's the response for a data breach via web?",
    ],
  },
  
  forensics: {
    learning: [
      "Where do I start a forensic investigation?",
      "What are the most valuable Windows artifacts?",
      "How do I build an accurate timeline?",
      "What's the chain of custody and why does it matter?",
    ],
    defensive: [
      "How do I preserve evidence properly?",
      "What logging should be enabled for forensics?",
      "How do I prepare systems for incident response?",
      "What tools should be in a forensics toolkit?",
    ],
    soc: [
      "How do I prioritize forensic artifacts?",
      "What's the handoff process from SOC to forensics?",
      "How do I document findings for legal proceedings?",
      "What memory artifacts indicate compromise?",
    ],
  },
  
  "social-engineering": {
    learning: [
      "What pretexting techniques are used here?",
      "How does authority manipulation work?",
      "What psychological triggers are being exploited?",
      "How do I identify information gathering attempts?",
    ],
    defensive: [
      "What policies prevent social engineering?",
      "How do I train employees to verify requests?",
      "What callback procedures should exist?",
      "How do I protect against vishing attacks?",
    ],
    soc: [
      "How do I investigate a social engineering report?",
      "What's the response for a successful pretext?",
      "How do I assess the damage from SE attacks?",
      "What indicators show targeted SE campaigns?",
    ],
  },
};

export function getSuggestedQuestions(category: ChallengeCategory, mode: TutorMode): string[] {
  const categoryQuestions = categoryModeQuestions[category];
  
  if (!categoryQuestions) {
    // Fallback for unknown categories
    return [
      "What concepts should I understand here?",
      "How would you approach this challenge?",
      "What should I look for first?",
    ];
  }
  
  return categoryQuestions[mode] || categoryQuestions.learning;
}

export function isConceptAllowed(category: ChallengeCategory, concept: string): boolean {
  const profile = tutorProfiles[category];
  const conceptLower = concept.toLowerCase();
  
  // Check if concept matches any forbidden concepts
  const isForbidden = profile.forbiddenConcepts.some(
    fc => conceptLower.includes(fc.toLowerCase())
  );
  
  if (isForbidden) return false;
  
  // Check if concept matches allowed concepts
  return profile.allowedConcepts.some(
    ac => conceptLower.includes(ac.toLowerCase())
  );
}
