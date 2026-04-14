import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, DollarSign, UserCheck, Users, Building2 } from "lucide-react";
import api from '@/lib/axios';
import { useAuth } from "@/contexts/AuthContext";

interface DashboardStatsBackend {
  employees: { total: number; active: number };
  recruitment: { active_candidates: number };
  budget: { utilization_rate: number };
  leaves: { pending: number };
  companyName?: string;
}

export function DashboardStats() {
  const [stats, setStats] = useState<DashboardStatsBackend | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching dashboard stats...");
        const response = await api.get('/analytics/dashboard-stats');
        console.log("Dashboard stats response:", response.data);
        setStats(response.data);
      } catch (err: any) {
        console.error('Error fetching dashboard stats:', err);
        setError(err.response?.data?.detail || 'Failed to fetch dashboard stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold text-brand-red">
          <Building2 className="h-5 w-5" />
          <span>Loading company data...</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 bg-red-50 rounded-lg border border-red-200 mb-6">
        <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Dashboard</h3>
        <p className="text-red-600">{error || 'Failed to load dashboard stats'}</p>
        <p className="text-sm text-red-500 mt-2">Please check your connection and try refreshing the page.</p>
      </div>
    );
  }

  const companyName = stats.companyName || user?.company_name || 'Your Company';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-lg font-semibold text-brand-red">
        <Building2 className="h-5 w-5" />
        <span>{companyName}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.employees?.total ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats.employees?.active ?? 0} active employees
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Recruitments</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recruitment?.active_candidates ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Open positions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.budget?.utilization_rate ?? 0}%</div>
            <p className="text-xs text-muted-foreground">
              Of total budget
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Leaves</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.leaves?.pending ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
