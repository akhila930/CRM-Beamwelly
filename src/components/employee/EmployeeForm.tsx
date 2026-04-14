import { useState, useEffect } from "react";
import { Eye, EyeOff, UserPlus, Info, User, Mail, Phone, Briefcase, Building, DollarSign, Calendar, MapPin, CheckSquare, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/axios"; // Import the configured axios instance
import { Employee } from "@/types/employee";

interface EmployeeFormProps {
  onSuccess?: () => void;
  initialData?: Employee; // Added for editing existing employees
}

export function EmployeeForm({ onSuccess, initialData }: EmployeeFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [position, setPosition] = useState(initialData?.position || "");
  const [department, setDepartment] = useState(initialData?.department || "");
  const [salary, setSalary] = useState(String(initialData?.salary || ""));
  const [hireDate, setHireDate] = useState(initialData?.hire_date || "");
  const [address, setAddress] = useState(initialData?.address || "");
  const [canAssignTasks, setCanAssignTasks] = useState(initialData?.can_assign_tasks || false);
  const [canAccessRecruitment, setCanAccessRecruitment] = useState(initialData?.can_access_recruitment || false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Effect to update form fields if initialData changes (e.g., when editing a different employee)
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setEmail(initialData.email || "");
      setPhone(initialData.phone || "");
      setPosition(initialData.position || "");
      setDepartment(initialData.department || "");
      setSalary(String(initialData.salary || ""));
      setHireDate(initialData.hire_date || "");
      setAddress(initialData.address || "");
      setCanAssignTasks(initialData.can_assign_tasks || false);
      setCanAccessRecruitment(initialData.can_access_recruitment || false);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Determine if it's an update or create operation
    const isUpdate = !!initialData?.id;
    const url = isUpdate 
      ? `/api/employees/${initialData.id}` 
      : `/api/employees`;
    const method = isUpdate ? "PUT" : "POST";

    if (!user || (user.role !== "admin" && !isUpdate)) { // Allow non-admins to update their own profile, but only admins to create new profiles
      toast({
        title: "Access Denied",
        description: "Only admins can create employee accounts",
        variant: "destructive",
      });
      return;
    }

    try {
      const employeeData = {
        name,
        email,
        phone,
        position,
        department,
        salary: parseFloat(salary),
        hire_date: hireDate,
        address,
        can_assign_tasks: canAssignTasks,
        can_access_recruitment: canAccessRecruitment,
      };

      const response = await api({ // Use the configured axios instance
        method,
        url,
        data: employeeData,
      });

      if (response.status !== 200 && response.status !== 201) {
        throw new Error(response.data.detail || `Failed to ${isUpdate ? 'update' : 'create'} employee account`);
      }

      toast({
        title: "Success",
        description: `Employee account ${isUpdate ? 'updated' : 'created'} successfully. ${!isUpdate ? 'Credentials have been sent to their email.' : ''}`,
      });

      // Reset form if creating, otherwise keep data for update context
      if (!isUpdate) {
        setName("");
        setEmail("");
        setPhone("");
        setPosition("");
        setDepartment("");
        setSalary("");
        setHireDate("");
        setAddress("");
        setCanAssignTasks(false);
        setCanAccessRecruitment(false);
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: "Error",
        description: errorMessage || `Failed to ${isUpdate ? 'update' : 'create'} employee account`,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl shadow-lg border">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">{initialData ? "Update Employee Profile" : "Create Employee Account"}</CardTitle>
        <CardDescription>
          {initialData ? "Edit the details of this employee." : "Create a new employee account and send credentials to their email"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="employee@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
                disabled={!!initialData} // Disable email edit for existing employees
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Position
              </Label>
              <Input
                id="position"
                type="text"
                placeholder="Software Engineer"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                required
                className="h-11"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Department
              </Label>
              <Input
                id="department"
                type="text"
                placeholder="Engineering"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Salary
              </Label>
              <Input
                id="salary"
                type="number"
                placeholder="50000"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                required
                className="h-11"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hireDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Hire Date
              </Label>
              <Input
                id="hireDate"
                type="date"
                value={hireDate}
                onChange={(e) => setHireDate(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </Label>
              <Input
                id="address"
                type="text"
                placeholder="123 Main St"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="h-11"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="canAssignTasks"
                checked={canAssignTasks}
                onCheckedChange={(checked) => setCanAssignTasks(!!checked)}
              />
              <Label htmlFor="canAssignTasks" className="flex items-center gap-1 cursor-pointer">
                Can Assign Tasks
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>If checked, this employee can assign tasks to others.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="canAccessRecruitment"
                checked={canAccessRecruitment}
                onCheckedChange={(checked) => setCanAccessRecruitment(!!checked)}
              />
              <Label htmlFor="canAccessRecruitment" className="flex items-center gap-1 cursor-pointer">
                Can Access Recruitment Module
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>If checked, this employee can view and manage recruitment data.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
            </div>
          </div>

          <Button type="submit" className="w-full">
            {initialData ? "Update Employee" : "Create Employee Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}