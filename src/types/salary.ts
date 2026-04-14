
export interface SalaryComponent {
  id: string;
  name: string;
  type: 'earning' | 'deduction';
  amount: number;
  isPercentage: boolean;
}

export interface Payslip {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  year: number;
  basicSalary: number;
  components: SalaryComponent[];
  totalEarnings: number;
  totalDeductions: number;
  netSalary: number;
  paymentStatus: 'pending' | 'processed' | 'failed';
  paymentDate?: string;
  generatedDate: string;
}
