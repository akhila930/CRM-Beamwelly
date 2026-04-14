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
} from "@/components/ui/dialog";
import { Milestone } from "@/types/employee";

interface EditMilestoneDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMilestone: Milestone | null;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onUpdateMilestone: () => void;
}

export function EditMilestoneDialog({ 
  isOpen, 
  onOpenChange, 
  selectedMilestone, 
  onInputChange, 
  onUpdateMilestone 
}: EditMilestoneDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Milestone</DialogTitle>
          <DialogDescription>
            Update milestone details.
          </DialogDescription>
        </DialogHeader>
        {selectedMilestone && (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                name="title"
                value={selectedMilestone.title}
                onChange={onInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-date">Date Achieved</Label>
              <Input
                id="edit-date"
                name="date"
                type="date"
                value={selectedMilestone.date || ""}
                onChange={onInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status">Status</Label>
              <select
                id="edit-status"
                name="status"
                value={selectedMilestone.status}
                onChange={onInputChange}
                className="border rounded px-2 py-1"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                name="description"
                value={selectedMilestone.description}
                onChange={onInputChange}
                rows={3}
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onUpdateMilestone}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
