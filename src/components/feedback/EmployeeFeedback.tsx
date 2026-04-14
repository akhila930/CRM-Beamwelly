import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/axios";
import { RatingStars } from "@/components/ui/rating-stars";
import { Trash2 } from "lucide-react";

interface Employee {
  id: number;
  name: string;
  position: string;
  department: string;
  email: string;
}

interface Feedback {
  id: number;
  from_employee_id: number;
  to_employee_id: number;
  feedback: string;
  rating: number;
  remarks: string | null;
  created_at: string;
  from_employee_name: string;
  to_employee_name: string;
}

export function EmployeeFeedback() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [feedbackText, setFeedbackText] = useState("");
  const [rating, setRating] = useState(0);
  const [remarks, setRemarks] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchEmployees();
    fetchFeedbacks();
  }, []);

  const fetchEmployees = async () => {
    try {
      console.log("Fetching employees from /api/feedback/employees...");
      const response = await api.get("/api/feedback/employees");
      console.log("Raw employee response:", response);
      console.log("Employee data:", response.data);
      
      if (!response.data || !Array.isArray(response.data)) {
        console.error("Invalid response format:", response.data);
        toast({
          title: "Error",
          description: "Invalid employee data format received",
          variant: "destructive",
        });
        return;
      }
      
      if (response.data.length === 0) {
        console.log("No employees found in response");
        toast({
          title: "Info",
          description: "No employees available for feedback",
          variant: "destructive",
        });
      } else {
        console.log(`Found ${response.data.length} employees`);
      }
      
      setEmployees(response.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive",
      });
    }
  };

  const fetchFeedbacks = async () => {
    try {
      const response = await api.get("/api/feedback/employee");
      setFeedbacks(response.data);
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
      toast({
        title: "Error",
        description: "Failed to fetch feedbacks",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmployee) {
      toast({
        title: "Error",
        description: "Please select an employee",
        variant: "destructive",
      });
      return;
    }

    if (!feedbackText.trim()) {
      toast({
        title: "Error",
        description: "Please enter feedback",
        variant: "destructive",
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: "Error",
        description: "Please select a rating",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Submitting feedback for employee:", selectedEmployee);
      const response = await api.post("/api/feedback/employee", {
        to_employee_id: parseInt(selectedEmployee),
        feedback: feedbackText.trim(),
        rating: rating,
        remarks: remarks.trim() || null,
      }, {
        withCredentials: true
      });

      console.log("Feedback submission response:", response.data);

      toast({
        title: "Success",
        description: "Feedback submitted successfully",
      });

      // Reset form and refresh feedbacks
      setSelectedEmployee("");
      setFeedbackText("");
      setRating(0);
      setRemarks("");
      setIsDialogOpen(false);
      await fetchFeedbacks(); // Use await to ensure feedbacks are refreshed
    } catch (error: any) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to submit feedback",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (feedbackId: number) => {
    if (!confirm("Are you sure you want to delete this feedback?")) {
      return;
    }

    try {
      await api.delete(`/api/feedback/employee/${feedbackId}`);
      toast({
        title: "Success",
        description: "Feedback deleted successfully",
      });
      fetchFeedbacks();
    } catch (error) {
      console.error("Error deleting feedback:", error);
      toast({
        title: "Error",
        description: "Failed to delete feedback",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">All Employee Feedback</h2>
        <Button onClick={() => setIsDialogOpen(true)}>Give Feedback</Button>
      </div>

      <div className="grid gap-4">
        {feedbacks.map((feedback) => (
          <Card key={feedback.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    From: <span className="font-medium">{feedback.from_employee_name}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    To: <span className="font-medium">{feedback.to_employee_name}</span>
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="text-right">
                    <div className="mb-1">
                      <RatingStars rating={feedback.rating} readOnly size="sm" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(feedback.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-700 hover:bg-red-100"
                    onClick={() => handleDelete(feedback.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="mb-2">{feedback.feedback}</p>
              {feedback.remarks && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Remarks:</span> {feedback.remarks}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Give Feedback</DialogTitle>
              <DialogDescription>
                Provide feedback for your colleague. All fields marked with * are required.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="employee">Employee *</Label>
                <Select
                  value={selectedEmployee}
                  onValueChange={setSelectedEmployee}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees && employees.length > 0 ? (
                      employees.map((employee) => (
                        <SelectItem 
                          key={employee.id} 
                          value={employee.id.toString()}
                        >
                          {employee.name} - {employee.position} ({employee.department})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="placeholder" disabled>
                        Loading employees...
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {employees.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    No employees found. Please make sure employees are added in the Employee Dashboard.
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="feedback">Feedback *</Label>
                <Textarea
                  id="feedback"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Enter your feedback here"
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid gap-2">
                <Label>Rating *</Label>
                <div className="py-2">
                  <RatingStars 
                    rating={rating} 
                    onRatingChange={setRating}
                    size="lg"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="remarks">Additional Remarks</Label>
                <Textarea
                  id="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter any additional remarks (optional)"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Submit Feedback</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 