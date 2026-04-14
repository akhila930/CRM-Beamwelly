import { Employee } from '@/types/employee';

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Get auth headers from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };
};

// Get all employees
export const getAllEmployees = async (): Promise<Employee[]> => {
  const response = await fetch(`${API_BASE_URL}/api/employees/`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch employees');
  }

  return response.json();
};

// Create new employee (using admin endpoint)
export const createEmployee = async (employeeData: Omit<Employee, 'id'>): Promise<Employee> => {
  const response = await fetch(`${API_BASE_URL}/api/admin/create-employee`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(employeeData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create employee');
  }

  // If successful, fetch the newly created employee
  const result = await response.json();
  
  // Return a dummy employee object with the new ID for optimistic UI updates
  // The actual data will be fetched when the component reloads
  return {
    id: result.employee_id.toString(),
    name: employeeData.name,
    position: employeeData.position,
    email: employeeData.email,
    phone: employeeData.phone || '',
    department: employeeData.department || '',
    salary: employeeData.salary || 0,
    hire_date: employeeData.hire_date || new Date().toISOString().split('T')[0],
    status: 'active',
    address: employeeData.address || '',
    tasks: [],
    documents: [],
    attendance: [],
    milestones: [],
    can_assign_tasks: employeeData.can_assign_tasks || false,
    can_access_recruitment: employeeData.can_access_recruitment || false,
  };
};

// Get employee by ID
export const getEmployeeById = async (id: string): Promise<Employee> => {
  const response = await fetch(`${API_BASE_URL}/api/employees/${id}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch employee');
  }

  return response.json();
};

// Get employee by email
export const getEmployeeByEmail = async (email: string): Promise<Employee> => {
  // First get all employees
  const response = await fetch(`${API_BASE_URL}/api/employees/`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch employees');
  }

  const employees = await response.json();
  const employee = employees.find((emp: Employee) => emp.email === email);

  if (!employee) {
    throw new Error('Employee not found');
  }

  return employee;
};

// Update employee
export const updateEmployee = async (id: string, data: Partial<Employee>): Promise<Employee> => {
  // Only send allowed fields and skip undefined/null/empty string
  const allowedFields = [
    'name', 'email', 'phone', 'position', 'department', 'salary', 'hire_date', 'status', 'address', 'can_assign_tasks', 'can_access_recruitment'
  ];
  const filteredData: Record<string, any> = {};
  for (const key of allowedFields) {
    // Special handling for boolean fields
    if (key === 'can_assign_tasks' || key === 'can_access_recruitment') {
      filteredData[key] = data[key] === true;
    } else if (data[key] !== undefined && data[key] !== null && data[key] !== "") {
      filteredData[key] = data[key];
    }
  }
  const response = await fetch(`${API_BASE_URL}/api/employees/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(filteredData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update employee');
  }
  return response.json();
};

// Delete employee
export const deleteEmployee = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/employees/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete employee');
  }
};

// Task Management
export const addTask = async (employeeId: string, taskData: Record<string, unknown>): Promise<Employee> => {
  const response = await fetch(`${API_BASE_URL}/api/employees/${employeeId}/tasks`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to add task');
  }

  return response.json();
};

export const updateTask = async (employeeId: string, taskId: string, taskData: Record<string, unknown>): Promise<Employee> => {
  const response = await fetch(`${API_BASE_URL}/api/employees/${employeeId}/tasks/${taskId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update task');
  }

  return response.json();
};

export const deleteTask = async (employeeId: string, taskId: string): Promise<Employee> => {
  const response = await fetch(`${API_BASE_URL}/api/employees/${employeeId}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete task');
  }

  return response.json();
};

// Document Management
export const addDocument = async (employeeId: string, formData: FormData): Promise<Employee> => {
  const response = await fetch(`${API_BASE_URL}/api/employees/${employeeId}/documents`, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeaders().Authorization,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to add document');
  }

  return response.json();
};

export const deleteDocument = async (employeeId: string, documentId: string): Promise<Employee> => {
  const response = await fetch(`${API_BASE_URL}/api/employees/${employeeId}/documents/${documentId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete document');
  }

  return response.json();
};

// Excel Import/Export
export const importEmployeesFromExcel = async (file: File): Promise<void> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/employees/import`, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeaders().Authorization,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to import employees');
  }
};

export const exportEmployeesToExcel = async (): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/employees/export`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to export employees');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'employees.xlsx';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
};

export const getExcelTemplate = async (): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/employees/template`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get template');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'employee_template.xlsx';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
};

// Attendance Management
export const markAttendance = async (
  employeeId: string,
  date: string,
  status: 'present' | 'absent' | 'halfday'
): Promise<Employee> => {
  const response = await fetch(`${API_BASE_URL}/api/employees/${employeeId}/attendance`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ date, status }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to mark attendance');
  }

  return response.json();
};

// Milestone Management
export const addMilestone = async (employeeId: string, milestoneData: Record<string, unknown>): Promise<Employee> => {
  // Create a new payload with the correct field names
  const payload = {
    title: milestoneData.title,
    description: milestoneData.description || '',
    date: milestoneData.date, // Use correct field
    status: milestoneData.status,
    created_at: milestoneData.created_at
  };

  const response = await fetch(`${API_BASE_URL}/api/employees/${employeeId}/milestones`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to add milestone');
  }
  return response.json();
};

export const updateMilestone = async (
  employeeId: string,
  milestoneId: string,
  milestoneData: Record<string, unknown>
): Promise<Employee> => {
  // Only send fields the backend expects
  const payload = {
    title: milestoneData.title,
    description: milestoneData.description || '',
    date: milestoneData.date, // Use correct field
    status: milestoneData.status
  };

  const response = await fetch(`${API_BASE_URL}/api/employees/${employeeId}/milestones/${milestoneId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorText = await response.text();
    let error;
    try {
      error = JSON.parse(errorText);
    } catch {
      error = errorText;
    }
    throw new Error(typeof error === 'object' && error.detail ? error.detail : JSON.stringify(error));
  }
  return response.json();
};

export const deleteMilestone = async (employeeId: string, milestoneId: string): Promise<Employee> => {
  const response = await fetch(`${API_BASE_URL}/api/employees/${employeeId}/milestones/${milestoneId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete milestone');
  }

  return response.json();
};

// Export all functions as a service object
export const employeeService = {
  getAllEmployees,
  createEmployee,
  getEmployeeById,
  getEmployeeByEmail,
  updateEmployee,
  deleteEmployee,
  addTask,
  updateTask,
  deleteTask,
  addDocument,
  deleteDocument,
  importEmployeesFromExcel,
  exportEmployeesToExcel,
  getExcelTemplate,
  markAttendance,
  addMilestone,
  updateMilestone,
  deleteMilestone,
};