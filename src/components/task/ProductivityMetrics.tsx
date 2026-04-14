import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, AlertTriangle, BarChart } from "lucide-react";
import api from '@/lib/axios';

interface ProductivityMetricsProps {
  refreshKey?: number;
}

interface ProductivityMetricsData {
  completed: {
    count: number;
    percentage: number;
  };
  inProgress: {
    count: number;
    percentage: number;
  };
  overdue: {
    count: number;
    percentage: number;
  };
  completionRate?: number;
}

export function ProductivityMetrics({ refreshKey }: ProductivityMetricsProps) {
  const [metrics, setMetrics] = useState<ProductivityMetricsData>({
    completed: { count: 0, percentage: 0 },
    inProgress: { count: 0, percentage: 0 },
    overdue: { count: 0, percentage: 0 },
    completionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('ProductivityMetrics useEffect triggered. refreshKey:', refreshKey);
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        console.log('Fetching user productivity metrics...');
        const response = await api.get('/api/tasks/productivity-metrics');
        console.log('User productivity metrics response:', response.data);
        setMetrics(response.data); // Directly set the fetched data
        setError(null); // Clear any previous errors
      } catch (err: any) {
        console.error('Error fetching user productivity metrics:', err);
        
        // Handle different types of error responses
        if (err.response?.data?.detail) {
          // Standard FastAPI error format
          const errorDetail = err.response.data.detail;
          if (typeof errorDetail === 'string') {
            setError(errorDetail);
          } else {
            console.error('Complex error detail:', errorDetail);
            setError('Failed to fetch productivity metrics');
          }
        } else if (err.message) {
          setError(err.message);
        } else {
          setError('Failed to fetch productivity metrics');
        }
        
        console.error('Error details:', err.response?.data);
        
        // Set metrics to default empty state on error
        setMetrics({
          completed: { count: 0, percentage: 0 },
          inProgress: { count: 0, percentage: 0 },
          overdue: { count: 0, percentage: 0 },
          completionRate: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [refreshKey]); // Depend on refreshKey to refetch when tasks change

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    // Display an error message and then default to zeroed-out metrics
    return (
      <div>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error loading metrics</p>
          <p className="text-sm">{error}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card><CardHeader><CardTitle className="text-sm font-medium">Completed</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">0</div><Progress value={0} className="h-2 mt-2" /><p className="text-xs text-muted-foreground mt-2">0% of total tasks</p></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-sm font-medium">In Progress</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">0</div><Progress value={0} className="h-2 mt-2" /><p className="text-xs text-muted-foreground mt-2">0% of total tasks</p></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-sm font-medium">Overdue</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">0</div><Progress value={0} className="h-2 mt-2" /><p className="text-xs text-muted-foreground mt-2">0% of total tasks</p></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-sm font-medium">Completion Rate</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">0%</div><Progress value={0} className="h-2 mt-2" /><p className="text-xs text-muted-foreground mt-2">Average completion rate</p></CardContent></Card>
             </div>
      </div>
    );
  }

  // Render metrics using the 'metrics' state which now always has default values
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.completed.count}</div>
          <Progress value={metrics.completed.percentage} className="h-2 mt-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {metrics.completed.percentage}% of total tasks
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          <Clock className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.inProgress.count}</div>
          <Progress value={metrics.inProgress.percentage} className="h-2 mt-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {metrics.inProgress.percentage}% of total tasks
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.overdue.count}</div>
          <Progress value={metrics.overdue.percentage} className="h-2 mt-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {metrics.overdue.percentage}% of total tasks
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          <BarChart className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.completionRate}%</div>
          <Progress value={metrics.completionRate} className="h-2 mt-2" />
          <p className="text-xs text-muted-foreground mt-2">
            Average completion rate
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
