import { useState } from "react";
import { Task } from "@/types/employee";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useEmployees } from "@/contexts/EmployeeContext";
import { Plus, Pencil, Trash, Clock, CalendarClock, FileDown } from "lucide-react";
import { useSequentialFadeIn } from "@/lib/animations";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, parse, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

interface TasksTabProps {
  employeeId: string;
  tasks: Task[];
}

export function TasksTab({ employeeId, tasks }: TasksTabProps) {
  const { addTask, updateTask, deleteTask } = useEmployees();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  
  const [newTask, setNewTask] = useState<Omit<Task, 'id'>>({
    title: '',
    description: '',
    due_date: new Date().toISOString().split('T')[0],
    status: 'pending',
    priority: 'medium',
    assigned_date: new Date().toISOString().split('T')[0],
  });
  
  const [editTask, setEditTask] = useState<Omit<Task, 'id'>>({
    title: '',
    description: '',
    due_date: '',
    status: 'pending',
    priority: 'medium',
    assigned_date: '',
  });
  
  const cardStyles = useSequentialFadeIn(tasks.length, 100, 50);
  
  // Filter tasks for selected month
  const getFilteredTasks = () => {
    if (!selectedMonth) return tasks;
    
    const monthStart = startOfMonth(parse(selectedMonth, 'yyyy-MM', new Date()));
    const monthEnd = endOfMonth(monthStart);
    
    return tasks.filter(task => {
      const taskDate = new Date(task.due_date);
      return isWithinInterval(taskDate, { start: monthStart, end: monthEnd });
    });
  };

  // Calculate task statistics
  const getTaskStats = (filteredTasks: Task[]) => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter(t => t.status === 'completed').length;
    const inProgress = filteredTasks.filter(t => t.status === 'in_progress').length;
    const pending = filteredTasks.filter(t => t.status === 'pending').length;
    const cancelled = filteredTasks.filter(t => t.status === 'cancelled').length;
    
    return { total, completed, inProgress, pending, cancelled };
  };

  // Generate and download PDF report
  const generatePDF = () => {
    const filteredTasks = getFilteredTasks();
    const stats = getTaskStats(filteredTasks);
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('Task Report', 14, 15);
    
    // Add month
    doc.setFontSize(12);
    doc.text(`Month: ${format(parse(selectedMonth, 'yyyy-MM', new Date()), 'MMMM yyyy')}`, 14, 25);
    
    // Add statistics
    doc.setFontSize(12);
    doc.text('Task Summary:', 14, 35);
    doc.text(`Total Tasks: ${stats.total}`, 20, 45);
    doc.text(`Completed: ${stats.completed}`, 20, 52);
    doc.text(`In Progress: ${stats.inProgress}`, 20, 59);
    doc.text(`Pending: ${stats.pending}`, 20, 66);
    doc.text(`Cancelled: ${stats.cancelled}`, 20, 73);
    
    // Add task details table
    const tableData = filteredTasks.map(task => [
      task.title,
      task.description || '-',
      format(new Date(task.due_date), 'dd/MM/yyyy'),
      task.status,
      task.priority
    ]);
    
    autoTable(doc, {
      startY: 85,
      head: [['Title', 'Description', 'Due Date', 'Status', 'Priority']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
    });
    
    // Save the PDF
    doc.save(`task-report-${selectedMonth}.pdf`);
  };
  
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    form: 'new' | 'edit'
  ) => {
    const { name, value } = e.target;
    if (form === 'new') {
      setNewTask({ ...newTask, [name]: value });
    } else {
      setEditTask({ ...editTask, [name]: value });
    }
  };
  
  const handleSelectChange = (
    name: string,
    value: string,
    form: 'new' | 'edit'
  ) => {
    if (form === 'new') {
      setNewTask({ ...newTask, [name]: value });
    } else {
      setEditTask({ ...editTask, [name]: value });
    }
  };
  
  const handleAddTask = () => {
    if (!newTask.title || !newTask.due_date) {
      return;
    }
    
    addTask(employeeId, newTask);
    setNewTask({
      title: '',
      description: '',
      due_date: new Date().toISOString().split('T')[0],
      status: 'pending',
      priority: 'medium',
      assigned_date: new Date().toISOString().split('T')[0],
    });
    setIsAddDialogOpen(false);
  };
  
  const handleEditTask = () => {
    if (!selectedTaskId || !editTask.title || !editTask.due_date) {
      return;
    }
    
    updateTask(employeeId, selectedTaskId, editTask);
    setIsEditDialogOpen(false);
  };
  
  const handleDeleteTask = () => {
    if (!selectedTaskId) {
      return;
    }
    
    deleteTask(employeeId, selectedTaskId);
    setIsDeleteDialogOpen(false);
  };
  
  const openEditDialog = (task: Task) => {
    setSelectedTaskId(task.id);
    setEditTask({
      title: task.title || '',
      description: task.description || '',
      due_date: task.due_date || new Date().toISOString().split('T')[0],
      status: task.status || 'pending',
      priority: task.priority || 'medium',
      assigned_date: task.assigned_date || new Date().toISOString().split('T')[0],
    });
    setIsEditDialogOpen(true);
  };
  
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200">Medium</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  return (
    <Card className="border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Tasks</CardTitle>
          <CardDescription>Manage employee tasks and assignments</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="month-select">Month:</Label>
            <Select
              value={selectedMonth}
              onValueChange={setSelectedMonth}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => {
                  const date = new Date(new Date().getFullYear(), i, 1);
                  const value = format(date, 'yyyy-MM');
                  return (
                    <SelectItem key={value} value={value}>
                      {format(date, 'MMMM yyyy')}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={generatePDF}
            className="flex items-center gap-2"
          >
            <FileDown className="h-4 w-4" />
            Export Report
          </Button>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
              <DialogDescription>
                Create a new task for this employee.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title*</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Task title"
                  value={newTask.title}
                  onChange={(e) => handleInputChange(e, 'new')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  placeholder="Task description"
                  value={newTask.description}
                  onChange={(e) => handleInputChange(e, 'new')}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date*</Label>
                  <Input
                    id="due_date"
                    name="due_date"
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => handleInputChange(e, 'new')}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="assigned_date">Assigned Date</Label>
                  <Input
                    id="assigned_date"
                    name="assigned_date"
                    type="date"
                    value={newTask.assigned_date}
                    onChange={(e) => handleInputChange(e, 'new')}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={newTask.status} 
                    onValueChange={(value) => handleSelectChange('status', value, 'new')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select 
                    value={newTask.priority} 
                    onValueChange={(value) => handleSelectChange('priority', value, 'new')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddTask}>Add Task</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <p>No tasks assigned to this employee yet.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add First Task
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task, index) => (
                  <TableRow key={task.id} style={cardStyles[index]}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell className="flex items-center gap-1">
                      <CalendarClock className="h-3 w-3 text-muted-foreground" />
                      {task.due_date}
                    </TableCell>
                    <TableCell>{getStatusBadge(task.status)}</TableCell>
                    <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(task)}
                          title="Edit Task"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedTaskId(task.id);
                            setIsDeleteDialogOpen(true);
                          }}
                          title="Delete Task"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      
      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update the task details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title*</Label>
              <Input
                id="edit-title"
                name="title"
                placeholder="Task title"
                value={editTask.title}
                onChange={(e) => handleInputChange(e, 'edit')}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                name="description"
                placeholder="Task description"
                value={editTask.description}
                onChange={(e) => handleInputChange(e, 'edit')}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-due_date">Due Date*</Label>
                <Input
                  id="edit-due_date"
                  name="due_date"
                  type="date"
                  value={editTask.due_date}
                  onChange={(e) => handleInputChange(e, 'edit')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-assigned_date">Assigned Date</Label>
                <Input
                  id="edit-assigned_date"
                  name="assigned_date"
                  type="date"
                  value={editTask.assigned_date}
                  onChange={(e) => handleInputChange(e, 'edit')}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select 
                  value={editTask.status} 
                  onValueChange={(value) => handleSelectChange('status', value, 'edit')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-priority">Priority</Label>
                <Select 
                  value={editTask.priority} 
                  onValueChange={(value) => handleSelectChange('priority', value, 'edit')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditTask}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Task Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTask}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
