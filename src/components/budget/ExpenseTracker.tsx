import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent,
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogClose, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Upload, Download, Filter, FileText, Trash, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { toAbsoluteApiUrl } from "@/lib/runtimeConfig";
import api from "@/lib/axios";
import { EditExpenseDialog } from "./EditExpenseDialog";

interface Expense {
  id: number;
  type: string;
  amount: number;
  department: string;
  date: string;
  description: string;
  receipt_url?: string;
  created_at: string;
  updated_at: string;
}

type FilterValue = string | 'all';

interface ExpenseSummary {
  monthlyTotal: number;
  quarterlyTotal: number;
  yearlyTotal: number;
}

export function ExpenseTracker() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary>({
    monthlyTotal: 0,
    quarterlyTotal: 0,
    yearlyTotal: 0
  });
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [filter, setFilter] = useState<FilterValue>('all');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const calculateSummary = (expenses: Expense[]) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Calculate monthly total
    const monthlyTotal = expenses
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === currentMonth && 
               expenseDate.getFullYear() === currentYear;
      })
      .reduce((sum, expense) => sum + expense.amount, 0);

    // Calculate quarterly total
    const quarterStart = new Date(currentYear, Math.floor(currentMonth / 3) * 3, 1);
    const quarterlyTotal = expenses
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= quarterStart && 
               expenseDate.getFullYear() === currentYear;
      })
      .reduce((sum, expense) => sum + expense.amount, 0);

    // Calculate yearly total
    const yearlyTotal = expenses
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getFullYear() === currentYear;
      })
      .reduce((sum, expense) => sum + expense.amount, 0);

    return {
      monthlyTotal,
      quarterlyTotal,
      yearlyTotal
    };
  };

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/budget/expenses');
      const fetchedExpenses = response.data || [];
      setExpenses(fetchedExpenses);
      setSummary(calculateSummary(fetchedExpenses));
      setError(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to fetch expenses';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/api/budget/department-budgets');
      const depts = response.data.map((dept: any) => dept.department);
      setDepartments(depts);
    } catch (err: any) {
      console.error('Error fetching departments:', err);
      toast({
        title: "Error",
        description: "Failed to fetch departments",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchDepartments();
  }, []);

  const handleAddExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (selectedFile) {
      formData.append('receipt', selectedFile);
    }
    
    try {
      const response = await api.post('/api/budget/expenses', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setExpenses(prev => [...prev, response.data]);
      toast({
        title: "Success",
        description: "Expense added successfully",
      });
      
      setIsAddExpenseOpen(false);
      setSelectedFile(null);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.detail || "Failed to add expense",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      await api.delete(`/api/budget/expenses/${id}`);
      setExpenses(expenses.filter(expense => expense.id !== id));
      toast({
        title: "Success",
        description: "Expense deleted successfully",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      });
    }
  };

  const handleEditExpense = async (id: number, updatedData: Partial<Expense>) => {
    try {
      const response = await api.put(`/api/budget/expenses/${id}`, updatedData);
      setExpenses(expenses.map(expense => 
        expense.id === id ? response.data : expense
      ));
      toast({
        title: "Success",
        description: "Expense updated successfully",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to update expense",
        variant: "destructive",
      });
    }
  };

  const filteredExpenses = expenses.filter(expense => 
    filter === 'all' || expense.department === filter
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Expense Tracker</h2>
          <p className="text-muted-foreground">Record and monitor your organization's expenses</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(value: FilterValue) => setFilter(value)}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>Filter</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Expenses</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
                <DialogDescription>
                  Record a new expense for your organization.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddExpense}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="expenseType">Expense Type</Label>
                    <Input id="expenseType" name="type" placeholder="Office Supplies" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input id="amount" name="amount" type="number" placeholder="100" required min="0" step="0.01" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="department">Department</Label>
                    <Select name="department">
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" name="date" type="date" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Input id="description" name="description" placeholder="Brief description of the expense" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="receipt">Receipt (PDF only)</Label>
                    <Input 
                        id="receipt" 
                        name="receipt" 
                        type="file" 
                        onChange={handleFileChange} 
                        accept=".pdf"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button type="submit">Add Expense</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Expense Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline">
              <div className="text-2xl font-bold">₹{summary.monthlyTotal.toLocaleString('en-IN')}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quarterly Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline">
              <div className="text-2xl font-bold">₹{summary.quarterlyTotal.toLocaleString('en-IN')}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Yearly Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline">
              <div className="text-2xl font-bold">₹{summary.yearlyTotal.toLocaleString('en-IN')}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Receipt</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{expense.type}</TableCell>
                  <TableCell>₹{expense.amount.toLocaleString('en-IN')}</TableCell>
                  <TableCell className="capitalize">{expense.department}</TableCell>
                  <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell>
                    {expense.receipt_url && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(toAbsoluteApiUrl(expense.receipt_url), '_blank')}
                          title="View Receipt"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => {
                            try {
                              const response = await fetch(toAbsoluteApiUrl(expense.receipt_url));
                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `receipt-${expense.id}.pdf`;
                              document.body.appendChild(a);
                              a.click();
                              window.URL.revokeObjectURL(url);
                              document.body.removeChild(a);
                            } catch (error) {
                              console.error('Error downloading receipt:', error);
                              toast({
                                title: "Error",
                                description: "Failed to download receipt",
                                variant: "destructive",
                              });
                            }
                          }}
                          title="Download Receipt"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedExpense(expense);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteExpense(expense.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredExpenses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    No expenses found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add EditExpenseDialog */}
      {selectedExpense && (
        <EditExpenseDialog
          expense={selectedExpense}
          departments={departments}
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setSelectedExpense(null);
          }}
          onSave={handleEditExpense}
        />
      )}
    </div>
  );
}
