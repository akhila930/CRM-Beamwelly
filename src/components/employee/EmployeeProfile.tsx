import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KpiCard } from "@/components/ui/kpi-card";
import { ArrowLeft, CheckCircle, Star, Clock, UserCircle, ClipboardList, FileText, CalendarDays, Award } from "lucide-react";
import { useFadeIn } from "@/lib/animations";
import { useEmployees } from "@/contexts/EmployeeContext";
import { Employee, KpiData } from "@/types/employee";
import { toast } from "@/hooks/use-toast";

// Import profile tab components
import { ProfileTab } from "@/components/employee/profile/ProfileTab";
import { TasksTab } from "@/components/employee/profile/TasksTab";
import { DocumentsTab } from "@/components/employee/profile/DocumentsTab";
import { AttendanceTab } from "@/components/employee/profile/AttendanceTab";
import { MilestonesTab } from "@/components/employee/profile/MilestonesTab";

export function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getEmployee } = useEmployees();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [kpiData, setKpiData] = useState<KpiData>({
    tasksCompleted: "0/0",
    productivityScore: "0%",
    attendanceRate: "0%",
  });
  
  const fadeStyle = useFadeIn();
  const contentStyle = useFadeIn(200);
  
  const [selectedTab, setSelectedTab] = useState(() => localStorage.getItem('employeeProfileTab') || 'profile');
  
  useEffect(() => {
    localStorage.setItem('employeeProfileTab', selectedTab);
  }, [selectedTab]);
  
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (id) {
        try {
          const employeeData = await getEmployee(id);
          if (employeeData) {
            setEmployee(employeeData);
            calculateKpiData(employeeData);
          } else {
            toast({
              title: "Error",
              description: "Employee not found. Redirecting to employee directory...",
              variant: "destructive",
            });
            setTimeout(() => {
              navigate("/employee");
            }, 2000);
          }
        } catch (error) {
          console.error('Error fetching employee:', error);
          toast({
            title: "Error",
            description: "Failed to load employee data. Redirecting to employee directory...",
            variant: "destructive",
          });
          setTimeout(() => {
            navigate("/employee");
          }, 2000);
        }
      }
    };

    fetchEmployeeData();
  }, [id, getEmployee, navigate]);
  
  const calculateKpiData = (employee: Employee) => {
    // Task completion calculation
    const totalTasks = employee.tasks.length;
    const completedTasks = employee.tasks.filter(task => task.status === 'completed').length;
    const tasksCompleted = `${completedTasks}/${totalTasks}`;
    
    // Calculate attendance rate based on working days in the month
    let attendanceRate = "0%";
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    
    // Get the first and last day of the current month
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    
    // Calculate total working days (excluding weekends)
    let totalWorkingDays = 0;
    for (let d = new Date(firstDayOfMonth); d <= lastDayOfMonth; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0 && d.getDay() !== 6) { // Skip Saturday (6) and Sunday (0)
        totalWorkingDays++;
      }
    }
    
    // Filter attendance records for current month
    const currentMonthAttendance = employee.attendance.filter(a => {
      const attendanceDate = new Date(a.date);
      return attendanceDate.getMonth() === currentMonth && 
             attendanceDate.getFullYear() === currentYear;
    });
    
    if (totalWorkingDays > 0) {
      const presentDays = currentMonthAttendance.filter(a => a.status === 'present').length;
      const halfDays = currentMonthAttendance.filter(a => a.status === 'halfday').length;
      const presentEquivalent = presentDays + (halfDays * 0.5);
      attendanceRate = `${Math.round((presentEquivalent / totalWorkingDays) * 100)}%`;
      }
      
    // Calculate productivity score
    let productivityScore = "0%";
    if (totalWorkingDays > 0) {
      // Task completion weight (70%)
      const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      
      // Attendance weight (30%)
      const presentDays = currentMonthAttendance.filter(a => a.status === 'present').length;
      const halfDays = currentMonthAttendance.filter(a => a.status === 'halfday').length;
      const presentEquivalent = presentDays + (halfDays * 0.5);
      const attendanceWeight = (presentEquivalent / totalWorkingDays) * 100;
      
      // Calculate weighted score
      const weightedScore = (taskCompletionRate * 0.7) + (attendanceWeight * 0.3);
      productivityScore = `${Math.round(weightedScore)}%`;
    }
    
    setKpiData({
      tasksCompleted,
      productivityScore,
      attendanceRate,
    });
  };
  
  if (!employee) {
    return (
      <div className="flex min-h-screen w-full bg-gray-50/40">
        <Sidebar />
        <div className="flex-1">
          <Header title="Employee Profile" />
          <main className="flex-1 p-6 md:p-8">
            <div className="flex items-center justify-center h-[50vh]">
              <p>Loading employee data...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen w-full bg-gray-50/40">
      <Sidebar />
      <div className="flex-1">
        <Header title="Employee Profile" />
        <main className="flex-1 p-6 md:p-8">
          <div style={fadeStyle} className="space-y-2">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => navigate("/employee")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{employee.name}</h1>
                <p className="text-muted-foreground">{employee.position} • {employee.department}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mt-6">
            <KpiCard
              title="Tasks Completed"
              value={kpiData.tasksCompleted}
              description="Total tasks"
              icon={<CheckCircle className="h-5 w-5" />}
              color="primary"
            />
            <KpiCard
              title="Productivity Score"
              value={kpiData.productivityScore}
              description="Based on tasks & attendance"
              icon={<Star className="h-5 w-5" />}
              color="blue"
            />
            <KpiCard
              title="Attendance Rate"
              value={kpiData.attendanceRate}
              description="Present days"
              icon={<Clock className="h-5 w-5" />}
              color="green"
            />
          </div>

          <div className="mt-8" style={contentStyle}>
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
              <TabsList className="w-full md:w-auto grid grid-cols-3 md:inline-flex md:grid-cols-none">
                <TabsTrigger value="profile" className="flex items-center">
                  <UserCircle className="h-4 w-4 mr-2" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="tasks" className="flex items-center">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Tasks
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Documents
                </TabsTrigger>
                <TabsTrigger value="attendance" className="flex items-center">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Attendance
                </TabsTrigger>
                <TabsTrigger value="milestones" className="flex items-center">
                  <Award className="h-4 w-4 mr-2" />
                  Milestones
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile" className="mt-6 space-y-4">
                <ProfileTab employee={employee} />
              </TabsContent>
              
              <TabsContent value="tasks" className="mt-6 space-y-4">
                <TasksTab employeeId={employee.id} tasks={employee.tasks} />
              </TabsContent>
              
              <TabsContent value="documents" className="mt-6 space-y-4">
                <DocumentsTab employeeId={employee.id} documents={employee.documents} />
              </TabsContent>
              
              <TabsContent value="attendance" className="mt-6 space-y-4">
                <AttendanceTab employeeId={employee.id} attendance={employee.attendance} />
              </TabsContent>
              
              <TabsContent value="milestones" className="mt-6 space-y-4">
                <MilestonesTab employeeId={employee.id} milestones={employee.milestones} />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
