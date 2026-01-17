import { motion } from 'framer-motion';
import { StudentLayout } from '@/components/shared';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Target, 
  Clock, 
  Award,
  Shield,
  Activity,
  Network,
  AlertTriangle,
  FileSearch,
  Lock
} from 'lucide-react';

const mockProgress = {
  completedChallenges: 3,
  totalChallenges: 10,
  totalPoints: 475,
  averageScore: 87,
  currentStreak: 5,
  longestStreak: 12,
  totalTimeSpent: 180, // minutes
};

const mockSkills = [
  { area: 'Threat Detection', level: 65, icon: AlertTriangle, color: 'text-orange-400' },
  { area: 'Incident Response', level: 45, icon: Shield, color: 'text-blue-400' },
  { area: 'Security Analysis', level: 55, icon: FileSearch, color: 'text-purple-400' },
  { area: 'Risk Assessment', level: 30, icon: Activity, color: 'text-yellow-400' },
  { area: 'Network Defense', level: 50, icon: Network, color: 'text-cyan-400' },
  { area: 'Compliance', level: 40, icon: Lock, color: 'text-green-400' },
];

const mockHistory = [
  { 
    id: 'ch-001',
    title: 'Phishing Email Analysis',
    category: 'phishing',
    completedAt: '2025-01-17T14:30:00Z',
    score: 95,
    timeSpent: 25,
    attempts: 1,
  },
  { 
    id: 'ch-004',
    title: 'Social Engineering Assessment',
    category: 'social-engineering',
    completedAt: '2025-01-16T11:00:00Z',
    score: 88,
    timeSpent: 30,
    attempts: 2,
  },
  { 
    id: 'ch-003',
    title: 'Network Traffic Analysis',
    category: 'network',
    completedAt: '2025-01-15T16:45:00Z',
    score: 78,
    timeSpent: 45,
    attempts: 3,
  },
];

export default function ProgressPage() {
  const { user } = useAuthStore();
  const completionPercentage = (mockProgress.completedChallenges / mockProgress.totalChallenges) * 100;

  return (
    <StudentLayout 
      title="Your Progress" 
      subtitle="Track your cybersecurity journey"
    >
      <div className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="cyber-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Challenges</p>
                    <p className="text-2xl font-bold text-foreground">
                      {mockProgress.completedChallenges}/{mockProgress.totalChallenges}
                    </p>
                  </div>
                </div>
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
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Score</p>
                    <p className="text-2xl font-bold text-foreground">
                      {mockProgress.averageScore}%
                    </p>
                  </div>
                </div>
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
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Time Spent</p>
                    <p className="text-2xl font-bold text-foreground">
                      {Math.floor(mockProgress.totalTimeSpent / 60)}h {mockProgress.totalTimeSpent % 60}m
                    </p>
                  </div>
                </div>
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
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-cyber-purple/10 flex items-center justify-center">
                    <Award className="w-6 h-6 text-cyber-purple" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Points</p>
                    <p className="text-2xl font-bold text-foreground">
                      {mockProgress.totalPoints}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Skills Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="cyber-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Skill Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mockSkills.map((skill, index) => {
                  const Icon = skill.icon;
                  return (
                    <motion.div
                      key={skill.area}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${skill.color}`} />
                          <span className="text-sm font-medium text-foreground">
                            {skill.area}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {skill.level}%
                        </span>
                      </div>
                      <Progress value={skill.level} className="h-2" />
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Challenge History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="cyber-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Challenge History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Challenge
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Category
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Score
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Time
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Attempts
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Completed
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockHistory.map((item, index) => (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        className="border-b border-border/50 hover:bg-muted/30"
                      >
                        <td className="py-3 px-4">
                          <span className="font-medium text-foreground">
                            {item.title}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="capitalize">
                            {item.category.replace('-', ' ')}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-semibold ${
                            item.score >= 90 ? 'text-success' : 
                            item.score >= 70 ? 'text-warning' : 
                            'text-destructive'
                          }`}>
                            {item.score}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {item.timeSpent}m
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {item.attempts}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {new Date(item.completedAt).toLocaleDateString()}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </StudentLayout>
  );
}
