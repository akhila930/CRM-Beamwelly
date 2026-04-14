import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskList } from "@/components/task/TaskList";
import { ProductivityChart } from "@/components/task/ProductivityChart";
import { ProductivityMetrics } from "@/components/task/ProductivityMetrics";
import { useAuth } from "@/contexts/AuthContext";
import { useFadeIn } from "@/lib/animations";
import { MyTasks } from "@/components/MyTasks";
import { useEmployees } from "@/contexts/EmployeeContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Employee } from '@/types/employee';
import { employeeService } from '@/services/employeeService';

export default function TaskManagement() {
  const [selectedTab, setSelectedTab] = useState("my-tasks");
  const [refreshKey, setRefreshKey] = useState(0);
  const fadeStyle = useFadeIn();
  const { user } = useAuth();
  const { getEmployeeByEmail } = useEmployees();
  const [employee, setEmployee] = useState<any>(null);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }
      try {
        const emp = await getEmployeeByEmail(user.email);
        setEmployee(emp);
      } catch (error) {
        console.error("Error fetching employee:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [getEmployeeByEmail, user?.email, user?.role]);

  // Robustly fetch all employees for admin or task assigners
  useEffect(() => {
    const shouldFetchAll = user?.role === 'admin' || employee?.can_assign_tasks;
    if (!shouldFetchAll) return;
    const fetchAll = async () => {
      try {
        const employees = await employeeService.getAllEmployees();
        setAllEmployees(employees);
        console.log('Fetched all employees for task assignment:', employees);
      } catch (e) {
        setAllEmployees([]);
        console.error('Failed to fetch all employees:', e);
      }
    };
    fetchAll();
  }, [user?.role, employee?.can_assign_tasks]);

  const handleRefresh = () => {
    console.log('handleRefresh called in TaskManagement');
    setRefreshKey((k) => k + 1);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex min-h-screen w-full bg-gray-50/40">
      <Sidebar />
      <div className="flex-1">
        <Header title="Task & Productivity" />
        <main className="flex-1 p-6 md:p-8">
          <div style={fadeStyle} className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Task & Productivity</h1>
            <p className="text-muted-foreground">
              Manage tasks, track progress, and analyze productivity metrics
            </p>
          </div>

          <div className="mt-8">
            <ProductivityMetrics key={refreshKey} refreshKey={refreshKey} />
          </div>

          <div className="mt-8">
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="my-tasks">My Tasks</TabsTrigger>
                {(employee?.can_assign_tasks || user?.role === "admin") && (
                  <>
                    <TabsTrigger value="all-tasks">All Tasks</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  </>
                )}
              </TabsList>
              <TabsContent value="my-tasks">
                <MyTasks employeeEmail={user?.email} />
              </TabsContent>
              {(employee?.can_assign_tasks || user?.role === "admin") && (
                <>
                  <TabsContent value="all-tasks">
                    <TaskList isAdmin employees={allEmployees} onTaskChange={handleRefresh} />
                  </TabsContent>
                  <TabsContent value="analytics">
                    <div className="space-y-6">
                      <ProductivityChart refreshKey={refreshKey} />
                    </div>
                  </TabsContent>
                </>
              )}
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
