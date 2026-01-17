import { motion } from 'framer-motion';
import { 
  Target, 
  CheckCircle, 
  Flame, 
  TrendingUp, 
  Clock,
  ChevronRight,
  Zap,
  Award
} from 'lucide-react';
import { StudentLayout } from '@/components/shared';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';

const mockStats = {
  completed: 3,
  total: 10,
  successRate: 87,
  currentStreak: 5,
  totalPoints: 475,
};

const mockActiveChallenges = [
  {
    id: 'ch-002',
    title: 'Malware Signature Detection',
    category: 'malware',
    progress: 45,
    difficulty: 'intermediate',
  },
  {
    id: 'ch-003',
    title: 'Network Traffic Analysis',
    category: 'network',
    progress: 20,
    difficulty: 'intermediate',
  },
];

const mockRecentActivity = [
  {
    id: '1',
    type: 'challenge_completed',
    title: 'Phishing Email Analysis',
    time: '2 hours ago',
    score: 95,
  },
  {
    id: '2',
    type: 'hint_used',
    title: 'Malware Signature Detection',
    time: '1 hour ago',
  },
  {
    id: '3',
    type: 'challenge_started',
    title: 'Network Traffic Analysis',
    time: '30 minutes ago',
  },
];

const categoryColors: Record<string, string> = {
  phishing: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  malware: 'bg-red-500/20 text-red-400 border-red-500/30',
  network: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'social-engineering': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  cryptography: 'bg-green-500/20 text-green-400 border-green-500/30',
  'web-security': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  forensics: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

const difficultyColors: Record<string, string> = {
  beginner: 'text-green-400',
  intermediate: 'text-yellow-400',
  advanced: 'text-orange-400',
  expert: 'text-red-400',
};

export default function Dashboard() {
  const { user } = useAuthStore();
  
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <StudentLayout 
      title={`Welcome back, ${user?.name?.split(' ')[0] || 'Analyst'}`}
      subtitle={currentDate}
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="cyber-card border-border">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-3xl font-bold text-foreground mt-1">
                      {mockStats.completed}/{mockStats.total}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <Progress 
                  value={(mockStats.completed / mockStats.total) * 100} 
                  className="mt-4 h-1.5"
                />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="cyber-card border-border">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                    <p className="text-3xl font-bold text-foreground mt-1">
                      {mockStats.successRate}%
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-success" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  +5% from last week
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="cyber-card border-border">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Streak</p>
                    <p className="text-3xl font-bold text-foreground mt-1">
                      {mockStats.currentStreak} days
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Flame className="w-5 h-5 text-warning" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Best: 12 days
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="cyber-card border-border">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Points</p>
                    <p className="text-3xl font-bold text-foreground mt-1">
                      {mockStats.totalPoints}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-cyber-purple/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-cyber-purple" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Rank: Top 15%
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Challenges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card className="cyber-card border-border h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Active Challenges
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/challenges" className="text-primary hover:text-primary/80">
                    View all
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockActiveChallenges.map((challenge, index) => (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="p-4 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-foreground">
                          {challenge.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="outline" 
                            className={categoryColors[challenge.category]}
                          >
                            {challenge.category}
                          </Badge>
                          <span className={`text-xs ${difficultyColors[challenge.difficulty]}`}>
                            {challenge.difficulty}
                          </span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/challenges/${challenge.id}`}>
                          Continue
                        </Link>
                      </Button>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={challenge.progress} className="flex-1 h-2" />
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {challenge.progress}%
                      </span>
                    </div>
                  </motion.div>
                ))}

                {mockActiveChallenges.length === 0 && (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No active challenges</p>
                    <Button className="mt-4" asChild>
                      <Link to="/challenges">Browse Challenges</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="cyber-card border-border h-full">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockRecentActivity.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + index * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                        ${activity.type === 'challenge_completed' ? 'bg-success/20' : ''}
                        ${activity.type === 'hint_used' ? 'bg-warning/20' : ''}
                        ${activity.type === 'challenge_started' ? 'bg-primary/20' : ''}
                      `}>
                        {activity.type === 'challenge_completed' && (
                          <CheckCircle className="w-4 h-4 text-success" />
                        )}
                        {activity.type === 'hint_used' && (
                          <Award className="w-4 h-4 text-warning" />
                        )}
                        {activity.type === 'challenge_started' && (
                          <Target className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">
                          {activity.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.time}
                          {activity.score && ` • Score: ${activity.score}`}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="cyber-card border-border bg-gradient-to-r from-primary/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/30">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Ready for a new challenge?
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Your skill level unlocks 7 new challenges
                    </p>
                  </div>
                </div>
                <Button className="cyber-button" asChild>
                  <Link to="/challenges">
                    Start Next Challenge
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </StudentLayout>
  );
}
