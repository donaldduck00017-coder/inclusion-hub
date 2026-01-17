import { config } from '@/lib/config';
import challengesData from '@/data/challenges.json';
import type { Challenge, ChallengeCategory, DifficultyLevel, SubmissionResult } from '@/types';

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
  
  async submitAnswer(
    challengeId: string,
    answer: string | string[],
    attemptId: string
  ): Promise<SubmissionResult> {
    await delay(config.mockDelay * 2);
    
    // Mock correct answers - in real implementation, this would be validated server-side
    const isCorrect = Math.random() > 0.3; // 70% success rate for demo
    
    const challenge = challenges.find(c => c.id === challengeId);
    
    return {
      success: true,
      correct: isCorrect,
      feedback: isCorrect
        ? 'Excellent work! Your analysis is correct.'
        : 'Not quite right. Review your analysis and try again.',
      pointsEarned: isCorrect ? challenge?.points : 0,
      hintsAvailable: 3,
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
