import { useState, useEffect, useRef } from "react";
import { ChevronDown, Filter, Plus, Search, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Lead, LeadStatus } from "@/types/lead";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/axios";
import { leadService } from "@/services/leadService";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

export function LeadPipeline() {
  const { isAuthenticated, user } = useAuth();
  const [currentView, setCurrentView] = useState<'kanban' | 'list'>('kanban');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const leadStages = [
    { id: LeadStatus.NEW, name: 'New', color: 'blue' },
    { id: LeadStatus.CONTACTED, name: 'Contacted', color: 'purple' },
    { id: LeadStatus.QUALIFIED, name: 'Qualified', color: 'yellow' },
    { id: LeadStatus.PROPOSAL, name: 'Proposal', color: 'orange' },
    { id: LeadStatus.NEGOTIATION, name: 'Negotiation', color: 'pink' },
    { id: LeadStatus.WON, name: 'Won', color: 'green' },
    { id: LeadStatus.LOST, name: 'Lost', color: 'red' },
  ] as const;

  useEffect(() => {
    if (isAuthenticated) {
      console.log('Fetching leads and employees...');
      fetchLeads();
      fetchEmployees();
    }
  }, [isAuthenticated]);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/api/employees/');
      console.log('Employee response:', response.data);
      
      const employeesData = Array.isArray(response.data) ? response.data : [];
      const transformedEmployees = employeesData.map(emp => ({
        id: emp.id,
        name: emp.name,
        email: emp.email,
        position: emp.position,
        department: emp.department
      }));
      
      setEmployees(transformedEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive",
      });
      setEmployees([]);
    }
  };

  const fetchLeads = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get('/api/leads/');
      const leadsData = Array.isArray(response.data) ? response.data : response.data.items || [];
      console.log('Raw leads data:', leadsData);
      
      // Transform leads data to ensure all required fields
      const formattedLeads = leadsData.map(lead => ({
        id: lead.id,
        name: lead.name || '',
        company: lead.company || '',
        email: lead.email || '',
        phone: lead.phone || '',
        source: lead.source || '',
        status: lead.status || LeadStatus.NEW,
        notes: lead.notes || '',
        expected_value: lead.expected_value || 0,
        assigned_to: lead.assigned_to || null,
        client_id: lead.client_id || null,
        created_at: lead.created_at || null,
        updated_at: lead.updated_at || null,
        assigned_employee: lead.assigned_employee || null,
        client: lead.client || null
      }));
      
      console.log('Formatted leads:', formattedLeads);
      setLeads(formattedLeads);
    } catch (error: any) {
      console.error('Error fetching leads:', error);
      setError(error.message || "Failed to fetch leads");
      toast({
        title: "Error",
        description: error.message || "Failed to fetch leads",
        variant: "destructive",
      });
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLead = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    try {
      const leadData = {
        name: formData.get('name') as string,
        company_name: formData.get('company_name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string || undefined,
        source: formData.get('source') as string || undefined,
        status: LeadStatus.NEW,
        notes: formData.get('notes') as string || undefined,
        assigned_to: parseInt(formData.get('assignedTo') as string) || null
      };

      console.log('Creating lead:', leadData);
      const response = await leadService.createLead(leadData);
      console.log('Created lead response:', response);
      
      // Update leads state with the new lead
      setLeads(prevLeads => [...prevLeads, response]);
      
      setIsAddDialogOpen(false);
      toast({
        title: "Success",
        description: "Lead created successfully",
      });
    } catch (error: any) {
      console.error('Error creating lead:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create lead",
        variant: "destructive",
      });
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await api.get('/api/leads/template', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'leads_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading template:', error);
      toast({
        title: "Error",
        description: "Failed to download template",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('Uploading file:', file.name, 'Type:', file.type);
      
      const response = await api.post('/api/leads/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000
      });
      
      console.log('Upload response:', response.data);
      
      // Refresh leads list after successful upload
      await fetchLeads();
      
      toast({
        title: "Success",
        description: response.data.message || `Successfully imported ${response.data?.message || 'leads'}`,
      });
    } catch (error: any) {
      console.error('Error uploading leads:', error);
      let desc = error.response?.data?.detail || "Failed to import leads";
      if (typeof desc !== 'string') {
        desc = JSON.stringify(desc); // Ensure it's a string
      }
      toast({
        title: "Error",
        description: desc,
        variant: "destructive",
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteLead = async (id: number | string) => {
    try {
      await api.delete(`/api/leads/${id}/`);
      setLeads(prevLeads => prevLeads.filter(lead => lead.id.toString() !== id.toString()));
      toast({
        title: "Success",
        description: "Lead deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting lead:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete lead",
        variant: "destructive",
      });
    }
  };

  const filteredLeads = leads?.filter(lead => 
    lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const renderKanbanView = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {leadStages.map((stage) => {
          const stageLeads = leads.filter(lead => lead.status === stage.id);
          console.log(`Leads in ${stage.name} stage:`, stageLeads);
          return (
            <div key={stage.id} className="flex flex-col h-full">
              <div className={`flex items-center justify-between p-2 rounded-t-md bg-${stage.color}-100`}>
                <h3 className="font-medium text-sm">{stage.name}</h3>
                <Badge variant="outline">{stageLeads.length}</Badge>
              </div>
              <div className="bg-muted/30 rounded-b-md p-2 flex-1 min-h-[300px]">
                {stageLeads.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No leads in this stage
                  </div>
                ) : (
                  <div className="space-y-2">
                    {stageLeads.map((lead) => (
                      <Card key={lead.id} className="p-3">
                        <div className="font-medium">{lead.name}</div>
                        <div className="text-sm text-muted-foreground">{lead.company}</div>
                        <div className="text-sm text-muted-foreground">{lead.email}</div>
                        <div className="mt-2 flex justify-end gap-2">
                          <Button size="sm" variant="outline">Edit</Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDeleteLead(lead.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderLeads = () => {
    if (leads.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No leads found. Add some leads to get started.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {leads.map((lead) => (
          <Card key={lead.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{lead.name}</div>
                <div className="text-sm text-muted-foreground">{lead.company}</div>
                <div className="text-sm text-muted-foreground">{lead.email}</div>
                <div className="mt-1">
                  <Badge>{lead.status}</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">Edit</Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => handleDeleteLead(lead.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return <div>Loading leads...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
        <CardTitle>Lead Pipeline</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={currentView} onValueChange={(v) => setCurrentView(v as 'kanban' | 'list')}>
            <TabsList className="grid w-[180px] grid-cols-2">
              <TabsTrigger value="kanban">Kanban</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button size="sm" variant="outline" onClick={downloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Download Template
          </Button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Import Leads
          </Button>
          
          <Button size="sm" variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Lead</DialogTitle>
                <DialogDescription>
                  Fill in the details to create a new lead. All fields marked with * are required.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddLead} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input id="name" name="name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company *</Label>
                    <Input id="company_name" name="company_name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" name="email" type="email" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="source">Source</Label>
                    <Input id="source" name="source" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assignedTo">Assign To</Label>
                    <Select name="assignedTo">
                      <SelectTrigger>
                        <SelectValue placeholder="Select an employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem 
                            key={employee.id} 
                            value={employee.id.toString()}
                          >
                            {employee.name} - {employee.position}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Input id="notes" name="notes" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <TabsContent value="kanban" className="mt-0">
          {isLoading ? (
            <div>Loading leads...</div>
          ) : leads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No leads found
            </div>
          ) : (
            renderKanbanView()
          )}
        </TabsContent>
        
        <TabsContent value="list" className="mt-0">
          {isLoading ? (
            <div>Loading leads...</div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No leads found
            </div>
          ) : (
            renderLeads()
          )}
        </TabsContent>
      </CardContent>
    </Card>
  );
}
