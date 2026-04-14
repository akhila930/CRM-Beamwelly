
import { useState } from "react";
import { Attendance } from "@/types/employee";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { CalendarDays, Calendar as CalendarIcon, Download } from "lucide-react";
import { format } from "date-fns";
import * as XLSX from 'xlsx';

interface AttendanceTabProps {
  employeeId: string;
  attendance: Attendance[];
}

export function AttendanceTab({ employeeId, attendance }: AttendanceTabProps) {
  const { markAttendance } = useEmployees();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [status, setStatus] = useState<'present' | 'absent' | 'halfday'>('present');
  
  // Organize attendance for the calendar
  const attendanceMap = new Map<string, string>();
  attendance.forEach((a) => {
    attendanceMap.set(a.date, a.status);
  });
  
  const handleMarkAttendance = () => {
    if (!date) return;
    
    const formattedDate = format(date, 'yyyy-MM-dd');
    markAttendance(employeeId, formattedDate, status);
  };
  
  const getDayContent = (date: Date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    const status = attendanceMap.get(formattedDate);
    
    if (status) {
      let className = '';
      if (status === 'present') {
        className = 'bg-green-200 text-green-800 rounded-full';
      } else if (status === 'absent') {
        className = 'bg-red-200 text-red-800 rounded-full';
      } else if (status === 'halfday') {
        className = 'bg-yellow-200 text-yellow-800 rounded-full';
      }
      
      return (
        <div className={`h-7 w-7 flex items-center justify-center ${className}`}>
          {date.getDate()}
        </div>
      );
    }
    
    return date.getDate();
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">Present</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200">Absent</Badge>;
      case 'halfday':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200">Half Day</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  const exportAttendance = () => {
    try {
      // Prepare the data for export
      const exportData = attendance.map((a) => ({
        date: a.date,
        status: a.status,
      }));
      
      // Create a worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Create a workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
      
      // Generate and download the Excel file
      XLSX.writeFile(workbook, `attendance_${employeeId}.xlsx`);
    } catch (error) {
      console.error('Error exporting attendance to Excel:', error);
    }
  };
  
  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Mark Attendance</CardTitle>
            <CardDescription>Select a date and mark attendance</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={exportAttendance}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="pointer-events-auto border rounded-md p-3"
              components={{
                DayContent: ({ date }) => (
                  <div>
                    {getDayContent(date)}
                  </div>
                ),
              }}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium mb-2">Selected Date</p>
                <div className="p-2 border rounded-md bg-gray-50">
                  {date ? format(date, 'MMMM d, yyyy') : 'Select a date'}
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Status</p>
                <Select value={status} onValueChange={(value: 'present' | 'absent' | 'halfday') => setStatus(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="halfday">Half Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button onClick={handleMarkAttendance}>
              Mark Attendance
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle>Attendance History</CardTitle>
          <CardDescription>Recent attendance records</CardDescription>
        </CardHeader>
        <CardContent>
          {attendance.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p>No attendance records found.</p>
              <p className="text-sm mt-1">Select a date and mark attendance to get started.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...attendance]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 10)
                    .map((record, index) => (
                      <TableRow key={record.date}>
                        <TableCell className="font-medium">{record.date}</TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              {attendance.length > 10 && (
                <div className="p-2 text-center">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <CalendarDays className="h-4 w-4 mr-1" />
                        View All Records
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-96">
                      <div className="space-y-2">
                        <h4 className="font-medium">All Attendance Records</h4>
                        <div className="max-h-96 overflow-y-auto rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {[...attendance]
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .map((record) => (
                                  <TableRow key={record.date}>
                                    <TableCell className="font-medium">{record.date}</TableCell>
                                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
