import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';
import { toast } from '@/hooks/use-toast';
import { Employee, Task, Document, Milestone, Attendance } from '@/types/employee';
import { employeeService } from '@/services/employeeService';

interface EmployeeContextType {
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id'>) => Promise<void>;
  updateEmployee: (id: string, employee: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  getEmployee: (id: string) => Promise<Employee | null>;
  
  // Task management
  addTask: (employeeId: string, task: Omit<Task, 'id'>) => Promise<void>;
  updateTask: (employeeId: string, taskId: string, task: Partial<Task>) => Promise<void>;
  deleteTask: (employeeId: string, taskId: string) => Promise<void>;
  
  // Document management
  addDocument: (employeeId: string, document: Omit<Document, 'id'>) => Promise<void>;
  deleteDocument: (employeeId: string, documentId: string) => Promise<void>;
  
  // Attendance management
  markAttendance: (employeeId: string, date: string, status: 'present' | 'absent' | 'halfday') => Promise<void>;
  
  // Milestone management
  addMilestone: (employeeId: string, milestone: Omit<Milestone, 'id'>) => Promise<void>;
  updateMilestone: (employeeId: string, milestoneId: string, milestone: Partial<Milestone>) => Promise<void>;
  deleteMilestone: (employeeId: string, milestoneId: string) => Promise<void>;
  
  // Data import/export
  importEmployeesFromExcel: (file: File) => Promise<void>;
  exportEmployeesToExcel: () => void;
  getExcelTemplate: () => void;
  
  // Helper to get employee by email
  getEmployeeByEmail: (email: string) => Promise<Employee | null>;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export const useEmployees = () => {
  const context = useContext(EmployeeContext);
  if (!context) {
    throw new Error('useEmployees must be used within an EmployeeProvider');
  }
  return context;
};

export const EmployeeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await employeeService.getAllEmployees();
        setEmployees(data);
      } catch (error) {
        console.error('Failed to fetch employees:', error);
        toast({
          title: "Error",
          description: "Failed to load employees",
          variant: "destructive"
        });
      }
    };

    fetchEmployees();
  }, []);

  const addEmployee = async (employee: Omit<Employee, 'id'>) => {
    try {
      // Ensure access control fields are included in the data
      const employeeData = {
        ...employee,
        can_assign_tasks: typeof employee.can_assign_tasks === 'boolean' ? employee.can_assign_tasks : false,
        can_access_recruitment: typeof employee.can_access_recruitment === 'boolean' ? employee.can_access_recruitment : false,
        status: employee.status || 'active',
        hire_date: employee.hire_date || new Date().toISOString().split('T')[0],
        tasks: [],
        documents: [],
        attendance: [],
        milestones: []
      };
      
      const newEmployee = await employeeService.createEmployee(employeeData);
      
      // Refresh employee list after adding a new employee
      const data = await employeeService.getAllEmployees();
      setEmployees(data);
      
      toast({
        title: "Success",
        description: "Employee added successfully. Login credentials have been sent to their email."
      });
    } catch (error) {
      console.error('Error adding employee:', error);
      let errorMessage = 'Failed to add employee';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'detail' in error) {
        errorMessage = (error as { detail: string }).detail;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw error; // Re-throw to let the caller handle it if needed
    }
  };

  const updateEmployee = async (id: string, employeeData: Partial<Employee>) => {
    try {
      const allowedFields = [
        'name', 'email', 'phone', 'position', 'department', 'salary', 'hire_date', 'status', 'address', 'can_assign_tasks', 'can_access_recruitment'
      ];
      const updateData: Record<string, any> = {};
      for (const key of allowedFields) {
        // Special handling for boolean fields
        if (key === 'can_assign_tasks' || key === 'can_access_recruitment') {
          updateData[key] = employeeData[key] === true;
        } else if (employeeData[key] !== undefined && employeeData[key] !== null && employeeData[key] !== "") {
          updateData[key] = employeeData[key];
        }
      }
      const updatedEmployee = await employeeService.updateEmployee(id, updateData);
      setEmployees(prev => prev.map(emp => emp.id.toString() === id.toString() ? updatedEmployee : emp));
      toast({
        title: "Success",
        description: "Employee updated successfully"
      });
    } catch (error) {
      console.error('Failed to update employee:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: "Error",
        description: errorMessage || "Failed to update employee",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      await employeeService.deleteEmployee(id);
      setEmployees(prev => prev.filter(emp => emp.id.toString() !== id.toString()));
      toast({
        title: "Success",
        description: "Employee deleted successfully"
      });
    } catch (error) {
      console.error('Failed to delete employee:', error);
      toast({
        title: "Error",
        description: "Failed to delete employee",
        variant: "destructive"
      });
      throw error;
    }
  };

  const getEmployee = async (id: string) => {
    try {
      const employee = await employeeService.getEmployeeById(id);
      return employee;
    } catch (error) {
      console.error('Failed to fetch employee:', error);
      return null;
    }
  };

  // Task management
  const addTask = async (employeeId: string, task: Omit<Task, 'id'>) => {
    try {
      const updatedEmployee = await employeeService.addTask(employeeId, task);
      setEmployees(prev => prev.map(emp => emp.id.toString() === employeeId.toString() ? updatedEmployee : emp));
      toast({
        title: "Success",
        description: "Task has been added.",
      });
    } catch (error) {
      console.error('Failed to add task:', error);
      toast({
        title: "Error",
        description: "Failed to add task",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateTask = async (employeeId: string, taskId: string, updatedTask: Partial<Task>) => {
    try {
      const updatedEmployee = await employeeService.updateTask(employeeId, taskId, updatedTask);
      setEmployees(prev => prev.map(emp => emp.id.toString() === employeeId.toString() ? updatedEmployee : emp));
      toast({
        title: "Success",
        description: "Task has been updated.",
      });
    } catch (error) {
      console.error('Failed to update task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteTask = async (employeeId: string, taskId: string) => {
    try {
      const updatedEmployee = await employeeService.deleteTask(employeeId, taskId);
      setEmployees(prev => prev.map(emp => emp.id.toString() === employeeId.toString() ? updatedEmployee : emp));
      toast({
        title: "Success",
        description: "Task has been deleted.",
      });
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Document management
  const addDocument = async (employeeId: string, document: Omit<Document, 'id'>) => {
    try {
      if (!document.file) {
        throw new Error('File is required for document upload');
      }

      const formData = new FormData();
      formData.append('title', document.title);
      if (document.description) {
        formData.append('description', document.description);
      }
      formData.append('file', document.file);
      
      // Add file_type if provided
      if (document.file_type) {
        formData.append('file_type', document.file_type);
      }

      const updatedEmployee = await employeeService.addDocument(employeeId, formData);
      setEmployees(prev => prev.map(emp => emp.id.toString() === employeeId.toString() ? updatedEmployee : emp));
      toast({
        title: "Success",
        description: "Document has been added.",
      });
    } catch (error) {
      console.error('Failed to add document:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add document",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteDocument = async (employeeId: string, documentId: string) => {
    try {
      const updatedEmployee = await employeeService.deleteDocument(employeeId, documentId);
      setEmployees(prev => prev.map(emp => emp.id.toString() === employeeId.toString() ? updatedEmployee : emp));
      toast({
        title: "Success",
        description: "Document has been deleted.",
      });
    } catch (error) {
      console.error('Failed to delete document:', error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Attendance management
  const markAttendance = async (employeeId: string, date: string, status: 'present' | 'absent' | 'halfday') => {
    try {
      const updatedEmployee = await employeeService.markAttendance(employeeId, date, status);
      setEmployees(prev => prev.map(emp => emp.id.toString() === employeeId.toString() ? updatedEmployee : emp));
      toast({
        title: "Success",
        description: "Attendance has been marked.",
      });
    } catch (error) {
      console.error('Failed to mark attendance:', error);
      toast({
        title: "Error",
        description: "Failed to mark attendance",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Milestone management
  const addMilestone = async (employeeId: string, milestone: Omit<Milestone, 'id'>) => {
    try {
      console.log('Adding milestone with data:', milestone);
      const updatedEmployee = await employeeService.addMilestone(employeeId, milestone);
      setEmployees(prev => prev.map(emp => emp.id.toString() === employeeId.toString() ? updatedEmployee : emp));
      toast({
        title: "Success",
        description: "Milestone has been added.",
      });
    } catch (error) {
      console.error('Failed to add milestone:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add milestone",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateMilestone = async (employeeId: string, milestoneId: string, updatedMilestone: Partial<Milestone>) => {
    try {
      const updatedEmployee = await employeeService.updateMilestone(employeeId, milestoneId, updatedMilestone);
      setEmployees(prev => prev.map(emp => emp.id.toString() === employeeId.toString() ? updatedEmployee : emp));
      toast({
        title: "Success",
        description: "Milestone has been updated.",
      });
    } catch (error: any) {
      let errorMessage = 'Failed to update milestone';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'detail' in error) {
        errorMessage = (error as { detail: string }).detail;
      }
      console.error('Full error object:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteMilestone = async (employeeId: string, milestoneId: string) => {
    try {
      const updatedEmployee = await employeeService.deleteMilestone(employeeId, milestoneId);
      setEmployees(prev => prev.map(emp => emp.id.toString() === employeeId.toString() ? updatedEmployee : emp));
      toast({
        title: "Success",
        description: "Milestone has been deleted.",
      });
    } catch (error) {
      console.error('Failed to delete milestone:', error);
      toast({
        title: "Error",
        description: "Failed to delete milestone",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Excel import/export functions
  const importEmployeesFromExcel = async (file: File): Promise<void> => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      // Process and validate the data
      const employeesToImport = jsonData.map((row: any) => {
        // Handle date conversion
        let hireDate = new Date().toISOString().split('T')[0];
        if (row.hire_date) {
          try {
            // Try to parse the date from Excel
            const excelDate = new Date(row.hire_date);
            if (!isNaN(excelDate.getTime())) {
              hireDate = excelDate.toISOString().split('T')[0];
            }
          } catch (e) {
            console.error('Error parsing date:', e);
          }
        }

        return {
          name: row.name || '',
          email: row.email || '',
          phone: row.phone || '',
          position: row.position || '',
          department: row.department || '',
          salary: row.salary ? parseFloat(row.salary) : 0,
          hire_date: hireDate,
          status: row.status || 'active',
          address: row.address || '',
          // Add required fields with default values
          tasks: [],
          documents: [],
          attendance: [],
          milestones: [],
          can_assign_tasks: false,
          can_access_recruitment: false
        };
      });

      // Import each employee
      for (const employee of employeesToImport) {
        try {
          await employeeService.createEmployee(employee);
        } catch (error) {
          console.error(`Failed to import employee ${employee.email}:`, error);
          toast({
            title: "Error",
            description: `Failed to import employee ${employee.email}`,
            variant: "destructive"
          });
        }
      }

      // Refresh the employee list
      const updatedEmployees = await employeeService.getAllEmployees();
      setEmployees(updatedEmployees);
      
      toast({
        title: "Success",
        description: "Employees imported successfully"
      });
    } catch (error) {
      console.error('Error importing employees:', error);
      toast({
        title: "Error",
        description: "Failed to import employees",
        variant: "destructive"
      });
      throw error;
    }
  };

  const exportEmployeesToExcel = () => {
    try {
      // Prepare the data for export
      const exportData = employees.map((employee) => ({
        id: employee.id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        position: employee.position,
        department: employee.department,
        salary: employee.salary,
        hire_date: employee.hire_date,
        status: employee.status,
        tasksCount: employee.tasks.length,
        documentsCount: employee.documents.length,
        attendanceCount: employee.attendance.length,
        milestonesCount: employee.milestones.length,
      }));
      
      // Create a worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Create a workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');
      
      // Generate and download the Excel file
      XLSX.writeFile(workbook, 'employees.xlsx');
      
      toast({
        title: "Success",
        description: "Employees list has been exported to Excel.",
      });
    } catch (error) {
      console.error('Error exporting employees to Excel:', error);
      toast({
        title: "Error",
        description: "Failed to export employees to Excel.",
        variant: "destructive",
      });
    }
  };

  const getExcelTemplate = () => {
    try {
      // Create template data
      const templateData = [
        {
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890',
          position: 'Frontend Developer',
          department: 'Engineering',
          salary: 75000,
          hire_date: '2023-01-15',
          status: 'active'
        },
        {
          name: '',
          email: '',
          phone: '',
          position: '',
          department: '',
          salary: '',
          hire_date: '',
          status: ''
        },
      ];
      
      // Create a worksheet
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      
      // Create a workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'EmployeeTemplate');
      
      // Generate and download the Excel file
      XLSX.writeFile(workbook, 'employee_template.xlsx');
      
      toast({
        title: "Success",
        description: "Employee template has been downloaded.",
      });
    } catch (error) {
      console.error('Error generating Excel template:', error);
      toast({
        title: "Error",
        description: "Failed to generate Excel template.",
        variant: "destructive",
      });
    }
  };

  // Helper to get employee by email
  const getEmployeeByEmail = async (email: string) => {
    try {
      const allEmployees = await employeeService.getAllEmployees();
      return allEmployees.find(emp => emp.email === email) || null;
    } catch (error) {
      console.error('Failed to fetch employee by email:', error);
      return null;
    }
  };

  return (
    <EmployeeContext.Provider
      value={{
        employees,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        getEmployee,
        getEmployeeByEmail,
        addTask,
        updateTask,
        deleteTask,
        addDocument,
        deleteDocument,
        markAttendance,
        addMilestone,
        updateMilestone,
        deleteMilestone,
        importEmployeesFromExcel,
        exportEmployeesToExcel,
        getExcelTemplate,
      }}
    >
      {children}
    </EmployeeContext.Provider>
  );
};
