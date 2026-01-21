import { create } from 'zustand';
import type { Challenge, ChallengeCategory, DifficultyLevel, ChallengeStatus } from '@/types';

interface ChallengeFilters {
  category: ChallengeCategory | 'all';
  difficulty: DifficultyLevel | 'all';
  status: ChallengeStatus | 'all';
  search: string;
}

interface ChallengeState {
  challenges: Challenge[];
  activeChallenge: Challenge | null;
  filters: ChallengeFilters;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setChallenges: (challenges: Challenge[]) => void;
  setActiveChallenge: (challenge: Challenge | null) => void;
  setFilters: (filters: Partial<ChallengeFilters>) => void;
  resetFilters: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getFilteredChallenges: () => Challenge[];
}

const defaultFilters: ChallengeFilters = {
  category: 'all',
  difficulty: 'all',
  status: 'all',
  search: '',
};

export const useChallengeStore = create<ChallengeState>((set, get) => ({
  challenges: [],
  activeChallenge: null,
  filters: defaultFilters,
  isLoading: false,
  error: null,

  setChallenges: (challenges) => {
    set({ challenges });
  },

  setActiveChallenge: (challenge) => {
    set({ activeChallenge: challenge });
  },

  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  resetFilters: () => {
    set({ filters: defaultFilters });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  setError: (error) => {
    set({ error });
  },

  getFilteredChallenges: () => {
    const { challenges, filters } = get();
    
    return challenges.filter((challenge) => {
      // Category filter
      if (filters.category !== 'all' && challenge.category !== filters.category) {
        return false;
      }
      
      // Difficulty filter
      if (filters.difficulty !== 'all' && challenge.difficulty !== filters.difficulty) {
        return false;
      }
      
      // Status filter
      if (filters.status !== 'all' && challenge.status !== filters.status) {
        return false;
      }
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          challenge.title.toLowerCase().includes(searchLower) ||
          challenge.description.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  },
}));
