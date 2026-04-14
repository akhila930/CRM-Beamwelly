import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { UserCheck, UserPlus, Users, UserCog } from "lucide-react";
import { useSequentialFadeIn } from "@/lib/animations";
import api from "@/lib/axios";

interface RecruitmentStats {
  total_candidates: number;
  active_candidates: number;
  hired_candidates: number;
  applied_candidates: number;
}

export const RecruitmentStats = () => {
  const [stats, setStats] = useState<RecruitmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const statStyles = useSequentialFadeIn(4, 100, 50);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/recruitment/stats');
        setStats(response.data);
        setError(null);
      } catch (err: any) {
        const errorMessage = err.response?.data?.detail || 'Failed to fetch recruitment stats';
        setError(errorMessage);
        console.error('Error fetching recruitment stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, index) => (
          <Card key={index} style={statStyles[index]}>
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                <div className="h-1.5 bg-gray-200 rounded mt-3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center py-8 text-red-500">
        {error || 'Failed to load recruitment stats'}
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Candidates",
      value: stats.total_candidates.toString(),
      icon: <Users className="h-4 w-4 text-blue-500" />,
      color: "blue",
      progress: 100
    },
    {
      label: "Active Candidates",
      value: stats.active_candidates.toString(),
      icon: <UserCog className="h-4 w-4 text-yellow-500" />,
      color: "yellow",
      progress: (stats.active_candidates / stats.total_candidates) * 100
    },
    {
      label: "Hired Candidates",
      value: stats.hired_candidates.toString(),
      icon: <UserCheck className="h-4 w-4 text-green-500" />,
      color: "green",
      progress: (stats.hired_candidates / stats.total_candidates) * 100
    },
    {
      label: "Applied Candidates",
      value: stats.applied_candidates.toString(),
      icon: <UserPlus className="h-4 w-4 text-purple-500" />,
      color: "purple",
      progress: (stats.applied_candidates / stats.total_candidates) * 100
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <Card key={stat.label} style={statStyles[index]}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
              <span className="p-1 rounded-full bg-gray-100">{stat.icon}</span>
            </div>
            <div className="text-2xl font-bold mb-1">{stat.value}</div>
            <Progress 
              value={stat.progress} 
              className={`h-1.5 mt-3 bg-${stat.color}-100`} 
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
