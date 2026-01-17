import { config } from '@/lib/config';
import progressData from '@/data/progress.json';
import type { UserProgress, SkillBreakdown, ChallengeProgress } from '@/types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockProgressService = {
  async getProgress(userId: string): Promise<UserProgress | null> {
    await delay(config.mockDelay);
    
    const progress = (progressData as Record<string, UserProgress>)[userId];
    return progress || null;
  },
  
  async getSkillBreakdown(userId: string): Promise<SkillBreakdown[]> {
    await delay(config.mockDelay);
    
    const progress = (progressData as Record<string, UserProgress>)[userId];
    return progress?.skills || [];
  },
  
  async getChallengeHistory(
    userId: string,
    limit?: number
  ): Promise<{ attempts: ChallengeProgress[]; total: number }> {
    await delay(config.mockDelay);
    
    // Mock challenge history
    const mockHistory: ChallengeProgress[] = [
      {
        challengeId: 'ch-001',
        userId,
        status: 'completed',
        startedAt: '2025-01-17T14:00:00Z',
        completedAt: '2025-01-17T14:30:00Z',
        attempts: 1,
        hintsUsed: 0,
        timeSpent: 1800,
        score: 95,
      },
      {
        challengeId: 'ch-004',
        userId,
        status: 'completed',
        startedAt: '2025-01-16T10:30:00Z',
        completedAt: '2025-01-16T11:00:00Z',
        attempts: 2,
        hintsUsed: 1,
        timeSpent: 1800,
        score: 88,
      },
      {
        challengeId: 'ch-002',
        userId,
        status: 'in-progress',
        startedAt: '2025-01-17T15:00:00Z',
        attempts: 1,
        hintsUsed: 1,
        timeSpent: 900,
      },
    ];
    
    const limited = limit ? mockHistory.slice(0, limit) : mockHistory;
    
    return {
      attempts: limited,
      total: mockHistory.length,
    };
  },
};

export type MockProgressService = typeof mockProgressService;
