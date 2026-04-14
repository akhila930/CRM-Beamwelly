import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEmployees } from '@/contexts/EmployeeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Task } from '@/types/employee';
import { format } from 'date-fns';

export function MyTasks({ employeeEmail }: { employeeEmail?: string }) {
  const { getEmployeeByEmail } = useEmployees();
  const { user } = useAuth();
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);
  const [createdTasks, setCreatedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      const email = employeeEmail || user?.email;
      if (!email) {
        setLoading(false);
        return;
      }
      try {
        const employee = await getEmployeeByEmail(email);
        if (employee) {
          setAssignedTasks(employee.tasks || []);
          // Filter tasks created by the current employee
          const created = employee.tasks?.filter(task => task.assigned_by === employee.id) || [];
          setCreatedTasks(created);
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [getEmployeeByEmail, employeeEmail, user?.email]);

  if (loading) {
    return <div>Loading tasks...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="assigned">
          <TabsList>
            <TabsTrigger value="assigned">Assigned to Me</TabsTrigger>
            <TabsTrigger value="created">Created by Me</TabsTrigger>
          </TabsList>
          <TabsContent value="assigned">
            <div className="space-y-4">
              {assignedTasks.length === 0 ? (
                <p>No tasks assigned to you.</p>
              ) : (
                assignedTasks.map((task) => (
                  <Card key={task.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{task.title}</h3>
                          <p className="text-sm text-gray-500">{task.description}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded text-xs ${
                            task.status === 'completed' ? 'bg-green-100 text-green-800' :
                            task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {task.status}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        <p>Due: {format(new Date(task.due_date), 'MMM dd, yyyy')}</p>
                        <p>Priority: {task.priority}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
          <TabsContent value="created">
            <div className="space-y-4">
              {createdTasks.length === 0 ? (
                <p>You haven't created any tasks.</p>
              ) : (
                createdTasks.map((task) => (
                  <Card key={task.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{task.title}</h3>
                          <p className="text-sm text-gray-500">{task.description}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded text-xs ${
                            task.status === 'completed' ? 'bg-green-100 text-green-800' :
                            task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {task.status}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        <p>Due: {format(new Date(task.due_date), 'MMM dd, yyyy')}</p>
                        <p>Priority: {task.priority}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 