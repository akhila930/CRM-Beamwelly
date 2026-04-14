import { useState, useRef } from "react";
import { useEmployees } from "@/contexts/EmployeeContext";
import { Employee } from "@/types/employee";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Plus, MoreVertical, Upload, FileDown, Edit, Trash, UserCircle, File, Download, FileText } from "lucide-react";
import { format } from "date-fns";
import { useFadeIn, useSequentialFadeIn } from "@/lib/animations";
import { EmployeeForm } from "@/components/employee/EmployeeForm";
import { EmployeeCard } from "@/components/employee/EmployeeCard";
import { toast } from "@/hooks/use-toast";

export default function EmployeeDirectory() {
  const { 
    employees, 
    deleteEmployee, 
    importEmployeesFromExcel, 
    exportEmployeesToExcel,
    getExcelTemplate,
    addEmployee 
  } = useEmployees();
  const navigate = useNavigate();
  const fadeStyle = useFadeIn();
  const contentStyle = useFadeIn(200);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    salary: "",
    joinedDate: "",
    email: "",
    phone: "",
    department: "",
    address: ""
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAddEmployee = () => {
    addEmployee({
      name: formData.name,
      position: formData.role,
      salary: Number(formData.salary),
      hire_date: formData.joinedDate,
      email: formData.email,
      phone: formData.phone,
      department: formData.department,
      address: formData.address,
      status: "active",
      can_assign_tasks: false,
      can_access_recruitment: false,
      tasks: [],
      documents: [],
      attendance: [],
      milestones: []
    });
    
    // Reset form
    setFormData({
      name: "",
      role: "",
      salary: "",
      joinedDate: "",
      email: "",
      phone: "",
      department: "",
      address: ""
    });
    setIsAddDialogOpen(false);
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await importEmployeesFromExcel(file);
      // Reset input
      e.target.value = '';
    }
  };
  
  const navigateToEmployeeProfile = (employeeId: string) => {
    navigate(`/employee/profile/${employeeId}`);
  };
  
  const filteredEmployees = searchQuery 
    ? employees.filter(emp => 
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.phone && emp.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (emp.position && emp.position.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (emp.department && emp.department.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : employees;
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardStyles = useSequentialFadeIn(filteredEmployees.length, 100, 50);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await importEmployeesFromExcel(file);
        setIsImportDialogOpen(false);
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error('Error importing file:', error);
      }
    }
  };
  
  const handleDeleteConfirm = () => {
    if (selectedEmployeeId) {
      deleteEmployee(selectedEmployeeId);
      setSelectedEmployeeId(null);
      setIsDeleteDialogOpen(false);
    }
  };
  
  return (
    <div className="flex min-h-screen w-full bg-gray-50/40">
      <Sidebar />
      <div className="flex-1">
        <Header title="Employee Directory" />
        <main className="flex-1 p-6 md:p-8">
          <div style={fadeStyle} className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Employee Directory</h1>
            <p className="text-muted-foreground">
              Manage your organization's employees
            </p>
          </div>
          
          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search employees..." 
                className="pl-9 w-full sm:w-[300px]" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Employee
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[550px]">
                  <DialogHeader>
                    <DialogTitle>Add New Employee</DialogTitle>
                    <DialogDescription>
                      Enter the details of the new employee.
                    </DialogDescription>
                  </DialogHeader>
                  <EmployeeForm onSuccess={() => setIsAddDialogOpen(false)} />
                </DialogContent>
              </Dialog>
              
              <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <File className="mr-2 h-4 w-4" />
                    Import
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Import Employees</DialogTitle>
                    <DialogDescription>
                      Upload an Excel file (.xlsx) with employee data.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="excelFile">Excel File (.xlsx)</Label>
                        <Input 
                        id="excelFile"
                        type="file"
                        accept=".xlsx"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>Cancel</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Button variant="outline" onClick={exportEmployeesToExcel}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>

              <Button variant="outline" onClick={getExcelTemplate}>
                <FileText className="mr-2 h-4 w-4" />
                Template
                  </Button>
            </div>
          </div>
          
          {/* Employee List */}
          <div className="mt-6" style={contentStyle}>
            <Tabs defaultValue="grid">
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="grid">Grid View</TabsTrigger>
                  <TabsTrigger value="table">Table View</TabsTrigger>
                </TabsList>
                <p className="text-sm text-muted-foreground">
                  {filteredEmployees.length} employees
                </p>
              </div>
              
              <TabsContent value="grid">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((employee, index) => (
                      <div key={employee.id} style={cardStyles[index]}>
                        <EmployeeCard 
                          employee={employee} 
                          onView={() => navigateToEmployeeProfile(employee.id)} 
                          onDelete={() => {
                            setSelectedEmployeeId(employee.id);
                            setIsDeleteDialogOpen(true);
                          }}
                        />
                          </div>
                    ))
                  ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-8 text-center">
                      <UserCircle className="h-12 w-12 text-muted-foreground mb-2" />
                      <h3 className="text-lg font-medium">No employees found</h3>
                      <p className="text-muted-foreground mt-1">
                        {employees.length === 0 
                          ? "Start by adding an employee or importing from Excel" 
                          : "No employees match your search criteria"}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="table">
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableCaption>List of all employees in the organization</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Position</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Hire Date</TableHead>
                          <TableHead>Salary</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEmployees.length > 0 ? (
                          filteredEmployees.map((employee) => (
                            <TableRow key={employee.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback>
                                      {employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  {employee.name}
                                </div>
                              </TableCell>
                              <TableCell>{employee.position}</TableCell>
                              <TableCell>{employee.department || '-'}</TableCell>
                              <TableCell>{format(new Date(employee.hire_date), 'PP')}</TableCell>
                              <TableCell>{employee.salary?.toLocaleString() || '-'}</TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => navigateToEmployeeProfile(employee.id)}>
                                      <UserCircle className="mr-2 h-4 w-4" />
                                      View Profile
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      className="text-red-600"
                                      onClick={() => {
                                        setSelectedEmployeeId(employee.id);
                                        setIsDeleteDialogOpen(true);
                                      }}
                                    >
                                      <Trash className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="h-32 text-center">
                              <div className="flex flex-col items-center justify-center text-center">
                                <UserCircle className="h-8 w-8 text-muted-foreground mb-2" />
                                <p className="text-muted-foreground">
                                  {employees.length === 0 
                                    ? "No employees found. Start by adding an employee." 
                                    : "No employees match your search criteria."}
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this employee? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
