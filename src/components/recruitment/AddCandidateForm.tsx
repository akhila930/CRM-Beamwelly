import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddCandidateFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const CANDIDATE_STAGES = [
  'Applied',
  'Screening',
  'Interview',
  'Offer',
  'Hired'
] as const;

export const AddCandidateForm = ({ onSuccess, onCancel }: AddCandidateFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",  // Optional
    position: "",
    experience: "",
    skills: "",
    notes: "",
    stage: "Applied"  // Default stage
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate required fields
    const requiredFields = ['name', 'email', 'position'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      setIsLoading(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    try {
      // Prepare candidate data with type conversions and validations
      const candidateData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || null,  // Send null if empty
        position: formData.position.trim(),
        experience: formData.experience 
          ? parseFloat(formData.experience) || null
          : null,
        skills: formData.skills
          .split(',')
          .map(skill => skill.trim())
          .filter(Boolean)
          .join(','),
        notes: formData.notes.trim() || null,
        stage: formData.stage.toLowerCase(),  // Convert stage to lowercase to match backend enum
        status: "active"  // Add default status
      };

      const response = await api.post("/api/recruitment/candidates", candidateData);

      if (response.data) {
        toast.success("Candidate added successfully");
        onSuccess();
      }
    } catch (error: any) {
      console.error("Error adding candidate:", error);
      
      // Improved error handling with better type safety
      let errorMessage = "Failed to add candidate";
      
      if (error.response?.data) {
        try {
          const errorData = error.response.data;
          
          if (typeof errorData === 'object') {
            if (errorData.detail) {
              errorMessage = Array.isArray(errorData.detail)
                ? errorData.detail
                    .map((err: any) => {
                      if (typeof err === 'object' && err !== null) {
                        return err.msg || JSON.stringify(err);
                      }
                      return String(err);
                    })
                    .join('; ')
                : String(errorData.detail);
            } else {
              errorMessage = JSON.stringify(errorData);
            }
          } else {
            errorMessage = String(errorData);
          }
        } catch (e) {
          errorMessage = "An unexpected error occurred while processing the response";
        }
      } else if (error.message) {
        errorMessage = String(error.message);
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStageChange = (value: string) => {
    setFormData(prev => ({ ...prev, stage: value }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Add New Candidate</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter candidate's full name"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter candidate's email"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter candidate's phone number (optional)"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Position *</Label>
              <Input
                id="position"
                name="position"
                value={formData.position}
                onChange={handleChange}
                required
                placeholder="Enter position applied for"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience">Experience (years)</Label>
              <Input
                id="experience"
                name="experience"
                type="number"
                min="0"
                step="0.1"
                value={formData.experience}
                onChange={handleChange}
                placeholder="Enter years of experience"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skills">Skills (comma separated)</Label>
              <Input
                id="skills"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                placeholder="e.g., JavaScript, React, Node.js"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="stage">Stage *</Label>
              <Select value={formData.stage} onValueChange={handleStageChange} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {CANDIDATE_STAGES.map(stage => (
                    <SelectItem key={stage} value={stage}>
                      {stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Add any additional notes about the candidate"
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Candidate"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};