import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/axios";
import { Mail, Copy, Check, Trash2 } from "lucide-react";
import { RatingStars } from "@/components/ui/rating-stars";

interface ClientFeedback {
  id: number;
  client_email: string;
  feedback: string | null;
  rating: number | null;
  remarks: string | null;
  is_submitted: boolean;
  created_at: string;
  updated_at: string;
}

export function ClientFeedback() {
  const [feedbacks, setFeedbacks] = useState<ClientFeedback[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [clientEmail, setClientEmail] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const response = await api.get("/api/feedback/client");
      setFeedbacks(response.data);
    } catch (error) {
      console.error("Error fetching client feedbacks:", error);
      toast({
        title: "Error",
        description: "Failed to fetch client feedbacks",
        variant: "destructive",
      });
    }
  };

  const handleSendForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter client email",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await api.post("/api/feedback/client/form", {
        client_email: clientEmail.trim(),
      });

      setFormUrl(response.data.form_url);
      toast({
        title: "Success",
        description: "Feedback form sent to client",
      });
    } catch (error) {
      console.error("Error sending feedback form:", error);
      toast({
        title: "Error",
        description: "Failed to send feedback form",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(formUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      toast({
        title: "Success",
        description: "Form URL copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy URL",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (feedbackId: number) => {
    if (!confirm("Are you sure you want to delete this feedback?")) {
      return;
    }

    try {
      await api.delete(`/api/feedback/client/${feedbackId}`);
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
        <h2 className="text-xl font-semibold">All Client Feedback</h2>
        <Button onClick={() => setIsDialogOpen(true)}>Send Feedback Form</Button>
      </div>

      <div className="grid gap-4">
        {feedbacks.map((feedback) => (
          <Card key={feedback.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    From: <span className="font-medium">{feedback.client_name}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Email: <span className="font-medium">{feedback.client_email}</span>
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
          <form onSubmit={handleSendForm}>
            <DialogHeader>
              <DialogTitle>Send Feedback Form</DialogTitle>
              <DialogDescription>
                Enter the client's email address to send them a feedback form.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Client Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="client@example.com"
                  required
                />
              </div>

              {formUrl && (
                <div className="grid gap-2">
                  <Label>Form URL</Label>
                  <div className="flex gap-2">
                    <Input value={formUrl} readOnly />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={copyToClipboard}
                    >
                      {isCopied ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You can also copy and share this URL directly with the client.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setIsDialogOpen(false);
                setClientEmail("");
                setFormUrl("");
              }}>
                Close
              </Button>
              {!formUrl && <Button type="submit">Send Form</Button>}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 