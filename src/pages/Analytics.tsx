import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardStats } from "@/components/analytics/DashboardStats";
import { ModuleOverview } from "@/components/analytics/ModuleOverview";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { useFadeIn } from "@/lib/animations";
import api from "@/lib/axios";
import { useState } from "react";
import { toast } from "sonner";

export default function Analytics() {
  const fadeStyle = useFadeIn();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      toast.info("Preparing export data...");

      // Fetch dashboard stats
      const response = await api.get('/analytics/dashboard-stats');
      
      if (!response.data) {
        throw new Error("Failed to fetch data for export");
      }

      // Convert the data to CSV format
      const stats = response.data;
      let csvContent = "Category,Metric,Value\n";

      // Add employee stats
      csvContent += `Employees,Total,${stats.employees.total}\n`;
      csvContent += `Employees,Active,${stats.employees.active}\n`;
      
      // Add task stats
      csvContent += `Tasks,Total,${stats.tasks.total}\n`;
      csvContent += `Tasks,Completed,${stats.tasks.completed}\n`;
      csvContent += `Tasks,Overdue,${stats.tasks.overdue}\n`;
      csvContent += `Tasks,Completion Rate,${stats.tasks.completion_rate}%\n`;
      
      // Add lead stats
      csvContent += `Leads,Total,${stats.leads.total}\n`;
      csvContent += `Leads,Active,${stats.leads.active}\n`;
      csvContent += `Leads,Converted,${stats.leads.converted}\n`;
      csvContent += `Leads,Conversion Rate,${stats.leads.conversion_rate}%\n`;
      
      // Add client stats
      csvContent += `Clients,Total,${stats.clients.total}\n`;
      csvContent += `Clients,Active,${stats.clients.active}\n`;
      csvContent += `Clients,Total Services,${stats.clients.total_services}\n`;
      
      // Add recruitment stats
      csvContent += `Recruitment,Total Candidates,${stats.recruitment.total_candidates}\n`;
      csvContent += `Recruitment,Active Candidates,${stats.recruitment.active_candidates}\n`;
      csvContent += `Recruitment,Hired Candidates,${stats.recruitment.hired_candidates}\n`;
      csvContent += `Recruitment,Hiring Rate,${stats.recruitment.hiring_rate}%\n`;
      
      // Add leaves stats
      csvContent += `Leaves,Pending,${stats.leaves.pending}\n`;
      csvContent += `Leaves,Approved,${stats.leaves.approved}\n`;
      
      // Add budget stats
      csvContent += `Budget,Total Budget,${stats.budget.total_budget}\n`;
      csvContent += `Budget,Total Spent,${stats.budget.total_spent}\n`;
      csvContent += `Budget,Remaining,${stats.budget.remaining}\n`;
      csvContent += `Budget,Utilization Rate,${stats.budget.utilization_rate}%\n`;

      // Create a CSV file and trigger download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      
      link.href = url;
      link.setAttribute('download', `equitywala-analytics-${date}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Export completed successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-gray-50/40">
      <Sidebar />
      <div className="flex-1">
        <Header title="Analytics & Reporting" />
        <main className="flex-1 p-6 md:p-8">
          <div style={fadeStyle} className="flex flex-col md:flex-row justify-between md:items-center space-y-2 md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Analytics & Reporting</h1>
              <p className="text-muted-foreground">
                Overview of all modules and their current status
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExport}
                disabled={exporting}
              >
                <FileDown className="mr-2 h-4 w-4" />
                {exporting ? 'Exporting...' : 'Export All Data'}
              </Button>
            </div>
          </div>

          <div className="mt-8">
            <DashboardStats />
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <ModuleOverview module="employees" title="Employee Overview" />
            <ModuleOverview module="tasks" title="Task Overview" />
            <ModuleOverview module="leads" title="Lead Overview" />
            <ModuleOverview module="clients" title="Client Overview" />
            <ModuleOverview module="recruitment" title="Recruitment Overview" />
          </div>
        </main>
      </div>
    </div>
  );
}
