import { useState } from "react";
import { Milestone } from "@/types/employee";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Download, Plus } from "lucide-react";
import { useEmployees } from "@/contexts/EmployeeContext";
import { MilestonesList } from "./milestones/MilestonesList";
import { AddMilestoneDialog } from "./milestones/AddMilestoneDialog";
import { EditMilestoneDialog } from "./milestones/EditMilestoneDialog";
import { exportMilestonesToExcel } from "./milestones/milestonesUtils";

interface MilestonesTabProps {
  employeeId: string;
  milestones: Milestone[];
}

// Helper type guard
function isDate(obj: any): obj is Date {
  return Object.prototype.toString.call(obj) === '[object Date]';
}

export function MilestonesTab({ employeeId, milestones }: MilestonesTabProps) {
  const { addMilestone, updateMilestone, deleteMilestone } = useEmployees();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  
  const [newMilestone, setNewMilestone] = useState<Omit<Milestone, 'id'>>({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    status: 'pending',
    created_at: new Date().toISOString()
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewMilestone({
      ...newMilestone,
      [name]: value,
    });
  };
  
  const handleAddMilestone = () => {
    if (!newMilestone.title || newMilestone.title.trim().length < 3) {
      alert('Please enter a valid milestone title.');
      return;
    }
    if (!newMilestone.date) {
      alert('Please select a valid date.');
      return;
    }
    const milestoneToSend = {
      title: newMilestone.title,
      description: newMilestone.description || '',
      date: newMilestone.date,
      status: newMilestone.status,
      created_at: new Date().toISOString()
    };
    addMilestone(employeeId, milestoneToSend);
    setNewMilestone({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      created_at: new Date().toISOString()
    });
    setIsAddDialogOpen(false);
  };
  
  const handleUpdateMilestone = () => {
    if (selectedMilestone) {
      const { id, ...updatedFields } = selectedMilestone;
      // Ensure date is in YYYY-MM-DD format
      let formattedDate = updatedFields.date;
      if (formattedDate && isDate(formattedDate)) {
        formattedDate = formattedDate.toISOString().split('T')[0];
      } else if (typeof formattedDate === 'string' && formattedDate.includes('T')) {
        formattedDate = formattedDate.split('T')[0];
      }
      const milestoneUpdate: any = {
        title: updatedFields.title,
        description: updatedFields.description || '',
        status: updatedFields.status || 'pending'
      };
      if (formattedDate && typeof formattedDate === 'string' && formattedDate.trim() !== '') {
        milestoneUpdate.date = formattedDate;
      }
      console.log('Updating milestone with payload:', milestoneUpdate);
      updateMilestone(employeeId, id, milestoneUpdate);
      setSelectedMilestone(null);
      setIsEditDialogOpen(false);
    }
  };
  
  const openEditDialog = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    setIsEditDialogOpen(true);
  };
  
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (selectedMilestone) {
      setSelectedMilestone({
        ...selectedMilestone,
        [name]: value,
      });
    }
  };
  
  const exportMilestones = () => {
    exportMilestonesToExcel(milestones, employeeId);
  };
  
  return (
    <div className="space-y-4">
      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Milestones & Achievements</CardTitle>
            <CardDescription>Career milestones and achievements</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportMilestones}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <AddMilestoneDialog 
              isOpen={isAddDialogOpen}
              onOpenChange={setIsAddDialogOpen}
              newMilestone={newMilestone}
              onInputChange={handleInputChange}
              onAddMilestone={handleAddMilestone}
            />
          </div>
        </CardHeader>
        <CardContent>
          {milestones.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No milestones have been recorded yet.</p>
              <p className="text-sm mt-1">Add a milestone to track career progress.</p>
            </div>
          ) : (
            <MilestonesList 
              milestones={milestones} 
              onEdit={openEditDialog} 
              onDelete={(milestoneId) => deleteMilestone(employeeId, milestoneId)} 
            />
          )}
        </CardContent>
      </Card>
      
      <EditMilestoneDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        selectedMilestone={selectedMilestone}
        onInputChange={handleEditInputChange}
        onUpdateMilestone={handleUpdateMilestone}
      />
    </div>
  );
}
