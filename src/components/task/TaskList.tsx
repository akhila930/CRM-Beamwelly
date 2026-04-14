import { useState, useEffect } from "react";
import { Check, ChevronDown, Filter, Plus, Search, SortAsc, Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuRadioGroup, 
  DropdownMenuRadioItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Task, TaskPriority, TaskStatus } from "@/types/task";
import { taskService } from "@/services/taskService";
import { employeeService } from "@/services/employeeService";
import { Employee } from "@/types/employee";
import { toast } from "sonner";
import { CreateTaskInput } from "@/types/task";

interface TaskListProps {
  isAdmin?: boolean;
  onTaskChange?: () => void;
  employees?: Employee[];
}

export function TaskList({ isAdmin = false, onTaskChange, employees: propEmployees }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>(propEmployees || []);
  const [loading, setLoading] = useState(true);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [priority, setPriority] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [newTask, setNewTask] = useState<CreateTaskInput>({
    title: "",
    description: "",
    assigned_to: 0,
    due_date: new Date().toISOString().split('T')[0],
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.PENDING,
    tags: [],
    comments: ""
  });

  useEffect(() => {
    const initialize = async () => {
      await Promise.all([fetchTasks(), fetchEmployees()]);
    };
    if (!propEmployees) {
      initialize();
    } else {
      fetchTasks();
      setLoadingEmployees(false);
    }
  }, [propEmployees]);

  useEffect(() => {
    if (propEmployees) {
      setEmployees(propEmployees);
      setLoadingEmployees(false);
    }
  }, [propEmployees]);

  const fetchEmployees = async () => {
    if (propEmployees) return;
    try {
      setLoadingEmployees(true);
      const data = await employeeService.getAllEmployees();
      console.log('Fetched employees:', data); // Debug log
      if (Array.isArray(data) && data.length > 0) {
        setEmployees(data);
      } else {
        console.warn('No employees found or invalid data format');
        setEmployees([]);
      }
    } catch (error: any) {
      console.error('Error fetching employees:', error);
      toast.error("Failed to fetch employees");
      setEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await taskService.getAllTasks();
      setTasks(data);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      toast.error("Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    try {
      if (!newTask.title.trim()) {
        toast.error("Please enter a task title");
        return;
      }

      if (!newTask.assigned_to) {
        toast.error("Please select an employee");
        return;
      }

      await taskService.createTask(newTask);
      setIsAddDialogOpen(false);
      setNewTask({
        title: "",
        description: "",
        assigned_to: 0,
        due_date: new Date().toISOString().split('T')[0],
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.PENDING,
        tags: [],
        comments: ""
      });
      await fetchTasks();
      toast.success("Task created successfully");
      console.log('onTaskChange in TaskList (Create):', onTaskChange);
      if (onTaskChange) onTaskChange();
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast.error(error.message || "Failed to create task");
    }
  };

  const handleUpdateTask = async () => {
    if (!selectedTask) return;

    try {
      await taskService.updateTask(selectedTask.id, selectedTask);
      setIsEditDialogOpen(false);
      fetchTasks();
      toast.success("Task updated successfully");
      console.log('onTaskChange in TaskList (Update):', onTaskChange);
      if (onTaskChange) onTaskChange();
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast.error("Failed to update task");
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;

    try {
      await taskService.deleteTask(selectedTask.id);
      setIsDeleteDialogOpen(false);
      fetchTasks();
      toast.success("Task deleted successfully");
      console.log('onTaskChange in TaskList (Delete):', onTaskChange);
      if (onTaskChange) onTaskChange();
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast.error("Failed to delete task");
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesPriority = priority === "all" || task.priority === priority;
    const matchesStatus = status === "all" || task.status === status;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPriority && matchesStatus && matchesSearch;
  });

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.HIGH:
        return <Badge className="bg-red-100 text-red-800">High</Badge>;
      case TaskPriority.MEDIUM:
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case TaskPriority.LOW:
        return <Badge className="bg-green-100 text-green-800">Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case TaskStatus.IN_PROGRESS:
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case TaskStatus.CANCELLED:
        return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>;
      case TaskStatus.PENDING:
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
        <CardTitle>Tasks</CardTitle>
        <Button 
          size="sm" 
          onClick={() => setIsAddDialogOpen(true)}
          disabled={loadingEmployees}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                className="md:max-w-sm w-full pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Priority
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuRadioGroup value={priority} onValueChange={setPriority}>
                  <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value={TaskPriority.HIGH}>High</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value={TaskPriority.MEDIUM}>Medium</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value={TaskPriority.LOW}>Low</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Status
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuRadioGroup value={status} onValueChange={setStatus}>
                  <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value={TaskStatus.PENDING}>Pending</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value={TaskStatus.IN_PROGRESS}>In Progress</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value={TaskStatus.COMPLETED}>Completed</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value={TaskStatus.CANCELLED}>Cancelled</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>{task.title}</TableCell>
                  <TableCell>{task.description}</TableCell>
                  <TableCell>
                    {employees.find(e => e.id.toString() === task.assigned_to.toString())?.name || 'Unknown'}
                  </TableCell>
                  <TableCell>{formatDate(task.due_date)}</TableCell>
                  <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                  <TableCell>{getStatusBadge(task.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedTask(task);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedTask(task);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Add Task Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>
              Create a new task and assign it to an employee
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {loadingEmployees ? (
              <div className="text-center">Loading employees...</div>
            ) : employees.length === 0 ? (
              <div className="text-center text-red-500">
                No employees available. Please add employees first.
                <pre className="mt-2 text-xs text-gray-500">
                  Debug info: {JSON.stringify(employees, null, 2)}
                </pre>
              </div>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Enter task title"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Enter task description"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="assigned_to">Assign To</Label>
                  <Select 
                    value={newTask.assigned_to ? newTask.assigned_to.toString() : ""} 
                    onValueChange={(value) => setNewTask({ ...newTask, assigned_to: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id.toString()}>
                          {employee.name} ({employee.position || employee.department || 'No department'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select 
                    value={newTask.priority} 
                    onValueChange={(value) => setNewTask({ ...newTask, priority: value as TaskPriority })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                      <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                      <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTask}
              disabled={loadingEmployees || !newTask.title.trim() || !newTask.assigned_to}
            >
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={selectedTask?.title}
                onChange={(e) => setSelectedTask(selectedTask ? { ...selectedTask, title: e.target.value } : null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={selectedTask?.description}
                onChange={(e) => setSelectedTask(selectedTask ? { ...selectedTask, description: e.target.value } : null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dueDate">Due Date</Label>
              <Input
                id="edit-dueDate"
                type="date"
                value={selectedTask?.due_date}
                onChange={(e) => setSelectedTask(selectedTask ? { ...selectedTask, due_date: e.target.value } : null)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-priority">Priority</Label>
                <Select
                  value={selectedTask?.priority}
                  onValueChange={(value: TaskPriority) => setSelectedTask(selectedTask ? { ...selectedTask, priority: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                    <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                    <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={selectedTask?.status}
                  onValueChange={(value: TaskStatus) => setSelectedTask(selectedTask ? { ...selectedTask, status: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TaskStatus.PENDING}>Pending</SelectItem>
                    <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                    <SelectItem value={TaskStatus.COMPLETED}>Completed</SelectItem>
                    <SelectItem value={TaskStatus.CANCELLED}>Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTask}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Task Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTask}>
              Delete Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
