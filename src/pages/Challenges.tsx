import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Target,
  Lock,
  CheckCircle,
  Clock,
  ChevronRight,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { StudentLayout } from '@/components/shared';
import { useChallengeStore } from '@/store/challengeStore';
import { challengeService } from '@/services';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Challenge, ChallengeCategory, DifficultyLevel } from '@/types';

const categoryColors: Record<string, string> = {
  phishing: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  malware: 'bg-red-500/20 text-red-400 border-red-500/30',
  network: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'social-engineering': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  cryptography: 'bg-green-500/20 text-green-400 border-green-500/30',
  'web-security': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  forensics: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

const difficultyConfig: Record<DifficultyLevel, { color: string; label: string; dots: number }> = {
  beginner: { color: 'text-green-400', label: 'Beginner', dots: 1 },
  intermediate: { color: 'text-yellow-400', label: 'Intermediate', dots: 2 },
  advanced: { color: 'text-orange-400', label: 'Advanced', dots: 3 },
  expert: { color: 'text-red-400', label: 'Expert', dots: 4 },
};

const categories: { value: ChallengeCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'phishing', label: 'Phishing' },
  { value: 'malware', label: 'Malware' },
  { value: 'network', label: 'Network' },
  { value: 'social-engineering', label: 'Social Engineering' },
  { value: 'cryptography', label: 'Cryptography' },
  { value: 'web-security', label: 'Web Security' },
  { value: 'forensics', label: 'Forensics' },
];

const difficulties: { value: DifficultyLevel | 'all'; label: string }[] = [
  { value: 'all', label: 'All Levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
];

function ChallengeCard({ challenge, index }: { challenge: Challenge; index: number }) {
  const difficulty = difficultyConfig[challenge.difficulty];
  const isLocked = challenge.status === 'locked';
  const isCompleted = challenge.status === 'completed';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className={`
        cyber-card border-border h-full transition-all duration-300
        ${isLocked ? 'opacity-60' : 'hover:border-primary/50 cursor-pointer'}
        ${isCompleted ? 'border-success/30' : ''}
      `}>
        <CardContent className="p-6 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <Badge 
              variant="outline" 
              className={categoryColors[challenge.category]}
            >
              {challenge.category.replace('-', ' ')}
            </Badge>
            {isLocked && <Lock className="w-4 h-4 text-muted-foreground" />}
            {isCompleted && <CheckCircle className="w-4 h-4 text-success" />}
          </div>

          {/* Title & Description */}
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {challenge.title}
          </h3>
          <p className="text-sm text-muted-foreground flex-1 line-clamp-2 mb-4">
            {challenge.description}
          </p>

          {/* Meta */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              {/* Difficulty */}
              <div className="flex items-center gap-1">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${
                      i < difficulty.dots 
                        ? difficulty.color.replace('text-', 'bg-') 
                        : 'bg-muted'
                    }`}
                  />
                ))}
                <span className={`ml-1 ${difficulty.color}`}>
                  {difficulty.label}
                </span>
              </div>
            </div>

            {/* Time & Points */}
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{challenge.estimatedTime}m</span>
              </div>
              <div className="font-semibold text-primary">
                {challenge.points} pts
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-4 pt-4 border-t border-border">
            {isLocked ? (
              <Button disabled className="w-full" variant="secondary">
                <Lock className="w-4 h-4 mr-2" />
                Complete prerequisites
              </Button>
            ) : isCompleted ? (
              <Button variant="outline" className="w-full" asChild>
                <Link to={`/challenges/${challenge.id}`}>
                  Review Challenge
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            ) : (
              <Button className="w-full cyber-button" asChild>
                <Link to={`/challenges/${challenge.id}`}>
                  {challenge.status === 'in-progress' ? 'Continue' : 'Start Challenge'}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Challenges() {
  const { 
    challenges, 
    setChallenges, 
    filters, 
    setFilters, 
    resetFilters,
    getFilteredChallenges,
    isLoading,
    setLoading 
  } = useChallengeStore();

  const [searchValue, setSearchValue] = useState(filters.search);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ search: searchValue });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue, setFilters]);

  // Load challenges on mount
  useEffect(() => {
    const loadChallenges = async () => {
      setLoading(true);
      try {
        const { challenges } = await challengeService.getChallenges();
        setChallenges(challenges);
      } catch (error) {
        console.error('Failed to load challenges:', error);
      } finally {
        setLoading(false);
      }
    };
    loadChallenges();
  }, [setChallenges, setLoading]);

  const filteredChallenges = getFilteredChallenges();
  const hasActiveFilters = filters.category !== 'all' || 
                          filters.difficulty !== 'all' || 
                          filters.search !== '';

  return (
    <StudentLayout 
      title="Challenges" 
      subtitle="Test your cybersecurity skills"
    >
      <div className="space-y-6">
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search challenges..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-10 bg-card border-border"
            />
            {searchValue && (
              <button
                type="button"
                title="Clear search"
                onClick={() => setSearchValue('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <Select
            value={filters.category}
            onValueChange={(value) => setFilters({ category: value as ChallengeCategory | 'all' })}
          >
            <SelectTrigger className="w-full sm:w-48 bg-card border-border">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Difficulty Filter */}
          <Select
            value={filters.difficulty}
            onValueChange={(value) => setFilters({ difficulty: value as DifficultyLevel | 'all' })}
          >
            <SelectTrigger className="w-full sm:w-44 bg-card border-border">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {difficulties.map((diff) => (
                <SelectItem key={diff.value} value={diff.value}>
                  {diff.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => {
                resetFilters();
                setSearchValue('');
              }}
              className="shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </motion.div>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredChallenges.length} of {challenges.length} challenges
          </p>
        </div>

        {/* Challenge Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="h-64 animate-pulse bg-card border-border">
                <CardContent className="p-6">
                  <div className="h-6 w-24 bg-muted rounded mb-4" />
                  <div className="h-6 w-3/4 bg-muted rounded mb-2" />
                  <div className="h-4 w-full bg-muted rounded mb-4" />
                  <div className="h-4 w-2/3 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredChallenges.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChallenges.map((challenge, index) => (
              <ChallengeCard 
                key={challenge.id} 
                challenge={challenge} 
                index={index} 
              />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No challenges found
            </h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your filters or search terms
            </p>
            <Button onClick={() => {
              resetFilters();
              setSearchValue('');
            }}>
              Clear Filters
            </Button>
          </motion.div>
        )}
      </div>
    </StudentLayout>
  );
}
