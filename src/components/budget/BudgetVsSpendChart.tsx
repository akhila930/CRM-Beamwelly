import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { useToast } from "@/hooks/use-toast";
import api from '@/lib/axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ChartDataType {
  departments: string[];
  allocated: number[];
  spent: number[];
}

export function BudgetVsSpendChart() {
  const [chartData, setChartData] = useState<ChartDataType>({
    departments: [],
    allocated: [],
    spent: []
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchBudgetVsSpend = async () => {
      try {
        const response = await api.get('/api/budget/vs-spend');
        setChartData(response.data);
      } catch (error: any) {
        console.error('Error fetching budget vs spend data:', error);
        toast({
          title: "Error",
          description: error.response?.data?.detail || "Failed to fetch budget comparison data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBudgetVsSpend();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const data = {
    labels: chartData.departments,
    datasets: [
      {
        label: 'Allocated Budget',
        data: chartData.allocated,
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        borderColor: 'rgba(53, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: 'Spent Amount',
        data: chartData.spent,
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ₹${context.raw.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `₹${value.toLocaleString()}`,
        },
      },
    },
  };

  return <Bar data={data} options={options} />;
}
