import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Mail, Phone, FileText, Calendar } from "lucide-react";
import { useSequentialFadeIn } from "@/lib/animations";
import api from "@/lib/axios";
import { toast } from "sonner";
import { toAbsoluteApiUrl } from "@/lib/runtimeConfig";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type CandidateStage = "applied" | "screening" | "interview" | "offer" | "hired" | "all";

interface Candidate {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  position: string;
  stage: string;
  status: string;
  experience: number | null;
  skills: string | null;
  notes: string | null;
  resume_url: string | null;
  created_at: string;
  updated_at: string;
  creator_name: string | null;
}

interface CandidateListProps {
  filter: string;
  stage: CandidateStage;
}

export const CandidateList = ({ filter, stage }: CandidateListProps) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/recruitment/candidates');
        
        // Ensure response is an array and has the correct shape
        const candidatesData = Array.isArray(response.data) 
          ? response.data.map((candidate: any) => ({
              ...candidate,
              experience: candidate.experience ? `${candidate.experience} years` : 'Not specified',
              created_at: new Date(candidate.created_at).toLocaleDateString()
            }))
          : [];
        
        setCandidates(candidatesData);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching candidates:', err);
        
        // Improved error handling
        let errorMessage = 'Failed to fetch candidates';
        
        if (err.response?.data) {
          try {
            const errorData = err.response.data;
            if (typeof errorData === 'object') {
              if (errorData.detail) {
                errorMessage = Array.isArray(errorData.detail)
                  ? errorData.detail.map((err: any) => 
                      typeof err === 'object' ? err.msg || JSON.stringify(err) : String(err)
                    ).join('; ')
                  : String(errorData.detail);
              } else {
                errorMessage = JSON.stringify(errorData);
              }
            } else {
              errorMessage = String(errorData);
            }
          } catch (e) {
            errorMessage = 'An unexpected error occurred while processing the response';
          }
        } else if (err.message) {
          errorMessage = String(err.message);
        }
        
        setError(errorMessage);
        setCandidates([]);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, []);

  const getStageBadgeColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case "applied": return "bg-gray-100 text-gray-800";
      case "screening": return "bg-blue-100 text-blue-800";
      case "interview": return "bg-purple-100 text-purple-800";
      case "offer": return "bg-amber-100 text-amber-800";
      case "hired": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active": return "bg-green-100 text-green-800";
      case "inactive": return "bg-red-100 text-red-800";
      case "completed": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleViewProfile = async (candidate: Candidate) => {
    if (!candidate.resume_url) {
      toast.error("No resume available for this candidate");
      return;
    }

    try {
      const response = await api.get(
        `/api/recruitment/candidates/${candidate.id}/view-profile`,
        {
          responseType: 'blob',
          headers: {
            'Accept': 'application/pdf',
          }
        }
      );

      // Create blob with PDF mime type
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      // Open in new tab
      window.open(url, '_blank');

      // Cleanup after a short delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error: any) {
      console.error('Error viewing profile:', error);
      const errorMessage = error.response?.data?.detail || error.message || "Failed to view profile";
      toast.error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
    }
  };

  // Default email subject and body template
  const getDefaultEmailSubject = (candidate?: Candidate) =>
    `Interview Invitation for ${candidate?.position || '[Job Title]'} at [Company Name]`;

  const getDefaultEmailBody = (candidate?: Candidate) =>
    `Dear ${candidate?.name || '[Candidate\'s Name]'},\n\nThank you for applying for the position of ${candidate?.position || '[Job Title]'} at [Company Name]. We have reviewed your application and are pleased to invite you for an interview to further discuss your qualifications and experience.\n\nInterview Details:\nDate: [Insert Date]\n\nTime: [Insert Time]\n\nMode: [In-Person / Video Call / Phone Call]\n\nLocation / Platform: [Office Address / Zoom, Google Meet, etc.]\n\nInterviewer: [Name and Designation of Interviewer]\n\nDuration: Approximately [XX] minutes\n\nIf the proposed time does not work for you, please let us know your availability, and we will do our best to accommodate it.\n\nKindly confirm your attendance by replying to this email by [Confirmation Deadline, e.g., 24 hours before the interview].\n\nWe look forward to speaking with you.`;

  // When opening the email dialog, set default subject and body
  const openEmailDialog = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setEmailSubject(getDefaultEmailSubject(candidate));
    setEmailBody(getDefaultEmailBody(candidate));
    setEmailDialogOpen(true);
  };

  const handleSendEmail = async () => {
    if (!selectedCandidate) return;

    try {
      if (!emailSubject.trim()) {
        toast.error("Email subject is required");
        return;
      }
      if (!emailBody.trim()) {
        toast.error("Email body is required");
        return;
      }

      // Create URLSearchParams instead of FormData
      const params = new URLSearchParams();
      params.append('subject', emailSubject.trim());
      params.append('body', emailBody.trim());

      const response = await api.post(
        `/api/recruitment/candidates/${selectedCandidate.id}/send-email`,
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      if (response.data.status === 'success') {
        toast.success(response.data.message || "Email sent successfully");
        setEmailDialogOpen(false);
        setEmailSubject("");
        setEmailBody("");
        setSelectedCandidate(null);
      } else {
        throw new Error(response.data.detail || "Failed to send email");
      }
    } catch (error: any) {
      console.error('Email sending error:', error);
      const errorMessage = error.response?.data?.detail || error.message || "Failed to send email";
      toast.error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
    }
  };

  const handleDelete = async (candidateId: number) => {
    try {
      await api.delete(`/api/recruitment/candidates/${candidateId}`);
      toast.success("Candidate deleted successfully");
      // Refresh the candidates list
      const response = await api.get('/api/recruitment/candidates');
      const candidatesData = Array.isArray(response.data) 
        ? response.data.map((candidate: any) => ({
            ...candidate,
            experience: candidate.experience ? `${candidate.experience} years` : 'Not specified',
            created_at: new Date(candidate.created_at).toLocaleDateString()
          }))
        : [];
      setCandidates(candidatesData);
    } catch (error) {
      toast.error("Failed to delete candidate");
    }
  };

  // Filter candidates based on stage and search query
  const filteredCandidates = Array.isArray(candidates) ? candidates.filter(candidate => {
    const matchesStage = stage === "all" || candidate.stage.toLowerCase() === stage;
    const matchesSearch = filter === "" || 
      candidate.name.toLowerCase().includes(filter.toLowerCase()) ||
      candidate.position.toLowerCase().includes(filter.toLowerCase()) ||
      candidate.email.toLowerCase().includes(filter.toLowerCase()) ||
      (candidate.skills && candidate.skills.toLowerCase().includes(filter.toLowerCase()));
    
    return matchesStage && matchesSearch;
  }) : [];

  const cardStyles = useSequentialFadeIn(filteredCandidates.length, 100, 50);

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading candidates...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        {error}
      </div>
    );
  }

  if (!Array.isArray(candidates) || filteredCandidates.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No candidates found matching your criteria.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredCandidates.map((candidate, index) => (
        <div 
          key={candidate.id} 
          style={cardStyles[index]}
          className="p-4 border rounded-lg bg-white hover:shadow-sm transition-shadow"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={candidate.resume_url ? toAbsoluteApiUrl(candidate.resume_url) : undefined}
              />
              <AvatarFallback>
                {candidate.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-medium">{candidate.name}</h3>
              <p className="text-muted-foreground text-sm truncate">{candidate.position}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {candidate.skills && candidate.skills.split(',').map(skill => (
                  <Badge key={skill} variant="outline" className="text-xs">{skill.trim()}</Badge>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col items-start gap-1 min-w-[150px]">
              <div className="flex items-center text-sm text-muted-foreground">
                <Mail className="mr-2 h-3 w-3" />
                <span className="truncate">{candidate.email}</span>
              </div>
              {candidate.phone && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Phone className="mr-2 h-3 w-3" />
                  <span>{candidate.phone}</span>
                </div>
              )}
            </div>
            
            <div className="flex flex-col items-start gap-1 min-w-[120px]">
              <div className="flex items-center text-sm text-muted-foreground">
                <FileText className="mr-2 h-3 w-3" />
                <span>{candidate.experience}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="mr-2 h-3 w-3" />
                <span>{candidate.created_at}</span>
              </div>
              {candidate.creator_name && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <span>Added by: {candidate.creator_name}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col gap-1">
                <Badge className={getStageBadgeColor(candidate.stage)}>
                  {candidate.stage.charAt(0).toUpperCase() + candidate.stage.slice(1)}
                </Badge>
                <Badge className={getStatusBadgeColor(candidate.status)}>
                  {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1)}
                </Badge>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleViewProfile(candidate)}>
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openEmailDialog(candidate)}>
                    Send Email
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href={`/recruitment/candidates/${candidate.id}/edit`}>
                      Update Stage
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-red-600"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this candidate?')) {
                        handleDelete(candidate.id);
                      }
                    }}
                  >
                    Delete Candidate
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      ))}
      
      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Email to {selectedCandidate?.name}</DialogTitle>
            <DialogDescription>
              Send an email to the candidate using the form below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Enter email subject"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Enter your message"
                rows={5}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendEmail}>
                Send Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
