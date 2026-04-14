import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
} from "@/components/ui/dialog";
import { Milestone } from "@/types/employee";
import { Plus } from "lucide-react";

interface AddMilestoneDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  newMilestone: Omit<Milestone, 'id'>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onAddMilestone: () => void;
}

export function AddMilestoneDialog({ 
  isOpen, 
  onOpenChange, 
  newMilestone, 
  onInputChange, 
  onAddMilestone 
}: AddMilestoneDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Milestone
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Milestone</DialogTitle>
          <DialogDescription>
            Record a new career milestone or achievement.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g., Promotion to Senior Developer"
              value={newMilestone.title}
              onChange={onInputChange}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="date">Date Achieved</Label>
            <Input
              id="date"
              name="date"
              type="date"
              value={newMilestone.date}
              onChange={onInputChange}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe the milestone"
              value={newMilestone.description}
              onChange={onInputChange}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onAddMilestone}>Add Milestone</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
