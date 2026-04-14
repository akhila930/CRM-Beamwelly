import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileUp, FileDown, FileText, Search, Filter, Download, Trash, Edit, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useEmployees } from "@/contexts/EmployeeContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Employee } from "@/types/employee";
import { toast } from "@/hooks/use-toast";
import { useFadeIn, useSequentialFadeIn } from "@/lib/animations";
import { EmployeeForm } from "./EmployeeForm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function EmployeeDirectory() {
  const navigate = useNavigate();
  const { 
    employees, 
    addEmployee, 
    deleteEmployee, 
    importEmployeesFromExcel,
    exportEmployeesToExcel,
    getExcelTemplate
  } = useEmployees();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  
  // Filter employees based on search query
  const filteredEmployees = employees.filter(employee => 
    employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fadeStyle = useFadeIn();
  const cardStyles = useSequentialFadeIn(filteredEmployees.length, 100, 50);
  
  // Handle successful employee creation
  const handleEmployeeAdded = () => {
    setIsAddDialogOpen(false);
  };
  
  // Handle file import
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
  
  // Handle employee deletion
  const handleDeleteConfirm = () => {
    if (selectedEmployeeId) {
      deleteEmployee(selectedEmployeeId);
      setSelectedEmployeeId(null);
      setIsDeleteDialogOpen(false);
    }
  };
  
  // Navigate to employee profile
  const viewEmployee = (id: string) => {
    navigate(`/employee/profile/${id}`);
  };
  
  return (
    <div className="space-y-4" style={fadeStyle}>
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Employee Directory</CardTitle>
              <CardDescription>Manage your organization's employees</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={getExcelTemplate}>
                <FileText className="h-4 w-4 mr-2" />
                Template
              </Button>
              <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <FileUp className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Import Employees</DialogTitle>
                    <DialogDescription>
                      Upload an Excel file to import employee data.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="file">Excel File</Label>
                      <Input
                        id="file"
                        type="file"
                        accept=".xlsx,.xls"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                      />
                      <p className="text-xs text-muted-foreground">
                        Make sure to use the provided template for the import.
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                      Cancel
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={exportEmployeesToExcel}>
                <FileDown className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Employee
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Employee</DialogTitle>
                    <DialogDescription>
                      Enter the details of the new employee. Credentials will be sent to their email.
                    </DialogDescription>
                  </DialogHeader>
                  <EmployeeForm onSuccess={handleEmployeeAdded} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search employees..."
                  className="pl-8 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            {filteredEmployees.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                {employees.length === 0 ? (
                  <div className="space-y-2">
                    <p>No employees found. Add your first employee.</p>
                    <Button
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Employee
                    </Button>
                  </div>
                ) : (
                  <p>No employees match your search criteria.</p>
                )}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredEmployees.map((employee, index) => (
                  <Card key={employee.id} style={cardStyles[index]}>
                    <CardHeader className="pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <CardTitle>{employee.name}</CardTitle>
                          <CardDescription>{employee.position}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => viewEmployee(employee.id)}
                            title="View Profile"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedEmployeeId(employee.id);
                              setIsDeleteDialogOpen(true);
                            }}
                            title="Delete"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p>{employee.department}</p>
                        <p>{employee.email}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this employee? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
