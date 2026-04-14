import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, FileText, CreditCard } from "lucide-react";
import { employeeService } from '@/services/employeeService';
import { SalaryComponent } from '@/types/salary';

interface SalaryOverviewProps {
  selectedMonth: string;
}

export function SalaryOverview({ selectedMonth }: SalaryOverviewProps) {
  const [totalPayroll, setTotalPayroll] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);
  const [processedPayments, setProcessedPayments] = useState(0);

  useEffect(() => {
    async function fetchKpi() {
      const employees = await employeeService.getAllEmployees();
      const stored = localStorage.getItem('salaryComponents');
      const componentsByEmp = stored ? JSON.parse(stored) : {};
      const processedPaymentsData = JSON.parse(localStorage.getItem('processedPayments') || '{}');
      const monthlyComponents = JSON.parse(localStorage.getItem('monthlyComponents') || '{}');
      
      let payroll = 0;
      let pending = 0;
      let processed = 0;

      employees.forEach(emp => {
        // Use monthly components if available for the selected month, else fallback
        const monthCompsByEmp = (monthlyComponents[selectedMonth] && monthlyComponents[selectedMonth][emp.id])
          ? monthlyComponents[selectedMonth][emp.id]
          : (componentsByEmp[emp.id] || []);
        let earnings = 0, deductions = 0;
        monthCompsByEmp.forEach((c: SalaryComponent) => {
          if (c.type === 'earning') {
            earnings += c.isPercentage ? (emp.salary * c.amount) / 100 : c.amount;
          } else {
            deductions += c.isPercentage ? (emp.salary * c.amount) / 100 : c.amount;
          }
        });
        const net = emp.salary + earnings - deductions;
        payroll += net;
        // Determine payment status for this employee for the selected month
        const isProcessed = processedPaymentsData[selectedMonth] && monthlyComponents[selectedMonth] && monthlyComponents[selectedMonth][emp.id];
        if (isProcessed) {
          processed += 1;
        } else {
          pending += 1;
        }
      });

      setTotalPayroll(payroll);
      setPendingPayments(pending);
      setProcessedPayments(processed);
    }
    fetchKpi();
  }, [selectedMonth]);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{totalPayroll.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">For selected month</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingPayments}</div>
          <p className="text-xs text-muted-foreground">Employees awaiting payment</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Processed Payments</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{processedPayments}</div>
          <p className="text-xs text-muted-foreground">Payments completed this month</p>
        </CardContent>
      </Card>
    </div>
  );
}
