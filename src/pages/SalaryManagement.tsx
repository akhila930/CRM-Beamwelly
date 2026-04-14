import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalaryOverview } from "@/components/salary/SalaryOverview";
import { SalaryList } from "@/components/salary/SalaryList";
import PayslipViewer from "@/components/salary/PayslipViewer";
import { useAuth } from "@/contexts/AuthContext";
import { useFadeIn } from "@/lib/animations";
import { useEffect } from "react";
import { employeeService } from "@/services/employeeService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/api";

export default function SalaryManagement() {
  const [selectedTab, setSelectedTab] = useState("payroll");
  const fadeStyle = useFadeIn();
  const { user } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    employeeService.getAllEmployees().then(setEmployees);
  }, []);

  const handleProcessPayments = async () => {
    try {
      // Get all employees and their salary components
      const stored = localStorage.getItem('salaryComponents');
      const componentsByEmp = stored ? JSON.parse(stored) : {};
      
      // Calculate total processed amount and send emails
      let totalProcessed = 0;
      const emailPromises = [];

      for (const emp of employees) {
        const comps = componentsByEmp[emp.id] || [];
        let earnings = 0, deductions = 0;
        comps.forEach(c => {
          if (c.type === 'earning') {
            earnings += c.isPercentage ? (emp.salary * c.amount) / 100 : c.amount;
          } else {
            deductions += c.isPercentage ? (emp.salary * c.amount) / 100 : c.amount;
          }
        });
        const net = emp.salary + earnings - deductions;
        totalProcessed += net;

        // Generate payslip data for email
        const payslipData = {
          employeeName: emp.name,
          employeeId: emp.id,
          basicSalary: emp.salary,
          totalEarnings: earnings,
          totalDeductions: deductions,
          netSalary: net,
          components: comps,
          month: new Date(selectedMonth).toLocaleString('default', { month: 'long' }),
          year: new Date(selectedMonth).getFullYear()
        };

        // Send email for each employee
        emailPromises.push(
          api.post('/api/salary/send-payslip', {
            employeeId: emp.id,
            employeeEmail: emp.email,
            month: payslipData.month,
            year: payslipData.year,
            payslipData: payslipData
          }).catch(error => {
            console.error(`Failed to send email to ${emp.email}:`, error);
            return null;
          })
        );
      }

      // Store processed amount in localStorage
      const processedPayments = JSON.parse(localStorage.getItem('processedPayments') || '{}');
      processedPayments[selectedMonth] = totalProcessed;
      localStorage.setItem('processedPayments', JSON.stringify(processedPayments));

      // Store the components for this month
      const monthlyComponents = JSON.parse(localStorage.getItem('monthlyComponents') || '{}');
      monthlyComponents[selectedMonth] = componentsByEmp;
      localStorage.setItem('monthlyComponents', JSON.stringify(monthlyComponents));

      // Wait for all emails to be sent
      await Promise.all(emailPromises);

      toast({
        title: "Payments Processed",
        description: `Successfully processed payments totaling ₹${totalProcessed.toLocaleString()} and sent payslips to all employees`,
      });

      // Refresh the page to update the UI
      window.location.reload();
    } catch (error) {
      console.error('Payment processing error:', error);
      toast({
        title: "Error",
        description: "Failed to process payments. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Generate month options (last 12 months)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: date.toLocaleString('default', { month: 'long', year: 'numeric' })
    };
  });

  return (
    <div className="flex min-h-screen w-full bg-gray-50/40">
      <Sidebar />
      <div className="flex-1">
        <Header title="Salary Management" />
        <main className="flex-1 p-6 md:p-8">
          <div style={fadeStyle} className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Salary Management</h1>
            <p className="text-muted-foreground">
              View and manage payroll, process payments, and track salary KPIs
            </p>
          </div>

          {/* Employee View: Only show their own payslip and history */}
          {user?.role === 'employee' ? (
            <div className="mt-8 max-w-xl mx-auto">
              <div className="mb-4 font-semibold">Select Month</div>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="mt-6">
                <PayslipViewer employeeId={user.id} selectedMonth={selectedMonth} employeeMode={true} />
              </div>
            </div>
          ) : (
            // Admin/HR/Manager View: Full access
            <>
              <div className="mt-8">
                <SalaryOverview selectedMonth={selectedMonth} />
              </div>

              <div className="mt-8">
                <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="payroll">Payroll Management</TabsTrigger>
                  </TabsList>
                  <TabsContent value="payroll">
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select month" />
                          </SelectTrigger>
                          <SelectContent>
                            {monthOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button onClick={handleProcessPayments}>
                          Process Payments
                        </Button>
                      </div>
                      <SalaryList selectedMonth={selectedMonth} />
                      <div className="mt-8">
                        <div className="mb-2 font-semibold">View Employee Payslip</div>
                        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                          <SelectTrigger className="w-[300px]">
                            <SelectValue placeholder="Select employee" />
                          </SelectTrigger>
                          <SelectContent>
                            {employees.map(emp => (
                              <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedEmployee && (
                          <div className="mt-4">
                            <PayslipViewer 
                              employeeId={selectedEmployee} 
                              selectedMonth={selectedMonth}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
