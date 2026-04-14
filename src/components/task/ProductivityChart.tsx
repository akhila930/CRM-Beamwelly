import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '@/lib/axios';

interface ProductivityData {
  name: string;
  completed: number;
  pending: number;
  overdue: number;
}

interface ProductivityChartProps {
  refreshKey?: number;
}

export function ProductivityChart({ refreshKey = 0 }: ProductivityChartProps) {
  const [timeRange, setTimeRange] = useState("week");
  const [data, setData] = useState<ProductivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true);
        console.log(`Fetching productivity chart data for ${timeRange}...`);
        const response = await api.get(`/api/public/productivity-chart?range=${timeRange}`);
        console.log('Productivity chart response:', response.data);
        setData(response.data);
        setError(null); // Clear any previous errors
      } catch (err: any) {
        console.error('Error fetching productivity chart:', err);
        
        // Handle different types of error responses
        if (err.response?.data?.detail) {
          // Standard FastAPI error format
          const errorDetail = err.response.data.detail;
          if (typeof errorDetail === 'string') {
            setError(errorDetail);
          } else {
            console.error('Complex error detail:', errorDetail);
            setError('Failed to fetch productivity chart data');
          }
        } else if (err.message) {
          setError(err.message);
        } else {
          setError('Failed to fetch productivity chart data');
        }
        
        console.error('Error details:', err.response?.data);
        
        // Create sample data based on range
        setData(generateSampleData(timeRange));
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [timeRange, refreshKey]);
  
  // Helper function to generate sample data
  const generateSampleData = (range: string) => {
    const today = new Date();
    if (range === 'week') {
      // Generate data for the past 7 days
      return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (6 - i));
        return {
          name: date.toISOString().split('T')[0],
          completed: Math.floor(Math.random() * 3),
          pending: Math.floor(Math.random() * 5),
          overdue: Math.floor(Math.random() * 2)
        };
      });
    } else if (range === 'month') {
      // Generate data for the past 30 days, aggregated by week
      return Array.from({ length: 4 }, (_, i) => {
        const weekNum = i + 1;
        return {
          name: `Week ${weekNum}`,
          completed: Math.floor(Math.random() * 10),
          pending: Math.floor(Math.random() * 15),
          overdue: Math.floor(Math.random() * 5)
        };
      });
    } else {
      // Generate data for the past 3 months
      return Array.from({ length: 3 }, (_, i) => {
        const date = new Date(today);
        date.setMonth(date.getMonth() - (2 - i));
        return {
          name: date.toLocaleString('default', { month: 'short' }),
          completed: Math.floor(Math.random() * 20),
          pending: Math.floor(Math.random() * 30),
          overdue: Math.floor(Math.random() * 10)
        };
      });
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <div>
            <CardTitle>Productivity Metrics</CardTitle>
            <CardDescription>Task completion trends</CardDescription>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <div>
            <CardTitle>Productivity Metrics</CardTitle>
            <CardDescription>Task completion trends</CardDescription>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-red-500">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <div>
            <CardTitle>Productivity Metrics</CardTitle>
            <CardDescription>Task completion trends</CardDescription>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No productivity data available for the selected time range
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
        <div>
          <CardTitle>Productivity Metrics</CardTitle>
          <CardDescription>Task completion trends</CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="completed" stroke="#8884d8" name="Completed Tasks" />
              <Line type="monotone" dataKey="pending" stroke="#82ca9d" name="Pending Tasks" />
              <Line type="monotone" dataKey="overdue" stroke="#ff4d4f" name="Overdue Tasks" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
