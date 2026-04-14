import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Mail } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Payslip, SalaryComponent } from "@/types/salary";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useEffect, useState, useRef } from "react";
import { employeeService } from '@/services/employeeService';
import { toast } from '@/components/ui/use-toast';
import api from '@/lib/axios';
import html2pdf from 'html2pdf.js';
import { useAuth } from "@/contexts/AuthContext";

interface PayslipViewerProps {
  payslip?: Payslip;
  employeeMode?: boolean;
  employeeId?: string;
  selectedMonth?: string;
}

function PayslipViewerComponent({ payslip, employeeMode = false, employeeId, selectedMonth }: PayslipViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [employee, setEmployee] = useState<any>(null);
  const [components, setComponents] = useState<SalaryComponent[]>([]);
  const [loading, setLoading] = useState(false);
  const payslipRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Parse selected month or use current month
  const [year, month] = selectedMonth 
    ? selectedMonth.split('-').map(Number)
    : [new Date().getFullYear(), new Date().getMonth() + 1];
  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const paymentDate = new Date(year, month - 1, lastDayOfMonth);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let emp;
        
        if (employeeMode) {
          // In employee mode, use the logged-in user's email
          if (!user?.email) {
            setError('Employee email not found');
            setLoading(false);
            return;
          }
          emp = await employeeService.getEmployeeByEmail(user.email);
        } else if (employeeId) {
          // In admin mode, use the provided employee ID
          emp = await employeeService.getEmployeeById(employeeId);
        } else {
          setError('No employee identifier provided');
          setLoading(false);
          return;
        }

        if (!emp) {
          setError('Employee not found');
          setLoading(false);
          return;
        }

        setEmployee(emp);
        const empIdStr = String(emp.id);

        // Fetch components from localStorage
        let comps: SalaryComponent[] = [];
        if (selectedMonth) {
          const monthlyComponentsRaw = localStorage.getItem('monthlyComponents');
          if (monthlyComponentsRaw) {
            const monthlyComponents = JSON.parse(monthlyComponentsRaw);
            if (monthlyComponents[selectedMonth] && monthlyComponents[selectedMonth][empIdStr]) {
              comps = monthlyComponents[selectedMonth][empIdStr];
              console.log('[PayslipViewer] Found processed components for month:', selectedMonth, 'components:', comps);
            } else {
              console.log('[PayslipViewer] No processed components for month:', selectedMonth, 'for employee:', empIdStr);
            }
          } else {
            console.log('[PayslipViewer] No monthlyComponents in localStorage');
          }
        }
        
        if (comps.length === 0) {
          const stored = localStorage.getItem('salaryComponents');
          if (stored) {
            const parsed = JSON.parse(stored);
            comps = parsed[empIdStr] || [];
            console.log('[PayslipViewer] Fallback to salaryComponents:', comps);
          } else {
            console.log('[PayslipViewer] No salaryComponents in localStorage');
          }
        }
        
        setComponents(comps);
      } catch (err) {
        console.error('PayslipViewer fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch employee data');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchEmployeeData();
    }
  }, [isOpen, employeeId, employeeMode, selectedMonth, user?.email]);

  // Calculate payslip values
  let basicSalary = 0, totalEarnings = 0, totalDeductions = 0, netSalary = 0;
  if (employee) {
    basicSalary = employee.salary;
    components.forEach((c: SalaryComponent) => {
      if (c.type === 'earning') {
        totalEarnings += c.isPercentage ? (basicSalary * c.amount) / 100 : c.amount;
      } else {
        totalDeductions += c.isPercentage ? (basicSalary * c.amount) / 100 : c.amount;
      }
    });
    netSalary = basicSalary + totalEarnings - totalDeductions;
  }

  // Compose payslip object
  const displayedPayslip: Payslip = payslip || {
    id: employeeId || 'sample',
    employeeId: employeeId || 'sample',
    employeeName: employee ? employee.name : 'No data',
    month: monthName,
    year,
    basicSalary,
    components,
    totalEarnings,
    totalDeductions,
    netSalary,
    paymentStatus: 'pending',
    generatedDate: new Date().toISOString(),
  };

  // Download payslip as PDF
  const handleDownload = async () => {
    if (payslipRef.current) {
      const element = payslipRef.current;
      const opt = {
        margin: 1,
        filename: `payslip_${employee?.name}_${monthName}_${year}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      try {
        await html2pdf().set(opt).from(element).save();
        toast({
          title: "Success",
          description: "Payslip downloaded successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to download payslip",
          variant: "destructive",
        });
      }
    }
  };

  // Send payslip email
  const handleEmail = async () => {
    if (!employee?.email) {
      toast({
        title: "Error",
        description: "Employee email not found",
        variant: "destructive",
      });
      return;
    }

    try {
      // First generate the PDF data
      if (!payslipRef.current) {
        toast({
          title: "Error",
          description: "Failed to generate payslip",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Generating PDF",
        description: "Please wait while we generate your payslip...",
      });

      const element = payslipRef.current;
      const opt = {
        margin: 1,
        filename: `payslip_${employee?.name}_${monthName}_${year}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      // Generate PDF as base64
      const pdf = await html2pdf().set(opt).from(element).outputPdf('datauristring');
      
      // Prepare request body to match backend schema
      const requestBody: any = {
        employeeId: String(employee.id),
        employeeEmail: employee.email,
        month: monthName,
        year: Number(year),
        payslipData: {
          employeeName: employee.name,
          employeeId: employee.id,
          basicSalary: basicSalary,
          totalEarnings: totalEarnings,
          totalDeductions: totalDeductions,
          netSalary: netSalary,
          components: components,
          month: monthName,
          year: Number(year)
        }
      };
      if (pdf && typeof pdf === 'string' && pdf.startsWith('data:application/pdf;base64,')) {
        requestBody.pdfBase64 = pdf.split(',')[1];
      }

      // Send email with PDF attachment
      const response = await api.post('/api/salary/send-payslip', requestBody);
      
      if (response.data.success) {
        toast({
          title: "Success",
          description: `Payslip sent to ${employee.email}`,
        });
      } else {
        throw new Error(response.data.message || 'Failed to send payslip');
      }
    } catch (error: any) {
      console.error('Email error:', error);
      let errorMessage = "Failed to send payslip email";
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map((d: any) => d.msg).join(', ');
        } else if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        } else {
          errorMessage = JSON.stringify(error.response.data.detail);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">View Payslip</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Payslip for {monthName} {year}</DialogTitle>
          <DialogDescription>
            This is your salary statement for the month.
          </DialogDescription>
        </DialogHeader>
        {error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : loading || !employee ? (
          <div className="p-8 text-center">Loading payslip...</div>
        ) : (
          <div ref={payslipRef} className="p-6 bg-white rounded-lg border max-h-[70vh] overflow-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="font-bold text-xl">PAYSLIP</h2>
                <p className="text-sm text-muted-foreground">
                  For the period: {monthName} {year}
                </p>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h4 className="font-semibold text-sm">Employee Information</h4>
                <div className="mt-2 space-y-1">
                  <p className="text-sm">Name: <span className="font-medium">{employee.name}</span></p>
                  <p className="text-sm">Employee ID: <span className="font-medium">{employee.id}</span></p>
                  <p className="text-sm">Department: <span className="font-medium">{employee.department}</span></p>
                  <p className="text-sm">Email: <span className="font-medium">{employee.email}</span></p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-sm">Payment Information</h4>
                <div className="mt-2 space-y-1">
                  <p className="text-sm">Payment Date: <span className="font-medium">{paymentDate.toLocaleDateString()}</span></p>
                  <p className="text-sm">Payment Method: <span className="font-medium">Bank Transfer</span></p>
                  <p className="text-sm">Bank Account: <span className="font-medium">XXXX-XXXX-XXXX-1234</span></p>
                </div>
              </div>
            </div>
            <h4 className="font-semibold mb-2">Earnings & Deductions</h4>
            <div className="rounded-md border overflow-hidden mb-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount (₹)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Basic Salary</TableCell>
                    <TableCell className="text-right">{basicSalary.toFixed(2)}</TableCell>
                  </TableRow>
                  {components.length > 0 && (
                    <>
                      <TableRow>
                        <TableCell colSpan={2} className="bg-muted/50 font-semibold">
                          Earnings
                        </TableCell>
                      </TableRow>
                      {components.filter(c => c.type === 'earning').map(c => (
                        <TableRow key={c.id}>
                          <TableCell>{c.name}{c.isPercentage ? ' (%)' : ''}</TableCell>
                          <TableCell className="text-right">{(c.isPercentage ? (basicSalary * c.amount) / 100 : c.amount).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={2} className="bg-muted/50 font-semibold">
                          Deductions
                        </TableCell>
                      </TableRow>
                      {components.filter(c => c.type === 'deduction').map(c => (
                        <TableRow key={c.id}>
                          <TableCell>{c.name}{c.isPercentage ? ' (%)' : ''}</TableCell>
                          <TableCell className="text-right">{(c.isPercentage ? (basicSalary * c.amount) / 100 : c.amount).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="bg-muted/20 p-4 rounded-md">
              <div className="flex justify-between font-semibold">
                <span>Total Earnings:</span>
                <span>₹{totalEarnings.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold mt-1">
                <span>Total Deductions:</span>
                <span>₹{totalDeductions.toFixed(2)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-bold text-lg">
                <span>Net Salary:</span>
                <span>₹{netSalary.toFixed(2)}</span>
              </div>
            </div>
            <div className="mt-8 text-center text-sm text-muted-foreground">
              <p>This is a computer-generated payslip and does not require a signature.</p>
              <p>For any queries, please contact the HR department.</p>
            </div>
          </div>
        )}
        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" size="sm" onClick={handleEmail}>
            <Mail className="mr-2 h-4 w-4" />
            Email
          </Button>
          <Button size="sm" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { PayslipViewerComponent as PayslipViewer };
export default PayslipViewerComponent;
