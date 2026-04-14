import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Eye, Search, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { employeeService } from '@/services/employeeService';
import { Employee } from '@/types/employee';
import { SalaryComponent, Payslip } from '@/types/salary';
import PayslipViewer from "./PayslipViewer";
import { toast } from '@/components/ui/use-toast';

interface SalaryListProps {
  selectedMonth: string;
}

export function SalaryList({ selectedMonth }: SalaryListProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salaryComponents, setSalaryComponents] = useState<{ [employeeId: string]: SalaryComponent[] }>({});
  const [showComponentForm, setShowComponentForm] = useState<{ [employeeId: string]: boolean }>({});
  const [componentForm, setComponentForm] = useState<{ [employeeId: string]: Partial<SalaryComponent> }>({});
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const data = await employeeService.getAllEmployees();
        setEmployees(data);
        
        // Load components for the selected month
        const monthlyComponents = JSON.parse(localStorage.getItem('monthlyComponents') || '{}');
        const currentComponents = JSON.parse(localStorage.getItem('salaryComponents') || '{}');
        
        // If we have components for the selected month, use those
        if (monthlyComponents[selectedMonth]) {
          setSalaryComponents(monthlyComponents[selectedMonth]);
        } else {
          // Otherwise use current components
          setSalaryComponents(currentComponents);
        }
      } catch (error) {
        console.error('Error fetching employees:', error);
        toast({
          title: "Error",
          description: "Failed to fetch employees",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchEmployees();
  }, [selectedMonth]);

  useEffect(() => {
    if (employees.length > 0) {
      localStorage.setItem('salaryComponents', JSON.stringify(salaryComponents));
    }
  }, [employees.length, salaryComponents]);

  const handleAddComponentClick = (employeeId: string) => {
    setShowComponentForm((prev) => ({ ...prev, [employeeId]: true }));
    setComponentForm((prev) => ({ ...prev, [employeeId]: { name: '', type: 'earning', amount: 0, isPercentage: false } }));
  };

  const handleComponentChange = (employeeId: string, field: string, value: any) => {
    setComponentForm((prev) => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [field]: value,
      },
    }));
  };

  const handleSaveComponent = (employeeId: string) => {
    const comp = componentForm[employeeId];
    if (!comp || !comp.name || !comp.type || comp.amount === undefined) return;
    setSalaryComponents((prev) => {
      const updated = {
        ...prev,
        [employeeId]: [...(prev[employeeId] || []), { ...comp, id: Date.now().toString(), amount: Number(comp.amount) } as SalaryComponent],
      };
      return updated;
    });
    setShowComponentForm((prev) => ({ ...prev, [employeeId]: false }));
  };

  const handleDeleteComponent = (employeeId: string, componentId: string) => {
    setSalaryComponents((prev) => {
      const updated = {
        ...prev,
        [employeeId]: (prev[employeeId] || []).filter((comp) => comp.id !== componentId),
      };
      // Persist to localStorage
      localStorage.setItem('salaryComponents', JSON.stringify(updated));
      // Also update monthlyComponents if needed
      const monthlyComponents = JSON.parse(localStorage.getItem('monthlyComponents') || '{}');
      if (monthlyComponents[selectedMonth]) {
        monthlyComponents[selectedMonth][employeeId] = updated[employeeId];
        localStorage.setItem('monthlyComponents', JSON.stringify(monthlyComponents));
      }
      return updated;
    });
  };

  const calculateNetSalary = (employee: Employee) => {
    const base = employee.salary;
    const comps = salaryComponents[employee.id] || [];
    let earnings = 0, deductions = 0;
    comps.forEach((c) => {
      if (c.type === 'earning') {
        earnings += c.isPercentage ? (base * c.amount) / 100 : c.amount;
      } else {
        deductions += c.isPercentage ? (base * c.amount) / 100 : c.amount;
      }
    });
    return base + earnings - deductions;
  };

  const handleProcessPayments = async () => {
    setProcessing(true);
    // Simulate payment processing, sending emails, and updating KPIs
    setTimeout(() => {
      alert('Payments processed and payslips sent to all employees! (Simulated)');
      setProcessing(false);
    }, 2000);
  };

  const getEmployeeSalary = (employee: Employee) => {
    const comps = salaryComponents[employee.id] || [];
    
    let earnings = 0, deductions = 0;
    comps.forEach(c => {
      if (c.type === 'earning') {
        earnings += c.isPercentage ? (employee.salary * c.amount) / 100 : c.amount;
      } else {
        deductions += c.isPercentage ? (employee.salary * c.amount) / 100 : c.amount;
      }
    });
    
    return {
      basic: employee.salary,
      earnings,
      deductions,
      net: employee.salary + earnings - deductions
    };
  };

  const getPaymentStatus = (employeeId: string) => {
    const processedPayments = JSON.parse(localStorage.getItem('processedPayments') || '{}');
    return processedPayments[selectedMonth] ? 'Processed' : 'Pending';
  };

  if (loading) {
    return <div className="p-8 text-center">Loading salary data...</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Salary List</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search employee..." className="pl-8 w-full" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleProcessPayments} disabled={processing}>
              {processing ? 'Processing...' : 'Process Payments'}
            </Button>
          </div>
        </div>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Basic Salary</TableHead>
                <TableHead>Earnings</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No employees found
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp) => {
                  const salary = getEmployeeSalary(emp);
                  const status = getPaymentStatus(emp.id);
                  
                  return (
                  <TableRow key={emp.id}>
                    <TableCell>{emp.name}</TableCell>
                      <TableCell>₹{salary.basic.toLocaleString()}</TableCell>
                      <TableCell>₹{salary.earnings.toLocaleString()}</TableCell>
                      <TableCell>₹{salary.deductions.toLocaleString()}</TableCell>
                      <TableCell>₹{salary.net.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          status === 'Processed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {status}
                        </span>
                      </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleAddComponentClick(emp.id)}
                          >
                            <Plus className="h-4 w-4 mr-1" /> Add Component
                          </Button>
                          <PayslipViewer 
                            employeeId={emp.id}
                            selectedMonth={selectedMonth}
                          />
                        </div>
                        {(salaryComponents[emp.id] || []).length > 0 && (
                          <ul className="mt-2 space-y-1">
                          {salaryComponents[emp.id].map((comp) => (
                              <li key={comp.id} className="flex items-center gap-2 text-xs">
                                <span>{comp.name} ({comp.type === 'earning' ? '+' : '-'}₹{comp.amount}{comp.isPercentage ? '%' : ''})</span>
                                <Button size="icon" variant="ghost" onClick={() => handleDeleteComponent(emp.id, comp.id)}>
                                  <span className="sr-only">Delete</span>
                                  ×
                                </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                      {showComponentForm[emp.id] && (
                          <div className="mt-2 space-y-2 bg-gray-50 p-3 rounded-md border">
                          <Input
                            placeholder="Component Name"
                            value={componentForm[emp.id]?.name || ''}
                            onChange={e => handleComponentChange(emp.id, 'name', e.target.value)}
                          />
                          <Select
                            value={componentForm[emp.id]?.type || 'earning'}
                            onValueChange={val => handleComponentChange(emp.id, 'type', val)}
                          >
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="earning">Earning</SelectItem>
                              <SelectItem value="deduction">Deduction</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Amount"
                            type="number"
                            value={componentForm[emp.id]?.amount || ''}
                            onChange={e => handleComponentChange(emp.id, 'amount', e.target.value)}
                          />
                            <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                                id={`percentage-${emp.id}`}
                              checked={componentForm[emp.id]?.isPercentage || false}
                              onChange={e => handleComponentChange(emp.id, 'isPercentage', e.target.checked)}
                            />
                              <label htmlFor={`percentage-${emp.id}`} className="text-sm">
                                Is Percentage?
                          </label>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => handleSaveComponent(emp.id)}
                                disabled={!componentForm[emp.id]?.name || !componentForm[emp.id]?.amount}
                              >
                              Save
                            </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => setShowComponentForm(prev => ({ ...prev, [emp.id]: false }))}
                              >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
