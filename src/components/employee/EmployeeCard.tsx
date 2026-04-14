import { Employee } from "@/types/employee";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { UserCircle, Trash } from "lucide-react";

interface EmployeeCardProps {
  employee: Employee;
  onView: () => void;
  onDelete: () => void;
}

export function EmployeeCard({ employee, onView, onDelete }: EmployeeCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-12 w-12">
          <AvatarFallback>
            {employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold">{employee.name}</h3>
          <p className="text-sm text-muted-foreground">{employee.position}</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Department</span>
            <span>{employee.department || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Joined</span>
            <span>{format(new Date(employee.hire_date), 'PP')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Salary</span>
            <span>{employee.salary?.toLocaleString() || '-'}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" size="sm" onClick={onView}>
          <UserCircle className="mr-2 h-4 w-4" />
          View
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-600 hover:text-red-700">
          <Trash className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
} 