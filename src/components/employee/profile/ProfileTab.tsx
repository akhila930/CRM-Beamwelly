import { useState } from "react";
import { Employee } from "@/types/employee";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useEmployees } from "@/contexts/EmployeeContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckSquare, Info, UserPlus, Users } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProfileTabProps {
  employee: Employee;
}

export function ProfileTab({ employee }: ProfileTabProps) {
  const { updateEmployee, getEmployee } = useEmployees();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: employee.name,
    email: employee.email,
    phone: employee.phone || "",
    position: employee.position,
    department: employee.department,
    salary: employee.salary?.toString() || "",
    hire_date: employee.hire_date ? new Date(employee.hire_date).toISOString().split('T')[0] : "",
    status: employee.status || "active",
    address: employee.address || "",
    can_assign_tasks: employee.can_assign_tasks || false,
    can_access_recruitment: employee.can_access_recruitment || false
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStatusChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      status: value,
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const allowedFields = [
        'name', 'email', 'phone', 'position', 'department', 'salary', 'hire_date', 'status', 'address', 'can_assign_tasks', 'can_access_recruitment'
      ];
      const updatedData: Record<string, any> = {};
      for (const key of allowedFields) {
        if (formData[key] !== undefined && formData[key] !== null && formData[key] !== "") {
          updatedData[key] = key === 'salary' ? parseFloat(formData[key]) : formData[key];
        }
      }
      console.log("Updating employee with data:", updatedData);
      await updateEmployee(employee.id, updatedData);
      const refreshedEmployee = await getEmployee(employee.id);
      if (refreshedEmployee) {
        setFormData({
          name: refreshedEmployee.name,
          email: refreshedEmployee.email,
          phone: refreshedEmployee.phone || "",
          position: refreshedEmployee.position,
          department: refreshedEmployee.department,
          salary: refreshedEmployee.salary?.toString() || "",
          hire_date: refreshedEmployee.hire_date ? new Date(refreshedEmployee.hire_date).toISOString().split('T')[0] : "",
          status: refreshedEmployee.status || "active",
          address: refreshedEmployee.address || "",
          can_assign_tasks: refreshedEmployee.can_assign_tasks || false,
          can_access_recruitment: refreshedEmployee.can_access_recruitment || false
        });
      }
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please check your input and try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Profile Information</h3>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Save Changes</Button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  required
                />
              </div>
            
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Enter phone number"
                />
              </div>
            
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  required
                />
              </div>
            
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  required
                />
              </div>
            
              <div className="space-y-2">
                <Label htmlFor="salary">Salary</Label>
                <Input
                  id="salary"
                  name="salary"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.salary}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Enter salary amount"
                />
              </div>
            
              <div className="space-y-2">
                <Label htmlFor="hire_date">Hire Date</Label>
                <Input
                  id="hire_date"
                  name="hire_date"
                  type="date"
                  value={formData.hire_date}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  required
                />
              </div>
            
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={handleStatusChange}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
          
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Enter address"
                />
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Access Control
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="canAssignTasks"
                      checked={formData.can_assign_tasks}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, can_assign_tasks: checked as boolean }))
                      }
                      disabled={!isEditing}
                    />
                    <div className="flex items-center gap-2">
                      <Label htmlFor="canAssignTasks" className="flex items-center gap-2">
                        <CheckSquare className="h-4 w-4" />
                        Task Assignment
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Allow this employee to assign tasks to other employees</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="canAccessRecruitment"
                      checked={formData.can_access_recruitment}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, can_access_recruitment: checked as boolean }))
                      }
                      disabled={!isEditing}
                    />
                    <div className="flex items-center gap-2">
                      <Label htmlFor="canAccessRecruitment" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Recruitment Access
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Allow this employee to access recruitment features</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
