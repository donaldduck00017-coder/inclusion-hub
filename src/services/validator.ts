import type { Challenge, ValidationRule } from '@/types';

export interface ValidationResult {
  correct: boolean;
  reason: string;
  matchDetails?: {
    matched: number;
    required: number;
    keywords?: string[];
  };
}

/**
 * Validation Engine
 * 
 * Deterministic, per-challenge validation.
 * Runs in the service layer (never in UI).
 * Designed to evolve into backend validation.
 * 
 * Supports:
 * - exact: Case-insensitive exact match
 * - keywords: Partial keyword matching with threshold
 * - regex: Pattern matching
 */
export function validateAnswer(challenge: Challenge, input: string): ValidationResult {
  const validation = challenge.validation;

  // No validation rules = pass (scaffold mode)
  if (!validation) {
    return { 
      correct: true, 
      reason: 'No validation rules defined (scaffold mode)' 
    };
  }

  // Normalize input (trim whitespace, lowercase)
  const normalized = input.toLowerCase().trim();

  // Empty input always fails
  if (!normalized) {
    return {
      correct: false,
      reason: 'Empty submission'
    };
  }

  switch (validation.type) {
    case 'exact':
      return validateExact(normalized, validation);
    
    case 'keywords':
      return validateKeywords(normalized, validation);
    
    case 'regex':
      return validateRegex(normalized, validation);
    
    default:
      return { 
        correct: false, 
        reason: 'Unknown validation type' 
      };
  }
}

/**
 * Exact match validation
 * Case-insensitive comparison
 */
function validateExact(
  input: string, 
  validation: { type: 'exact'; answer: string }
): ValidationResult {
  const expected = validation.answer.toLowerCase().trim();
  const correct = input === expected;

  return {
    correct,
    reason: correct 
      ? 'Exact match confirmed' 
      : 'Answer does not match expected value'
  };
}

/**
 * Keyword matching validation
 * Requires matching a threshold of keywords
 */
function validateKeywords(
  input: string, 
  validation: { type: 'keywords'; keywords: string[]; minMatch?: number }
): ValidationResult {
  const keywords = validation.keywords.map(k => k.toLowerCase());
  const matchedKeywords = keywords.filter(k => input.includes(k));
  
  // Default: require at least half of keywords
  const minRequired = validation.minMatch ?? Math.ceil(keywords.length / 2);
  const correct = matchedKeywords.length >= minRequired;

  return {
    correct,
    reason: correct
      ? `Matched ${matchedKeywords.length}/${keywords.length} required keywords`
      : `Only matched ${matchedKeywords.length}/${keywords.length} keywords (${minRequired} required)`,
    matchDetails: {
      matched: matchedKeywords.length,
      required: minRequired,
      keywords: matchedKeywords
    }
  };
}

/**
 * Regex pattern validation
 * Matches input against a regex pattern
 */
function validateRegex(
  input: string, 
  validation: { type: 'regex'; pattern: string; flags?: string }
): ValidationResult {
  try {
    const regex = new RegExp(validation.pattern, validation.flags || 'i');
    const correct = regex.test(input);

    return {
      correct,
      reason: correct 
        ? 'Pattern matched successfully' 
        : 'Input does not match expected pattern'
    };
  } catch (error) {
    return {
      correct: false,
      reason: 'Invalid validation pattern'
    };
  }
}

/**
 * Get feedback message based on validation result
 * Privacy-safe: Never reveals the actual answer
 */
export function getValidationFeedback(
  result: ValidationResult, 
  challenge: Challenge
): string {
  if (result.correct) {
    return getFeedbackForCategory(challenge.category, true);
  }

  // Provide helpful but not revealing feedback
  if (result.matchDetails) {
    const { matched, required } = result.matchDetails;
    if (matched > 0) {
      return `Partial match detected. You identified ${matched} of ${required} required elements. Review your analysis and try again.`;
    }
  }

  return getFeedbackForCategory(challenge.category, false);
}

/**
 * Category-specific feedback messages
 */
function getFeedbackForCategory(category: string, correct: boolean): string {
  const feedback: Record<string, { success: string; failure: string }> = {
    'phishing': {
      success: 'Excellent! All phishing indicators correctly identified.',
      failure: 'Review the email headers and links more carefully.'
    },
    'malware': {
      success: 'Correct! Malware signature successfully identified.',
      failure: 'Check the file hashes and behavior patterns again.'
    },
    'network': {
      success: 'Network anomaly correctly detected and classified.',
      failure: 'Analyze the traffic patterns and protocols more closely.'
    },
    'social-engineering': {
      success: 'Social engineering technique correctly identified.',
      failure: 'Consider the psychological manipulation tactics being used.'
    },
    'cryptography': {
      success: 'Cipher successfully broken. Message decoded.',
      failure: 'Try different cryptanalysis techniques.'
    },
    'web-security': {
      success: 'Vulnerability successfully identified and documented.',
      failure: 'Test for common web vulnerabilities more thoroughly.'
    },
    'forensics': {
      success: 'Forensic evidence correctly analyzed.',
      failure: 'Check the system artifacts and timeline more carefully.'
    }
  };

  const categoryFeedback = feedback[category] || {
    success: 'Correct answer!',
    failure: 'Incorrect. Review your analysis and try again.'
  };

  return correct ? categoryFeedback.success : categoryFeedback.failure;
}
