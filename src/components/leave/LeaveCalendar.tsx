import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LeaveApplication } from "@/types/leave";
import { addDays, isSameDay, isWithinInterval } from "date-fns";

interface LeaveCalendarProps {
  leaveApplications?: LeaveApplication[];
  isDepartmentView?: boolean;
}

export function LeaveCalendar({ leaveApplications = [], isDepartmentView = false }: LeaveCalendarProps) {
  const [selectedTab, setSelectedTab] = useState("month");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const getLeaveApplicationsForDay = (day: Date) => {
    return leaveApplications.filter(leave => {
      const startDate = new Date(leave.start_date);
      const endDate = new Date(leave.end_date);
      return isWithinInterval(day, { start: startDate, end: endDate });
    });
  };

  const getDayClassName = (day: Date) => {
    const leaves = getLeaveApplicationsForDay(day);
    if (leaves.length === 0) return "";

    const hasApproved = leaves.some(leave => leave.status === "approved");
    const hasPending = leaves.some(leave => leave.status === "pending");
    const hasRejected = leaves.some(leave => leave.status === "rejected");

    if (hasApproved) return "bg-green-100 hover:bg-green-200";
    if (hasPending) return "bg-yellow-100 hover:bg-yellow-200";
    if (hasRejected) return "bg-red-100 hover:bg-red-200";
    return "";
  };

  const renderDayContent = (day: Date) => {
    const leaves = getLeaveApplicationsForDay(day);
    if (leaves.length === 0) return null;

    return (
      <div className="absolute bottom-0 left-0 right-0">
        <div className="flex justify-center space-x-1 pb-1">
          {leaves.map((leave, index) => (
            <div
              key={index}
              className={`h-1 w-1 rounded-full ${
                leave.status === "approved"
                  ? "bg-green-500"
                  : leave.status === "pending"
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
              title={`${leave.employee_name}: ${leave.leave_type}`}
            />
          ))}
        </div>
      </div>
    );
  };

  const selectedDateLeaves = selectedDate
    ? getLeaveApplicationsForDay(selectedDate)
    : [];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Leave Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="month" className="w-full" onValueChange={setSelectedTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="day">Day</TabsTrigger>
          </TabsList>
          
          <TabsContent value="month">
            <div className="flex flex-col space-y-4">
              <Calendar 
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border w-full"
                modifiers={{
                  hasLeave: (date) => getLeaveApplicationsForDay(date).length > 0,
                }}
                modifiersClassNames={{
                  hasLeave: "relative",
                }}
                components={{
                  Day: ({ date, ...props }) => (
                    <div
                      {...props}
                      className={`relative ${getDayClassName(date)} ${props.className}`}
                    >
                      {date.getDate()}
                      {renderDayContent(date)}
                    </div>
                  ),
                }}
              />
              
              {selectedDate && selectedDateLeaves.length > 0 && (
                <div className="border rounded-md p-4 space-y-2">
                  <h3 className="font-medium">
                    Leaves on {selectedDate.toLocaleDateString()}
                  </h3>
                  <div className="space-y-2">
                    {selectedDateLeaves.map((leave, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>
                          {isDepartmentView && `${leave.employee_name} - `}
                          {leave.leave_type}
                        </span>
                        <Badge
                          className={
                            leave.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : leave.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {leave.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex flex-wrap gap-2 mt-4">
                <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Approved</Badge>
                <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>
                <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Rejected</Badge>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="week">
            <div className="text-center p-8 border rounded-md">
              Week view will be implemented here
            </div>
          </TabsContent>
          
          <TabsContent value="day">
            <div className="text-center p-8 border rounded-md">
              Day view will be implemented here
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
