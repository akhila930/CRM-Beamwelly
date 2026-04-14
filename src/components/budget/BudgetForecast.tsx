import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription,
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import BudgetForecastChart from "./BudgetForecastChart";
import api from '@/lib/axios';

interface DepartmentForecast {
  department: string;
  projectedAmount: number;
  changePercentage: number;
}

interface BudgetForecastData {
  projectedExpenses: number;
  expenseChangePercentage: number;
  recommendedBudget: number;
  departmentForecasts: DepartmentForecast[];
}

export function BudgetForecast() {
  const [forecastPeriod, setForecastPeriod] = useState("6");
  const [forecastData, setForecastData] = useState<BudgetForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchForecast = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/budget/forecast?period=${forecastPeriod}`);
      setForecastData(response.data);
    } catch (err) {
      setError('Failed to fetch budget forecast');
      console.error('Error fetching budget forecast:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, [forecastPeriod]);

  const handleUpdateForecast = () => {
    fetchForecast();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !forecastData) {
    return (
      <div className="text-center py-8 text-red-500">
        {error || 'Failed to load budget forecast'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Budget Forecasting</h2>
          <p className="text-muted-foreground">Predict future budget trends based on historical data</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={forecastPeriod} onValueChange={setForecastPeriod}>
            <SelectTrigger className="w-[180px]">
              <span>Forecast Period</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Next 3 Months</SelectItem>
              <SelectItem value="6">Next 6 Months</SelectItem>
              <SelectItem value="12">Next 12 Months</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={handleUpdateForecast}>
            <RefreshCw className="mr-2 h-4 w-4" /> Update Forecast
          </Button>
        </div>
      </div>
      
      {/* Forecast Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Projected Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-2xl font-bold">
                ₹{(forecastData?.projectedExpenses || 0).toLocaleString()}
              </div>
              <div className={`ml-2 flex items-center ${(forecastData?.expenseChangePercentage || 0) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {(forecastData?.expenseChangePercentage || 0) >= 0 ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                <span className="text-sm">{Math.abs(forecastData?.expenseChangePercentage || 0)}% from previous period</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">For next {forecastPeriod} months</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Budget Recommendation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-2xl font-bold">
                ₹{(forecastData?.recommendedBudget || 0).toLocaleString()}
              </div>
              <div className="ml-2 flex items-center text-blue-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="text-sm">Based on projected needs</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">For next budget cycle</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Forecast Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Forecast</CardTitle>
          <CardDescription>Projected expenses over the next {forecastPeriod} months</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] w-full">
          <BudgetForecastChart period={forecastPeriod} />
        </CardContent>
      </Card>
      
      {/* Department Forecasts */}
      <h3 className="text-xl font-semibold mt-8 mb-4">Department Forecasts</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {(forecastData?.departmentForecasts || []).map((dept) => (
          <Card key={dept.department}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{dept.department}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-xl font-bold">₹{(dept.projectedAmount || 0).toLocaleString()}</div>
                <div className={`flex items-center ${(dept.changePercentage || 0) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {(dept.changePercentage || 0) >= 0 ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  )}
                  <span className="text-xs">{Math.abs(dept.changePercentage || 0)}%</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Projected for next period</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
