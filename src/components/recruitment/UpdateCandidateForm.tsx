import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import api from "@/lib/axios";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  position: z.string().min(1, "Position is required"),
  experience: z.string().optional(),
  skills: z.string().optional(),
  stage: z.enum(["applied", "screening", "interview", "offer", "hired"]),
  status: z.enum(["active", "inactive", "completed"]),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface UpdateCandidateFormProps {
  candidateId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const UpdateCandidateForm = ({ candidateId, onSuccess, onCancel }: UpdateCandidateFormProps) => {
  const [loading, setLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      position: "",
      experience: "",
      skills: "",
      stage: "applied",
      status: "active",
      notes: "",
    }
  });

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        const response = await api.get(`/api/recruitment/candidates/${candidateId}`);
        const candidate = response.data;
        
        // Set form values
        form.reset({
          name: candidate.name || "",
          email: candidate.email || "",
          phone: candidate.phone || "",
          position: candidate.position || "",
          experience: candidate.experience?.toString() || "",
          skills: candidate.skills || "",
          stage: candidate.stage || "applied",
          status: candidate.status || "active",
          notes: candidate.notes || "",
        });
      } catch (error) {
        toast.error("Failed to fetch candidate details");
      }
    };

    fetchCandidate();
  }, [candidateId]);

  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true);
      
      // Handle resume upload first if there's a new file
      if (resumeFile) {
        const formData = new FormData();
        formData.append('resume', resumeFile);
        await api.put(`/api/recruitment/candidates/${candidateId}/resume`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      // Update other candidate details
      const formData = {
        ...data,
        experience: data.experience ? parseFloat(data.experience) : null,
        skills: data.skills ? data.skills.split(',').map(s => s.trim()).join(',') : null,
      };

      await api.put(`/api/recruitment/candidates/${candidateId}`, formData);
      
      toast.success("Candidate updated successfully");
      onSuccess?.();
    } catch (error: any) {
      console.error('Error updating candidate:', error);
      toast.error(error.response?.data?.detail || 'Failed to update candidate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input placeholder="+1 234 567 8900" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="position"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Position</FormLabel>
              <FormControl>
                <Input placeholder="Software Engineer" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="experience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Experience (years)</FormLabel>
              <FormControl>
                <Input type="number" step="0.1" min="0" placeholder="5" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="skills"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Skills (comma-separated)</FormLabel>
              <FormControl>
                <Input placeholder="JavaScript, React, Node.js" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="stage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stage</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="screening">Screening</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                  <SelectItem value="offer">Offer</SelectItem>
                  <SelectItem value="hired">Hired</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Add any notes about the candidate..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="resume"
          render={() => (
            <FormItem>
              <FormLabel>Update Resume (PDF)</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.type === 'application/pdf') {
                        setResumeFile(file);
                      } else {
                        toast.error("Please upload a PDF file");
                        e.target.value = '';
                      }
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Candidate"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
