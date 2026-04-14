import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { KpiCard } from "@/components/ui/kpi-card";
import {
  BarChartHorizontal,
  Users,
  UserCheck,
  Share2,
  DollarSign,
  FileText,
  MessageSquare,
  Calendar,
  CheckSquare,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useFadeIn, useSequentialFadeIn } from "@/lib/animations";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/axios";

interface DashboardStats {
  totalEmployees: number;
  activeRecruitment: number;
  budgetUtilization: number;
  pendingLeaves: number;
  employeeProductivity: number;
  openPositions: number;
  socialImpressions: number;
  budgetStatus: number;
  taskCompletion: number;
  newReports: number;
}

// KPI Card descriptions
const getEmployeeDescription = (count: number) => {
  if (count === 0) return "No employees in the system";
  if (count === 1) return "1 active team member";
  return `${count} active team members`;
};

const getRecruitmentDescription = (count: number) => {
  if (count === 0) return "No active candidates in pipeline";
  if (count === 1) return "1 active candidate in pipeline";
  return `${count} active candidates in pipeline`;
};

const getBudgetDescription = (percent: number) => {
  if (percent <= 0) return "No budget has been spent";
  if (percent < 25) return "Budget usage is on track";
  if (percent < 75) return "Budget usage is moderate";
  if (percent < 90) return "Budget usage is high";
  return "Budget usage is near limit";
};

const getLeaveDescription = (count: number) => {
  if (count === 0) return "No pending leave requests";
  if (count === 1) return "1 request awaiting approval";
  return `${count} requests awaiting approval`;
};

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const fadeStyle = useFadeIn();
  const cardStyles = useSequentialFadeIn(4, 200, 100);
  const moduleStyles = useSequentialFadeIn(6, 300, 50);
  const { user } = useAuth();

  useEffect(() => {
    console.log("[Dashboard] Component mounted or user changed. User object:", user);
    console.log("[Dashboard] Company name from user object:", user?.company_name);
  }, [user]);

  useEffect(() => {
    setMounted(true);
    const fetchDashboardStats = async () => {
      setLoading(true);
      try {
        console.log('Fetching dashboard stats...');
        
        // Use the configured api instance for authenticated requests
        const response = await api.get('/api/dashboard/stats');
        
        console.log('Dashboard stats response:', response.data);
        
        // Check if response data is complete
        if (response.data && typeof response.data === 'object') {
          // Create a placeholder for missing fields 
          const processedData = { 
            totalEmployees: response.data.totalEmployees ?? 0,
            activeRecruitment: response.data.activeRecruitment ?? 0, 
            budgetUtilization: response.data.budgetUtilization ?? 0,
            pendingLeaves: response.data.pendingLeaves ?? 0,
            employeeProductivity: response.data.employeeProductivity ?? 0,
            openPositions: response.data.openPositions ?? 0,
            socialImpressions: response.data.socialImpressions ?? 0,
            budgetStatus: response.data.budgetStatus ?? 0,
            taskCompletion: response.data.taskCompletion ?? 0,
            newReports: response.data.newReports ?? 0
          };
          
          console.log('Processed data:', processedData);
          setStats(processedData);
        } else {
          console.error('Invalid response format:', response.data);
          // Set default values
          setDefaultStats();
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        // Set default values on error
        setDefaultStats();
      } finally {
        setLoading(false);
      }
    };
    
    const setDefaultStats = () => {
      setStats({
        totalEmployees: 3,
        activeRecruitment: 2,
        budgetUtilization: 14,
        pendingLeaves: 1,
        employeeProductivity: 20,
        openPositions: 3,
        socialImpressions: 5,
        budgetStatus: 14,
        taskCompletion: 20,
        newReports: 2
      });
    };
    
    fetchDashboardStats();
  }, []);

  // Add debug output
  useEffect(() => {
    console.log('Current stats state:', stats);
  }, [stats]);

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen w-full bg-gray-50/40">
      <Sidebar />
      <div className="flex-1">
        <Header title="Dashboard" />
        <main className="flex-1 p-6 md:p-8">
          <div style={fadeStyle} className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, {user?.name || 'Admin'}
            </h1>
            {user?.role === 'admin' && user?.company_name && (
              <p className="text-lg font-semibold text-brand-red flex items-center gap-2">
                <span>🏢</span> {user.company_name}
              </p>
            )}
            <p className="text-muted-foreground">
              Here's an overview of your company's performance
            </p>
          </div>

          {/* KPI Summary */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
            <KpiCard
              title="Total Employees"
              value={loading ? "..." : (stats?.totalEmployees?.toString() || "0")}
              description={loading ? "Loading employee data..." : getEmployeeDescription(stats?.totalEmployees || 0)}
              icon={<Users className="h-5 w-5" />}
              color="primary"
              delay={100}
            />
            <KpiCard
              title="Active Recruitment"
              value={loading ? "..." : (stats?.activeRecruitment?.toString() || "0")}
              description={loading ? "Loading recruitment data..." : getRecruitmentDescription(stats?.activeRecruitment || 0)}
              icon={<UserCheck className="h-5 w-5" />}
              color="blue"
              delay={200}
            />
            <KpiCard
              title="Budget Utilization"
              value={loading ? "..." : (stats?.budgetUtilization ? `${stats.budgetUtilization}%` : "0%")}
              description={loading ? "Loading budget data..." : getBudgetDescription(stats?.budgetUtilization || 0)}
              icon={<DollarSign className="h-5 w-5" />}
              color="green"
              delay={300}
            />
            <KpiCard
              title="Pending Leaves"
              value={loading ? "..." : (stats?.pendingLeaves?.toString() || "0")}
              description={loading ? "Loading leave data..." : getLeaveDescription(stats?.pendingLeaves || 0)}
              icon={<Calendar className="h-5 w-5" />}
              color="yellow"
              delay={400}
            />
          </div>

          {/* Module Quick Access Cards */}
          <h2 className="text-xl font-semibold mt-8 mb-4">Key Modules</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Employee Dashboard",
                description: "View employee performance & metrics",
                icon: <Users className="h-5 w-5" />,
                link: "/employee",
                stat: loading ? "Loading productivity data..." : (stats?.employeeProductivity ? `${stats.employeeProductivity}% productivity rate` : "Calculating productivity..."),
                statType: stats?.employeeProductivity && stats.employeeProductivity > 80 ? "up" : "neutral",
              },
              {
                title: "Recruitment",
                description: "Manage candidate pipeline",
                icon: <UserCheck className="h-5 w-5" />,
                link: "/recruitment",
                stat: loading ? "Loading recruitment data..." : (stats?.openPositions !== undefined ? `${stats.openPositions} ${stats.openPositions === 1 ? 'position' : 'positions'} open` : "Checking open positions..."),
                statType: "neutral",
              },
              {
                title: "Social Media",
                description: "Track campaign performance",
                icon: <Share2 className="h-5 w-5" />,
                link: "/social",
                stat: loading ? "Loading social data..." : (stats?.socialImpressions !== undefined ? `${stats.socialImpressions}K impressions this week` : "Analyzing social reach..."),
                statType: "neutral",
              },
              {
                title: "Budget",
                description: "Monitor financial data",
                icon: <DollarSign className="h-5 w-5" />,
                link: "/budget",
                stat: loading ? "Loading budget data..." : (stats?.budgetStatus !== undefined ? `${stats.budgetStatus}% of quarterly budget` : "Calculating budget status..."),
                statType: stats?.budgetStatus !== undefined && stats.budgetStatus < 80 ? "up" : "down",
              },
              {
                title: "Tasks & Productivity",
                description: "Manage team workload",
                icon: <CheckSquare className="h-5 w-5" />,
                link: "/tasks",
                stat: loading ? "Loading task data..." : (stats?.taskCompletion !== undefined ? `${stats.taskCompletion}% completion rate` : "Analyzing task completion..."),
                statType: stats?.taskCompletion && stats.taskCompletion > 90 ? "up" : "neutral",
              },
              {
                title: "Analytics",
                description: "Generate custom reports",
                icon: <BarChartHorizontal className="h-5 w-5" />,
                link: "/analytics",
                stat: loading ? "Loading analytics data..." : (stats?.newReports !== undefined ? `${stats.newReports} new ${stats.newReports === 1 ? 'report' : 'reports'} this month` : "Counting new reports..."),
                statType: "neutral",
              },
            ].map((module, i) => (
              <Card key={module.title} style={moduleStyles[i]} className="overflow-hidden border transition-all duration-300 hover:shadow-md">
                <CardHeader className="p-4 pb-0">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-md bg-gray-100">
                      {module.icon}
                    </div>
                    <Button variant="ghost" size="icon" asChild>
                      <a href={module.link}>
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                  <CardTitle className="text-base mt-2">{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="flex items-center mt-2 text-sm">
                    {module.statType === "up" && (
                      <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                    )}
                    {module.statType === "down" && (
                      <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                    )}
                    <span
                      className={
                        module.statType === "up"
                          ? "text-green-600"
                          : module.statType === "down"
                          ? "text-red-600"
                          : "text-gray-600"
                      }
                    >
                      {module.stat}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
