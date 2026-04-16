import { useState, useEffect, useRef } from "react";
import { ChevronDown, Filter, Plus, Search, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Client } from "@/types/client";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import * as ClientService from "@/services/leadClient";
import { Textarea } from "@/components/ui/textarea";
import { BulkImportTemplates } from "../leads/BulkImportTemplates";
import { getApiBaseUrl } from "@/lib/runtimeConfig";

export function ClientPipeline() {
  const [currentView, setCurrentView] = useState<'kanban' | 'list'>('kanban');
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const clientStages = [
    { id: 'active', name: 'Active', color: 'green' },
    { id: 'inactive', name: 'Inactive', color: 'red' },
    { id: 'onboarding', name: 'Onboarding', color: 'blue' },
    { id: 'churned', name: 'Churned', color: 'gray' },
  ] as const;

  useEffect(() => {
    fetchClients();
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/employees/`);
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive",
      });
    }
  };

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const data = await ClientService.getClients();
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Error",
        description: "Failed to fetch clients",
        variant: "destructive",
      });
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const clientData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      mobile_number: formData.get("mobile_number") as string || null,
      company_name: formData.get("company_name") as string || null,
      profession: formData.get("profession") as string || null,
      qualification: formData.get("qualification") as string || null,
      income: parseFloat(formData.get("income") as string) || null,
      date_of_investment: formData.get("date_of_investment") as string || null,
      investment_type: formData.get("investment_type") as string || null,
      reference_name: formData.get("reference_name") as string || null,
      reference_email: formData.get("reference_email") as string || null,
      reference_contact: formData.get("reference_contact") as string || null,
      relationship_manager: formData.get("relationship_manager") as string || null,
      interaction_type: formData.get("interaction_type") as string || null,
      status: "active" as const,
      notes: formData.get("notes") as string || null,
      assigned_to: parseInt(formData.get("assigned_to") as string) || null,
    };

    try {
      console.log('Creating client:', clientData);
      const response = await ClientService.createClient(clientData);
      console.log('Created client response:', response);
      if (response) {
        await fetchClients();
        setIsAddDialogOpen(false);
        toast({
          title: "Success",
          description: "Client added successfully",
        });
      }
    } catch (error: any) {
      console.error("Error adding client:", error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to add client",
        variant: "destructive",
      });
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await ClientService.downloadClientTemplate();
    } catch (error) {
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
      await ClientService.uploadClients(file);
      fetchClients();
      toast({
        title: "Success",
        description: "Clients imported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to import clients",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClient = async (id: string) => {
    try {
      await ClientService.deleteClient(id);
      fetchClients();
      toast({
        title: "Success",
        description: "Client deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive",
      });
    }
  };

  const filteredClients = clients?.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
        <CardTitle>Client Pipeline</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={currentView} onValueChange={(v) => setCurrentView(v as 'kanban' | 'list')}>
            <TabsList className="grid w-[180px] grid-cols-2">
              <TabsTrigger value="kanban">Kanban</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button size="sm" variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          
          <div className="flex gap-4">
            <BulkImportTemplates />
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Client
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <form onSubmit={handleAddClient}>
                  <DialogHeader>
                    <DialogTitle>Add New Client</DialogTitle>
                    <DialogDescription>
                      Add a new client to your pipeline.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input id="name" name="name" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input id="email" name="email" type="email" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="mobile_number">Mobile Number</Label>
                      <Input id="mobile_number" name="mobile_number" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="company_name">Company Name</Label>
                      <Input id="company_name" name="company_name" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="profession">Profession</Label>
                      <Input id="profession" name="profession" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="qualification">Qualification</Label>
                      <Input id="qualification" name="qualification" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="income">Income</Label>
                      <Input id="income" name="income" type="number" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="date_of_investment">Date of Investment</Label>
                      <Input id="date_of_investment" name="date_of_investment" type="date" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="investment_type">Investment Type</Label>
                      <Select name="investment_type">
                        <SelectTrigger>
                          <SelectValue placeholder="Select investment type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equity">Equity</SelectItem>
                          <SelectItem value="sip">SIP</SelectItem>
                          <SelectItem value="lumsum">Lump Sum</SelectItem>
                          <SelectItem value="insurance">Insurance</SelectItem>
                          <SelectItem value="PMS">PMS</SelectItem>
                          <SelectItem value="AID">AID</SelectItem>
                          <SelectItem value="others">Others</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="relationship_manager">Relationship Manager</Label>
                      <Input id="relationship_manager" name="relationship_manager" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="interaction_type">Interaction Type</Label>
                      <Select name="interaction_type">
                        <SelectTrigger>
                          <SelectValue placeholder="Select interaction type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="call">Call</SelectItem>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="status">Status</Label>
                      <Select name="status" defaultValue="active">
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="assigned_to">Assign To</Label>
                      <Select name="assigned_to">
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id.toString()}>
                              {employee.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 grid gap-2">
                      <Label htmlFor="reference_name">Reference Name</Label>
                      <Input id="reference_name" name="reference_name" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="reference_email">Reference Email</Label>
                      <Input id="reference_email" name="reference_email" type="email" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="reference_contact">Reference Contact</Label>
                      <Input id="reference_contact" name="reference_contact" />
                    </div>
                    <div className="col-span-2 grid gap-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea id="notes" name="notes" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Save</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Import/Export
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDownloadTemplate}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import from Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <TabsContent value="kanban" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {clientStages.map((stage) => {
              const stageClients = filteredClients.filter(client => client.status === stage.id);
              return (
                <div key={stage.id} className="flex flex-col h-full">
                  <div className={`flex items-center justify-between p-2 rounded-t-md bg-${stage.color}-100`}>
                    <h3 className="font-medium text-sm">{stage.name}</h3>
                    <Badge variant="outline">{stageClients.length}</Badge>
                  </div>
                  <div className="bg-muted/30 rounded-b-md p-2 flex-1 min-h-[300px]">
                    {stageClients.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No clients in this stage
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {stageClients.map((client) => (
                          <Card key={client.id} className="p-3">
                            <div className="font-medium">{client.name}</div>
                            <div className="text-sm text-muted-foreground">{client.email}</div>
                            <div className="mt-2 flex justify-end gap-2">
                              <Button size="sm" variant="outline">Edit</Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleDeleteClient(client.id.toString())}
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
        </TabsContent>
        
        <TabsContent value="list" className="mt-0">
          {filteredClients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No clients found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClients.map((client) => (
                <Card key={client.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{client.name}</div>
                      <div className="text-sm text-muted-foreground">{client.email}</div>
                      <div className="mt-1">
                        <Badge>{client.status}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Edit</Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDeleteClient(client.id.toString())}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </CardContent>
    </Card>
  );
} 