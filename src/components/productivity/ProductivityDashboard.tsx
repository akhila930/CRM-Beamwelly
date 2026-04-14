import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { productivityService } from "@/services/productivityService";
import { ProductivityMetrics } from "@/types/productivity";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function ProductivityDashboard() {
  const [period, setPeriod] = useState<string>("week");
  const [employeeMetrics, setEmployeeMetrics] = useState<ProductivityMetrics | null>(null);
  const [teamMetrics, setTeamMetrics] = useState<ProductivityMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchProductivityData();
    }
  }, [user, period]);

  const fetchProductivityData = async () => {
    try {
      setLoading(true);
      const [employeeData, teamData] = await Promise.all([
        productivityService.getEmployeeProductivity(user!.id, period),
        user?.department ? productivityService.getTeamProductivity(user.department, period) : Promise.resolve([])
      ]);
      setEmployeeMetrics(employeeData);
      setTeamMetrics(teamData);
    } catch (error: any) {
      console.error('Error fetching productivity data:', error);
      toast.error("Failed to fetch productivity data");
    } finally {
      setLoading(false);
    }
  };

  const formatMetric = (value: number, type: 'percentage' | 'time' | 'number' = 'number') => {
    if (type === 'percentage') return `${value.toFixed(1)}%`;
    if (type === 'time') return `${value.toFixed(1)} hours`;
    return value.toString();
  };

  const MetricCard = ({ title, value, type }: { title: string; value: number; type?: 'percentage' | 'time' | 'number' }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatMetric(value, type)}</div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Productivity Dashboard</h2>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last 7 days</SelectItem>
            <SelectItem value="month">Last 30 days</SelectItem>
            <SelectItem value="year">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList>
          <TabsTrigger value="personal">Personal Metrics</TabsTrigger>
          {user?.department && <TabsTrigger value="team">Team Metrics</TabsTrigger>}
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          {loading ? (
            <div>Loading metrics...</div>
          ) : employeeMetrics ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard title="Total Tasks" value={employeeMetrics.total_tasks} />
              <MetricCard title="Completed Tasks" value={employeeMetrics.completed_tasks} />
              <MetricCard title="Completion Rate" value={employeeMetrics.completion_rate} type="percentage" />
              <MetricCard title="Average Completion Time" value={employeeMetrics.average_completion_time} type="time" />
              <MetricCard title="Pending Tasks" value={employeeMetrics.pending_tasks} />
              <MetricCard title="Overdue Tasks" value={employeeMetrics.overdue_tasks} />
            </div>
          ) : (
            <div>No metrics available</div>
          )}
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          {loading ? (
            <div>Loading team metrics...</div>
          ) : teamMetrics.length > 0 ? (
            <div className="space-y-8">
              {teamMetrics.map((metric) => (
                <Card key={metric.employee_id} className="p-4">
                  <CardHeader>
                    <CardTitle>Employee #{metric.employee_id}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <MetricCard title="Completion Rate" value={metric.completion_rate} type="percentage" />
                      <MetricCard title="Total Tasks" value={metric.total_tasks} />
                      <MetricCard title="Completed Tasks" value={metric.completed_tasks} />
                      <MetricCard title="Average Completion Time" value={metric.average_completion_time} type="time" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div>No team metrics available</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 