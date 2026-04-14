import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, X, Trash2 } from "lucide-react";
import { LeaveApplication, LeaveStatus } from "@/types/leave";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { useState } from "react";

interface LeaveTableProps {
  applications?: LeaveApplication[];
  isAdminView?: boolean;
  onUpdate?: () => void;
}

// Add helper function to calculate duration
const calculateDuration = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // Including both start and end days
};

export function LeaveTable({ applications = [], isAdminView = false, onUpdate }: LeaveTableProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'admin';
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const handleApprove = async (leaveId: number) => {
    try {
      await api.put(`/api/leave/requests/${leaveId}`, {
        status: 'approved'
      });
      toast({
        title: "Leave request approved",
        description: "The leave request has been approved successfully.",
      });
      onUpdate?.();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "Failed to approve leave request";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleReject = async (leaveId: number, rejectionReason?: string) => {
    try {
      await api.put(`/api/leave/requests/${leaveId}`, {
        status: 'rejected',
        rejection_reason: rejectionReason || 'Request rejected by admin'
      });
      toast({
        title: "Leave request rejected",
        description: "The leave request has been rejected.",
      });
      onUpdate?.();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "Failed to reject leave request";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (leaveId: number) => {
    try {
      await api.delete(`/api/leave/requests/${leaveId}`);
      toast({
        title: "Leave request deleted",
        description: "The leave request has been deleted successfully.",
      });
      setConfirmDeleteId(null);
      onUpdate?.();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "Failed to delete leave request";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: LeaveStatus) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  // Function to determine if a leave can be deleted
  const canDeleteLeave = (application: LeaveApplication) => {
    // Admins can delete any leave
    if (isAdmin) return true;
    
    // Regular users can only delete their own pending leaves
    return application.status === 'pending';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{isAdminView ? "Leave Approval" : "My Leave Applications"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {isAdminView && <TableHead>Employee</TableHead>}
              <TableHead>Type</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdminView ? 8 : 7} className="text-center py-8">
                  No leave applications found
                </TableCell>
              </TableRow>
            ) : (
              applications.map((application) => (
                <TableRow key={application.id}>
                  {isAdminView && <TableCell>{application.employee_name}</TableCell>}
                  <TableCell className="capitalize">{application.leave_type.toLowerCase()}</TableCell>
                  <TableCell>{new Date(application.start_date).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(application.end_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {application.duration || calculateDuration(application.start_date, application.end_date)} days
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={application.reason}>
                    {application.reason}
                  </TableCell>
                  <TableCell>{getStatusBadge(application.status as LeaveStatus)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {isAdmin && application.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => handleApprove(application.id)}
                            title="Approve Leave"
                          >
                            <Check className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => handleReject(application.id)}
                            title="Reject Leave"
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </>
                      )}
                      
                      {canDeleteLeave(application) && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0"
                              onClick={() => setConfirmDeleteId(application.id)}
                              title="Delete Leave Request"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Confirm Deletion</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete this leave request? This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="flex justify-end space-x-2">
                              <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogClose>
                              <Button 
                                variant="destructive"
                                onClick={() => handleDelete(application.id)}
                              >
                                Delete
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
