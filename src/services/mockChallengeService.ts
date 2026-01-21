import { config } from '@/lib/config';
import challengesData from '@/data/challenges.json';
import type { Challenge, ChallengeCategory, DifficultyLevel, SubmissionResult } from '@/types';
import { validateAnswer } from "../services/validator";
import { getValidationFeedback } from "../services/validator";
const challenges = challengesData as Challenge[];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockChallengeService = {
  async getChallenges(params?: {
    category?: ChallengeCategory;
    difficulty?: DifficultyLevel;
    page?: number;
    limit?: number;
  }): Promise<{ challenges: Challenge[]; total: number; page: number; hasMore: boolean }> {
    await delay(config.mockDelay);
    
    let filtered = [...challenges];
    
    if (params?.category) {
      filtered = filtered.filter(c => c.category === params.category);
    }
    
    if (params?.difficulty) {
      filtered = filtered.filter(c => c.difficulty === params.difficulty);
    }
    
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const start = (page - 1) * limit;
    const end = start + limit;
    
    const paginated = filtered.slice(start, end);
    
    return {
      challenges: paginated,
      total: filtered.length,
      page,
      hasMore: end < filtered.length,
    };
  },
  
  async getChallenge(id: string): Promise<Challenge | null> {
    await delay(config.mockDelay);
    return challenges.find(c => c.id === id) || null;
  },
  
  /**
   * Submit answer with deterministic validation
   * 
   * Validation happens in the service layer (never UI).
   * This preserves: Frontend = control plane, Backend = decision plane
   */
  async submitAnswer(
    challengeId: string,
    answer: string | string[],
    attemptId: string
  ): Promise<SubmissionResult> {
    await delay(config.mockDelay * 2);
    
    const challenge = challenges.find(c => c.id === challengeId);
    
    if (!challenge) {
      return {
        success: false,
        correct: false,
        feedback: 'Challenge not found',
        pointsEarned: 0,
        hintsAvailable: 0,
      };
    }

    // Normalize array answers to string
    const answerStr = Array.isArray(answer) ? answer.join(' ') : answer;
    
    // Run deterministic validation
    const result = validateAnswer(challenge, answerStr);
    
    // Generate category-appropriate feedback
    const feedback = getValidationFeedback(result, challenge);
    
    return {
      success: true,
      correct: result.correct,
      feedback,
      pointsEarned: result.correct ? challenge.points : 0,
      hintsAvailable: challenge.hints.length,
    };
  },
  
  async getHint(challengeId: string, hintLevel: number): Promise<string> {
    await delay(config.mockDelay);
    
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge || hintLevel < 0 || hintLevel >= challenge.hints.length) {
      throw new Error('Hint not available');
    }
    
    return challenge.hints[hintLevel];
  },
};

export type MockChallengeService = typeof mockChallengeService;
