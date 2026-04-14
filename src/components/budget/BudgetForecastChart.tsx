import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '@/lib/axios';

interface ForecastDataPoint {
  name: string;
  actual?: number;
  forecast: number;
}

interface BudgetForecastChartProps {
  period: string;
}

const BudgetForecastChart = ({ period }: BudgetForecastChartProps) => {
  const [data, setData] = useState<ForecastDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForecastData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/budget/forecast/chart?period=${period}`);
        setData(response.data);
      } catch (err) {
        setError('Failed to fetch forecast chart data');
        console.error('Error fetching forecast chart data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchForecastData();
  }, [period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px] text-red-500">
        {error}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        No forecast data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{
          top: 20,
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
        <Line 
          type="monotone" 
          dataKey="actual" 
          stroke="#8884d8" 
          name="Actual Expenses" 
          strokeWidth={2}
          dot={false}
        />
        <Line 
          type="monotone" 
          dataKey="forecast" 
          stroke="#82ca9d" 
          name="Forecasted Expenses" 
          strokeWidth={2} 
          strokeDasharray="5 5"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default BudgetForecastChart;
