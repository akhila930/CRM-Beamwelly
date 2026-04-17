import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import api from '@/lib/axios';

interface ModuleOverviewProps {
  module: string;
  title: string;
}

interface ChartData {
  name: string;
  value: number;
}

export function ModuleOverview({ module, title }: ModuleOverviewProps) {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log(`Fetching data for module: ${module}`);
        const response = await api.get(`/api/analytics/module-overview/${module}`);
        console.log(`Received response:`, response.data);
        
        if (response.data && Array.isArray(response.data.data)) {
          // Filter out any entries with 0 values to clean up the chart
          const filteredData = response.data.data.filter((item: ChartData) => item.value > 0);
          setData(filteredData);
        } else if (response.data && typeof response.data.data === 'undefined') {
          console.warn(`No data field found in response for ${module}`);
          setData([]);
        } else {
          console.warn(`Unexpected data format for ${module}:`, response.data);
          setData([]);
        }
      } catch (err) {
        console.error(`Error fetching ${module} overview:`, err);
        setError('Failed to fetch module overview');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [module]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse">Loading {title}...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-red-500 mb-2">{error}</p>
              <p className="text-sm">Please check your connection and try again.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="mb-2">No data available</p>
              <p className="text-sm">There are no entries for this module yet.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 