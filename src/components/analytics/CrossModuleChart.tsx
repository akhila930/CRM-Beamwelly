
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function CrossModuleChart() {
  const [metric1, setMetric1] = useState("leads");
  const [metric2, setMetric2] = useState("social");
  
  // Sample data
  const data = [
    { name: 'Jan', [metric1]: 0, [metric2]: 0 },
    { name: 'Feb', [metric1]: 0, [metric2]: 0 },
    { name: 'Mar', [metric1]: 0, [metric2]: 0 },
    { name: 'Apr', [metric1]: 0, [metric2]: 0 },
    { name: 'May', [metric1]: 0, [metric2]: 0 },
    { name: 'Jun', [metric1]: 0, [metric2]: 0 },
  ];
  
  const getMetricLabel = (metric: string) => {
    switch(metric) {
      case 'leads': return 'New Leads';
      case 'social': return 'Social Media Spend';
      case 'clients': return 'Active Clients';
      case 'budget': return 'Budget Utilization';
      case 'tasks': return 'Completed Tasks';
      default: return metric;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Cross-Module Correlation</CardTitle>
        <CardDescription>
          Analyze relationships between different metrics across modules
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">First Metric</label>
            <Select value={metric1} onValueChange={setMetric1}>
              <SelectTrigger>
                <SelectValue placeholder="Select first metric" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="leads">New Leads</SelectItem>
                <SelectItem value="social">Social Media Spend</SelectItem>
                <SelectItem value="clients">Active Clients</SelectItem>
                <SelectItem value="budget">Budget Utilization</SelectItem>
                <SelectItem value="tasks">Completed Tasks</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Second Metric</label>
            <Select value={metric2} onValueChange={setMetric2}>
              <SelectTrigger>
                <SelectValue placeholder="Select second metric" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="leads">New Leads</SelectItem>
                <SelectItem value="social">Social Media Spend</SelectItem>
                <SelectItem value="clients">Active Clients</SelectItem>
                <SelectItem value="budget">Budget Utilization</SelectItem>
                <SelectItem value="tasks">Completed Tasks</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
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
              <Bar dataKey={metric1} fill="#8884d8" name={getMetricLabel(metric1)} />
              <Bar dataKey={metric2} fill="#82ca9d" name={getMetricLabel(metric2)} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground">
          <p>
            This chart shows the correlation between {getMetricLabel(metric1)} and {getMetricLabel(metric2)} over time.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
