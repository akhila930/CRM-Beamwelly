import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, DollarSign, TrendingUp, Wallet, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BudgetAllocationChart } from "./BudgetAllocationChart";
import { BudgetVsSpendChart } from "./BudgetVsSpendChart";
import api from "@/lib/axios";
import { useAuth } from "@/contexts/AuthContext";

interface BudgetOverview {
  totalBudget: number;
  totalSpent: number;
  remainingBudget: number;
  budgetPeriod: {
    startDate: string;
    endDate: string;
  };
}

interface Department {
  name: string;
  budget: number;
}

export function BudgetDashboard() {
  const [isEditBudgetOpen, setIsEditBudgetOpen] = useState(false);
  const [isAllocateBudgetOpen, setIsAllocateBudgetOpen] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [overview, setOverview] = useState<BudgetOverview>({
    totalBudget: 0,
    totalSpent: 0,
    remainingBudget: 0,
    budgetPeriod: {
      startDate: '',
      endDate: ''
    }
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchBudgetOverview();
  }, []);

  const fetchBudgetOverview = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/budget/overview');
      setOverview(response.data);
      
      // Also fetch department budgets
      const deptResponse = await api.get('/api/budget/department-budgets');
      if (Array.isArray(deptResponse.data)) {
        const departmentBudgets = deptResponse.data.map((dept: any) => ({
          name: dept.department,
          budget: dept.allocated_amount
        }));
        setDepartments(departmentBudgets);
      } else {
        setDepartments([]);
        console.warn('Department budgets response is not an array:', deptResponse.data);
      }
    } catch (error: any) {
      console.error('Error fetching budget data:', error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to fetch budget overview",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAllocateBudget = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      const totalAllocated = departments.reduce((sum, dept) => sum + dept.budget, 0);
      
      if (totalAllocated > overview.totalBudget) {
        toast({
          title: "Error",
          description: "Total allocated budget cannot exceed total budget",
          variant: "destructive",
        });
        return;
      }

      await api.post('/api/budget/allocate', {
        departments: departments.map(dept => ({
          department: dept.name,
          allocated_amount: dept.budget
        }))
      });

      toast({
        title: "Success",
        description: "Budget allocated successfully",
      });

      // Refresh the overview
      fetchBudgetOverview();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to allocate budget",
        variant: "destructive",
      });
    }
  };

  const addDepartment = () => {
    setDepartments([...departments, { name: '', budget: 0 }]);
  };

  const removeDepartment = (index: number) => {
    setDepartments(departments.filter((_, i) => i !== index));
  };

  const handleDepartmentChange = (index: number, field: keyof Department, value: string | number) => {
    const newDepartments = [...departments];
    if (field === 'budget') {
      newDepartments[index][field] = Number(value);
    } else {
      newDepartments[index][field] = value as string;
    }
    setDepartments(newDepartments);
  };

  const handleUpdateBudget = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await api.post('/api/budget/update', {
        totalBudget: Number(formData.get('totalBudget')),
        budgetPeriod: {
          startDate: formData.get('startDate'),
          endDate: formData.get('endDate')
        }
      });
      
      setOverview(response.data);
      toast({
        title: "Budget updated",
        description: "Total budget has been updated successfully.",
      });
      
      setIsEditBudgetOpen(false);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to update budget';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold">Budget Dashboard</h2>
            <p className="text-muted-foreground">Overview of your organization's financial allocations</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" disabled>
              <Edit className="mr-2 h-4 w-4" /> Edit Total Budget
            </Button>
            <Button disabled>
              <Plus className="mr-2 h-4 w-4" /> Allocate Budget
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>Loading...</CardTitle>
                <CardDescription>Loading chart data...</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Budget Dashboard</h2>
          <p className="text-muted-foreground">Overview of your organization's financial allocations</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isEditBudgetOpen} onOpenChange={setIsEditBudgetOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" /> Edit Total Budget
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleUpdateBudget}>
                <DialogHeader>
                  <DialogTitle>Edit Total Budget</DialogTitle>
                  <DialogDescription>
                    Update your organization's total budget for the current period.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="totalBudget">Total Budget</Label>
                    <Input 
                      id="totalBudget" 
                      name="totalBudget" 
                      type="number" 
                      placeholder={overview.totalBudget.toString()}
                      required 
                      min="0"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="budgetPeriod">Budget Period</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input 
                        id="startDate" 
                        name="startDate" 
                        type="date" 
                        required 
                        defaultValue={overview.budgetPeriod.startDate}
                      />
                      <Input 
                        id="endDate" 
                        name="endDate" 
                        type="date" 
                        required 
                        defaultValue={overview.budgetPeriod.endDate}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button type="submit">Update Budget</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isAllocateBudgetOpen} onOpenChange={setIsAllocateBudgetOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Allocate Budget
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <form onSubmit={handleAllocateBudget}>
                <DialogHeader>
                  <DialogTitle>Allocate Department Budgets</DialogTitle>
                  <DialogDescription>
                    Add departments and allocate budgets to them.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {departments.map((dept, index) => (
                    <div key={index} className="grid gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Label>Department Name</Label>
                          <Input
                            value={dept.name}
                            onChange={(e) => handleDepartmentChange(index, 'name', e.target.value)}
                            placeholder="Enter department name"
                            required
                          />
                        </div>
                        <div className="flex-1">
                          <Label>Budget Amount</Label>
                          <Input
                            type="number"
                            value={dept.budget}
                            onChange={(e) => handleDepartmentChange(index, 'budget', Number(e.target.value))}
                            placeholder="Enter budget amount"
                            required
                            min="0"
                          />
                        </div>
                        {departments.length > 1 && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="mt-6"
                            onClick={() => removeDepartment(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addDepartment}>
                    <Plus className="mr-2 h-4 w-4" /> Add Department
                  </Button>
                </div>
                <DialogFooter>
                  <Button type="submit">Save Changes</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Budget Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <CardDescription>For current fiscal period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(overview?.totalBudget || 0).toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <CardDescription>For current fiscal period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(overview?.totalSpent || 0).toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Remaining Budget</CardTitle>
            <CardDescription>For current fiscal period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(overview?.remainingBudget || 0).toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Budget Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Budget Allocation</CardTitle>
            <CardDescription>Distribution of budget across departments</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <BudgetAllocationChart />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Budget vs Spend</CardTitle>
            <CardDescription>Monthly comparison of budget and actual spending</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <BudgetVsSpendChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
