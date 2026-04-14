import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeaveApplicationForm } from "@/components/leave/LeaveApplicationForm";
import { LeaveTable } from "@/components/leave/LeaveTable";
import { LeaveCalendar } from "@/components/leave/LeaveCalendar";
import { LeaveBalanceCard } from "@/components/leave/LeaveBalanceCard";
import { useAuth } from "@/contexts/AuthContext";
import { useFadeIn } from "@/lib/animations";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import { LeaveApplication, LeaveBalance, LeaveType } from "@/types/leave";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Calculate used leave days from approved leave requests
const calculateUsedLeave = (leaveType: LeaveType, leaves: LeaveApplication[]) => {
  console.log(`Calculating used ${leaveType} leave`);
  const approvedLeaves = leaves.filter(leave => {
    const isApproved = leave.status === 'approved';
    const isCorrectType = leave.leave_type === leaveType;
    console.log(`Leave ID: ${leave.id}, Type: ${leave.leave_type}, Status: ${leave.status}, Is Approved: ${isApproved}, Is Correct Type: ${isCorrectType}`);
    return isApproved && isCorrectType;
  });
  console.log(`Approved ${leaveType} leaves:`, approvedLeaves);

  const usedDays = approvedLeaves.reduce((sum, leave) => {
     // Calculate duration based on start_date and end_date if duration field is missing or invalid
     const duration = typeof leave.duration === 'number' && leave.duration > 0
       ? leave.duration
       : (() => {
           try {
             const startDate = Date.parse(leave.start_date);
             const endDate = Date.parse(leave.end_date);
             if (isNaN(startDate) || isNaN(endDate)) {
               console.error('Invalid date format for duration calculation:', leave.start_date, leave.end_date);
               return 0;
             }
             const diffTime = Math.abs(endDate - startDate);
             // Calculate difference in days, adding 1 to include both start and end dates
             const calculatedDuration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
             console.log(`Leave ID: ${leave.id}, Start: ${leave.start_date}, End: ${leave.end_date}, Calculated Duration: ${calculatedDuration}`);
             return calculatedDuration;
           } catch (e) {
             console.error('Error calculating duration from dates:', e);
             return 0;
           }
         })();

     console.log(`Leave ID: ${leave.id}, Duration: ${duration}, Current Sum: ${sum}`);
     return sum + duration;
  }, 0);
  console.log(`Total used ${leaveType} leave: ${usedDays}`);
  return usedDays;
};

// Calculate remaining leave days
const calculateRemainingLeave = (leaveType: LeaveType, totalPolicy: number, usedDays: number) => {
   const remaining = totalPolicy - usedDays;
   // Ensure remaining days are not negative
   return Math.max(0, remaining);
};

export default function LeaveManagement() {
  const [selectedTab, setSelectedTab] = useState("my-leaves");
  const [myLeaves, setMyLeaves] = useState<LeaveApplication[]>([]);
  const [allLeaves, setAllLeaves] = useState<LeaveApplication[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPolicyDialogOpen, setIsPolicyDialogOpen] = useState(false);
  const [leavePolicy, setLeavePolicy] = useState({
    annual_leave_count: 20,
    sick_leave_count: 15,
    casual_leave_count: 12,
  });
  const fadeStyle = useFadeIn();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const [calendarLeaves, setCalendarLeaves] = useState<LeaveApplication[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
  }, [isAuthenticated, navigate]);

  const fetchLeaveRequests = async () => {
    if (!user?.company_name) return;
    // Fetch all leaves for the user to calculate used/remaining for KPI
    fetchLeaves(false);
  };

  const fetchAllLeaves = async () => {
    if (!isAdmin || !user?.company_name) return;
    // Fetch all leaves for admin view
    fetchLeaves(true);
  };

  const fetchLeaveBalance = async () => {
    if (!user?.company_name) return;
    // No longer need to fetch leave balance separately for KPI display
    // We will calculate remaining from leave requests
    setLoading(false);
  };

  const fetchCalendarLeaves = async () => {
    if (!user?.company_name) return;
    try {
      const response = await api.get(`/api/leave/calendar?company_name=${user.company_name}`);
      setCalendarLeaves(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch leave calendar",
        variant: "destructive",
      });
    }
  };

  const fetchLeavePolicy = async () => {
    if (!isAdmin || !user?.company_name) return;
    try {
      const response = await api.get(`/api/leave-policy?company_name=${user.company_name}`);
      setLeavePolicy(response.data);
    } catch (error) {
      console.error('Error fetching leave policy:', error);
      toast({
        title: "Error",
        description: "Failed to fetch leave policy.",
        variant: "destructive",
      });
    }
  };

  const handlePolicyUpdate = async () => {
    if (!user?.company_name) return;
    try {
      await api.put(`/api/leave-policy?company_name=${user.company_name}`, leavePolicy);
      toast({
        title: "Success",
        description: "Leave policy updated successfully",
      });
      setIsPolicyDialogOpen(false);
      fetchLeaveBalance();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update leave policy",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.company_name) {
      fetchLeaveRequests(); // This will now call fetchLeaves(false)
      fetchAllLeaves(); // This will now call fetchLeaves(true) if admin
      fetchLeavePolicy();
      fetchCalendarLeaves();
    } else if (!isAuthenticated) {
       setLoading(false); // Ensure loading is false if not authenticated
    }
  }, [isAdmin, isAuthenticated, user?.company_name]); // Depend on isAdmin, isAuthenticated and user?.company_name

  const fetchLeaves = async (all: boolean) => {
    if (!user?.company_name) return;
    setLoading(true);
    try {
      const endpoint = all ? `/api/leave/requests?all=true&company_name=${user.company_name}` : `/api/leave/requests?company_name=${user.company_name}`;
      console.log('Fetching leaves from endpoint:', endpoint);
      const response = await api.get(endpoint);
      if (all) {
        setAllLeaves(response.data);
      } else {
        setMyLeaves(response.data);
        console.log('Fetched myLeaves:', response.data);
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        navigate('/auth');
        return;
      }
      toast({
        title: "Error",
        description: `Failed to fetch ${all ? 'all' : 'your'} leave requests`,
        variant: "destructive",
      });
    } finally {
       setLoading(false);
    }
  };

  const handleLeaveUpdate = () => {
    // Refetch leaves after a leave update
    fetchLeaves(false);
    if (isAdmin) {
      fetchLeaves(true);
    }
    fetchCalendarLeaves();
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen w-full bg-gray-50/40">
        <Sidebar />
        <div className="flex-1">
          <Header title="Leave Management" />
          <main className="flex-1 p-6 md:p-8">
            <div className="flex items-center justify-center h-full">
              Loading...
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-gray-50/40">
      <Sidebar />
      <div className="flex-1">
        <Header title="Leave Management" />
        <main className="flex-1 p-6 md:p-8">
          <div style={fadeStyle} className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
              <p className="text-muted-foreground">
                Apply for leave, track your leave balance, and view leave calendar
              </p>
            </div>
            
            <div className="flex gap-4">
              {isAdmin && (
                <Dialog open={isPolicyDialogOpen} onOpenChange={setIsPolicyDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">Manage Leave Policy</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Manage Leave Policy</DialogTitle>
                      <DialogDescription>
                        Set the number of leave days for each type of leave
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="annual" className="text-right">
                          Annual Leave
                        </Label>
                        <Input
                          id="annual"
                          type="number"
                          value={leavePolicy.annual_leave_count}
                          onChange={(e) => setLeavePolicy(prev => ({
                            ...prev,
                            annual_leave_count: parseInt(e.target.value) || 0
                          }))}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="sick" className="text-right">
                          Sick Leave
                        </Label>
                        <Input
                          id="sick"
                          type="number"
                          value={leavePolicy.sick_leave_count}
                          onChange={(e) => setLeavePolicy(prev => ({
                            ...prev,
                            sick_leave_count: parseInt(e.target.value) || 0
                          }))}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="casual" className="text-right">
                          Casual Leave
                        </Label>
                        <Input
                          id="casual"
                          type="number"
                          value={leavePolicy.casual_leave_count}
                          onChange={(e) => setLeavePolicy(prev => ({
                            ...prev,
                            casual_leave_count: parseInt(e.target.value) || 0
                          }))}
                          className="col-span-3"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handlePolicyUpdate}>Save changes</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
              <LeaveApplicationForm onSuccess={handleLeaveUpdate} companyId={user?.company_name || null} />
            </div>
          </div>

          {/* Display Leave Balance KPIs based on policy and approved leaves */}
          {leavePolicy && myLeaves !== null && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <LeaveBalanceCard
                type="Annual Leave"
                total={leavePolicy.annual_leave_count}
                used={calculateUsedLeave('annual', myLeaves)}
                remaining={calculateRemainingLeave('annual', leavePolicy.annual_leave_count, calculateUsedLeave('annual', myLeaves))}
              />
              <LeaveBalanceCard
                type="Sick Leave"
                total={leavePolicy.sick_leave_count}
                used={calculateUsedLeave('sick', myLeaves)}
                remaining={calculateRemainingLeave('sick', leavePolicy.sick_leave_count, calculateUsedLeave('sick', myLeaves))}
              />
              <LeaveBalanceCard
                type="Casual Leave"
                total={leavePolicy.casual_leave_count}
                used={calculateUsedLeave('casual', myLeaves)}
                remaining={calculateRemainingLeave('casual', leavePolicy.casual_leave_count, calculateUsedLeave('casual', myLeaves))}
              />
            </div>
          )}

          {/* Ensure allLeaves is not null before rendering the admin tab */}
          <div className="mt-8">
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="my-leaves">My Leaves</TabsTrigger>
                <TabsTrigger value="calendar">Calendar View</TabsTrigger>
                {isAdmin && allLeaves !== null && <TabsTrigger value="approve">Approve Leaves</TabsTrigger>}
              </TabsList>
              
              <TabsContent value="my-leaves">
                <LeaveTable
                  applications={myLeaves}
                  onUpdate={handleLeaveUpdate}
                />
              </TabsContent>
              
              <TabsContent value="calendar">
                <LeaveCalendar
                  leaveApplications={calendarLeaves}
                  isDepartmentView={isAdmin}
                />
              </TabsContent>
              
              {isAdmin && allLeaves !== null && (
                <TabsContent value="approve">
                  <LeaveTable
                    applications={allLeaves}
                    isAdminView
                    onUpdate={handleLeaveUpdate}
                  />
                </TabsContent>
              )}
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
