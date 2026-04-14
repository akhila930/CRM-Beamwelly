import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Select, Card, message } from 'antd';
import api from '@/lib/axios';

const { Option } = Select;

interface ChartData {
  name: string;
  actual: number | null;
  forecast: number | null;
}

const ForecastChart: React.FC = () => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [period, setPeriod] = useState<string>('6');
  const [loading, setLoading] = useState<boolean>(false);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/budget/forecast/chart?period=${period}`);
      if (response.data) {
        setChartData(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching forecast data:', error);
      message.error(error.response?.data?.detail || 'Failed to fetch forecast data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, [period]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card title="Expense Forecast" extra={
      <Select
        value={period}
        onChange={setPeriod}
        style={{ width: 120 }}
        loading={loading}
      >
        <Option value="3">3 Months</Option>
        <Option value="6">6 Months</Option>
        <Option value="12">12 Months</Option>
      </Select>
    }>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={formatCurrency} />
          <Tooltip formatter={(value) => formatCurrency(value as number)} />
          <Legend />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#8884d8"
            name="Actual Expenses"
            strokeWidth={2}
            dot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="#82ca9d"
            name="Forecasted Expenses"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default ForecastChart; 