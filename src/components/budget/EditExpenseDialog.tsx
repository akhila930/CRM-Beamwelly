import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogClose, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface Expense {
  id: number;
  type: string;
  amount: number;
  department: string;
  date: string;
  description: string;
  receipt_url?: string;
}

interface EditExpenseDialogProps {
  expense: Expense;
  departments: string[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: number, data: FormData) => Promise<void>;
}

export function EditExpenseDialog({ expense, departments, isOpen, onClose, onSave }: EditExpenseDialogProps) {
  const [formData, setFormData] = useState({
    type: expense.type,
    amount: expense.amount,
    department: expense.department,
    date: expense.date,
    description: expense.description
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitData = new FormData();
    submitData.append('type', formData.type);
    submitData.append('amount', String(formData.amount));
    submitData.append('department', formData.department);
    submitData.append('date', formData.date);
    submitData.append('description', formData.description);
    if (selectedFile) {
      submitData.append('receipt', selectedFile);
    }
    await onSave(expense.id, submitData);
    onClose();
  };

  const handleChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>
              Update the expense details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Expense Type</Label>
              <Input
                id="type"
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                placeholder="Office Supplies"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => handleChange('amount', parseFloat(e.target.value))}
                placeholder="100"
                required
                min="0"
                step="0.01"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={formData.department}
                onValueChange={(value) => handleChange('department', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Brief description of the expense"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="receipt">Receipt (PDF only)</Label>
              {expense.receipt_url && (
                <div className="text-xs text-muted-foreground mb-1">
                  Current receipt: <span className="font-semibold">{expense.receipt_url.split('/').pop()}</span>
                </div>
              )}
              <Input 
                id="receipt" 
                type="file" 
                onChange={handleFileChange} 
                accept=".pdf"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}