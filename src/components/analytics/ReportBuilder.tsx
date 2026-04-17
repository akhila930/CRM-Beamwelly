import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChart, FileDown, FileSpreadsheet, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart as ReBarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from "@/lib/axios";

interface ChartData {
  name: string;
  value: number;
}

interface PieData {
  name: string;
  value: number;
}

export function ReportBuilder() {
  const [module, setModule] = useState("employees");
  const [chartType, setChartType] = useState("bar");
  const [data, setData] = useState<ChartData[]>([]);
  const [pieData, setPieData] = useState<PieData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [chartResponse, pieResponse] = await Promise.all([
          api.get(`/api/analytics/report?module=${module}&type=chart`),
          api.get(`/api/analytics/report?module=${module}&type=pie`)
        ]);
        setData(chartResponse.data);
        setPieData(pieResponse.data);
      } catch (err) {
        setError('Failed to fetch report data');
        console.error('Error fetching report data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [module]);

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Custom Report Builder</CardTitle>
          <CardDescription>
            Create custom reports by selecting data sources and visualization types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Custom Report Builder</CardTitle>
          <CardDescription>
            Create custom reports by selecting data sources and visualization types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px] text-red-500">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0 && pieData.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Custom Report Builder</CardTitle>
          <CardDescription>
            Create custom reports by selecting data sources and visualization types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            No data available for the selected module
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Custom Report Builder</CardTitle>
        <CardDescription>
          Create custom reports by selecting data sources and visualization types
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">Select Module</label>
            <Select value={module} onValueChange={setModule}>
              <SelectTrigger>
                <SelectValue placeholder="Select module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employees">Employees</SelectItem>
                <SelectItem value="recruitment">Recruitment</SelectItem>
                <SelectItem value="budget">Budget</SelectItem>
                <SelectItem value="social">Social Media</SelectItem>
                <SelectItem value="leads">Leads & Clients</SelectItem>
                <SelectItem value="tasks">Tasks</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Visualization</label>
            <Tabs value={chartType} onValueChange={setChartType}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="bar">Bar</TabsTrigger>
                <TabsTrigger value="line">Line</TabsTrigger>
                <TabsTrigger value="pie">Pie</TabsTrigger>
              </TabsList>
        <TabsContent value="bar" className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
                  <ReBarChart data={Array.isArray(data) ? data : []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" name="Value" />
            </ReBarChart>
          </ResponsiveContainer>
        </TabsContent>
        <TabsContent value="line" className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={Array.isArray(data) ? data : []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#82ca9d" name="Value" />
            </LineChart>
          </ResponsiveContainer>
        </TabsContent>
        <TabsContent value="pie" className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={130}
                fill="#8884d8"
                dataKey="value"
              />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </TabsContent>
            </Tabs>
          </div>
          <div className="flex items-end gap-2">
            <Button variant="outline" className="flex-1">
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button variant="outline" className="flex-1">
              <FileDown className="mr-2 h-4 w-4" /> Download
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
