import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/axios";
import { Pencil, Trash, Upload, Download, ChevronDown } from "lucide-react";

interface Lead {
  id: number;
  name: string;
  email: string;
  mobile_number: string | null;
  lead_employer_company_name: string | null;
  profession: string | null;
  qualification: string | null;
  income: number | null;
  date_of_investment: string | null;
  investment_type: string | null;
  reference_name: string | null;
  reference_email: string | null;
  reference_contact: string | null;
  relationship_manager: string | null;
  interaction_type: string | null;
  source: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  notes: string | null;
  expected_value: number | null;
  assigned_to: number | null;
  client_id: number | null;
  managing_company_name: string;
  created_at: string;
  updated_at: string;
}

interface Employee {
  id: number;
  name: string;
  email: string;
  position: string;
  department: string;
}

export function LeadPipeline() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);

  // Helper function to extract a user-friendly error message from an Axios error object
  const getErrorMessage = (error: any, defaultMessage: string = "An unexpected error occurred") => {
    if (!error.response) {
      return defaultMessage;
    }

    const { data } = error.response;

    // Case 1: FastAPI validation errors (detail is an array of objects)
    if (Array.isArray(data?.detail)) {
      return data.detail.map((err: any) => err.msg).join("; ");
    }
    // Case 2: Standard FastAPI HTTPException (detail is a string)
    if (typeof data?.detail === 'string') {
      return data.detail;
    }
    // Case 3: Custom errors where detail is an object with a 'message' property
    if (data?.detail && typeof data.detail === 'object' && data.detail.message) {
      return data.detail.message;
    }
    // Case 4: Custom errors where top-level 'message' exists
    if (data?.message) {
      return data.message;
    }
    // Fallback: stringify the entire error response data if it's an object, otherwise use default
    return typeof data === 'object' ? JSON.stringify(data) : defaultMessage;
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/leads/");
      console.log("Raw API response:", response); // Debug log
      console.log("Response data:", response.data); // Debug log
      
      // Support both array and { items: [...] } formats
      let leadsData = [];
      if (Array.isArray(response.data)) {
        leadsData = response.data;
      } else if (response.data && Array.isArray(response.data.items)) {
        leadsData = response.data.items;
      }
      
      // Validate and transform the data
      if (Array.isArray(leadsData)) {
        const validLeads = leadsData.map(lead => ({
          ...lead,
          status: lead.status || 'new', // Provide default status if missing
          lead_employer_company_name: lead.company,
          managing_company_name: lead.managing_company_name,
          mobile_number: lead.mobile_number || null,
          source: lead.source || null,
          notes: lead.notes || null,
          expected_value: lead.expected_value || null,
          assigned_to: lead.assigned_to || null,
          client_id: lead.client_id || null
        }));
        setLeads(validLeads);
      } else {
        console.error("Invalid leads data format:", leadsData);
        setLeads([]); // Set empty array as fallback
        toast({
          title: "Warning",
          description: "Received invalid data format from server",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error fetching leads:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setLeads([]); // Set empty array on error
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get("/api/employees/");
      console.log("Employees response:", response.data);
      
      const employeesData = response.data || [];
      if (Array.isArray(employeesData)) {
        setEmployees(employeesData);
      } else {
        console.error("Invalid employees data format:", employeesData);
        setEmployees([]);
      }
    } catch (error: any) {
      console.error("Error fetching employees:", error);
      setEmployees([]);
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchEmployees();
  }, []);

  const handleAddLead = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const leadData = {
      name: formData.get("name"),
      email: formData.get("email"),
      mobile_number: formData.get("mobile_number") || null,
      lead_employer_company_name: formData.get("company_name") || null,
      profession: formData.get("profession") || null,
      qualification: formData.get("qualification") || null,
      income: parseFloat(formData.get("income") as string) || null,
      date_of_investment: formData.get("date_of_investment") || null,
      investment_type: formData.get("investment_type") || null,
      reference_name: formData.get("reference_name") || null,
      reference_email: formData.get("reference_email") || null,
      reference_contact: formData.get("reference_contact") || null,
      relationship_manager: formData.get("relationship_manager") || null,
      interaction_type: formData.get("interaction_type") || null,
      source: formData.get("source") || null,
      status: "new",
      notes: formData.get("notes") || null,
      expected_value: parseFloat(formData.get("expected_value") as string) || null,
      assigned_to: parseInt(formData.get("assigned_to") as string) || null,
      client_id: parseInt(formData.get("client_id") as string) || null,
    };

    try {
      console.log('Creating lead:', leadData);
      const response = await api.post("/api/leads/", leadData);
      console.log('Created lead response:', response.data);
      if (response.data) {
        await fetchLeads();
        setIsAddLeadOpen(false);
        toast({
          title: "Success",
          description: "Lead added successfully",
        });
      }
    } catch (error: any) {
      console.error("Error adding lead:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleUpdateLeadStatus = async (leadId: number, newStatus: Lead['status']) => {
    try {
      const response = await api.put(`/api/leads/${leadId}`, { status: newStatus.toLowerCase() });
      if (response.data) {
        await fetchLeads();
        toast({
          title: "Success",
          description: "Lead status updated successfully",
        });
      }
    } catch (error: any) {
      console.error("Error updating lead status:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleEditLead = (lead: Lead) => {
    setEditLead(lead);
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const leadData = {
      name: formData.get("name"),
      email: formData.get("email"),
      mobile_number: formData.get("mobile_number") || null,
      lead_employer_company_name: formData.get("company_name") || null,
      profession: formData.get("profession") || null,
      qualification: formData.get("qualification") || null,
      income: parseFloat(formData.get("income") as string) || null,
      date_of_investment: formData.get("date_of_investment") || null,
      investment_type: formData.get("investment_type") || null,
      reference_name: formData.get("reference_name") || null,
      reference_email: formData.get("reference_email") || null,
      reference_contact: formData.get("reference_contact") || null,
      relationship_manager: formData.get("relationship_manager") || null,
      interaction_type: formData.get("interaction_type") || null,
      source: formData.get("source") || null,
      status: (formData.get("status") as Lead['status']) || "new",
      notes: formData.get("notes") || null,
      expected_value: parseFloat(formData.get("expected_value") as string) || null,
      assigned_to: parseInt(formData.get("assigned_to") as string) || null,
      client_id: parseInt(formData.get("client_id") as string) || null,
    };

    try {
      console.log('Updating lead:', leadData);
      const response = await api.put(`/api/leads/${editLead?.id}`, leadData);
      console.log('Updated lead response:', response.data);
      if (response.data) {
        await fetchLeads();
      setIsEditDialogOpen(false);
        toast({
          title: "Success",
          description: "Lead updated successfully",
        });
      }
    } catch (error: any) {
      console.error("Error updating lead:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleDeleteLead = async (leadId: number) => {
    if (!window.confirm("Are you sure you want to delete this lead?")) return;
    try {
      await api.delete(`/api/leads/${leadId}`);
      await fetchLeads();
      toast({ title: "Success", description: "Lead deleted successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: getErrorMessage(error), variant: "destructive" });
    }
  };

  const handleStageChange = async (lead: Lead, newStatus: Lead['status']) => {
    if (lead.status === newStatus) return;
    await handleUpdateLeadStatus(lead.id, newStatus);
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get("/api/leads/template", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "leads_template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast({ title: "Error", description: "Failed to download template", variant: "destructive" });
    }
  };

  const handleImportLeads = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!importFile) return;
    setImportLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      await api.post("/api/leads/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setIsImportDialogOpen(false);
      setImportFile(null);
      await fetchLeads();
      toast({ title: "Success", description: "Leads imported successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setImportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Lead Pipeline</h2>
        <div className="flex gap-4">
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Import Leads
              </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                <DialogTitle>Import Leads from Excel</DialogTitle>
                <DialogDescription>
                  Upload an Excel file (.xlsx, .xls) or CSV file (.csv) to import leads.
                </DialogDescription>
                </DialogHeader>
              <form onSubmit={handleImportLeads} className="grid gap-4 py-4">
                <Input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setImportFile(e.target.files ? e.target.files[0] : null)} />
                <Button type="submit" disabled={!importFile || importLoading}>
                  {importLoading ? "Importing..." : "Upload & Import"}
                </Button>
              </form>
              <DialogFooter>
                <Button variant="outline" onClick={handleDownloadTemplate} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download Lead Template
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
          <DialogTrigger asChild>
            <Button>Add Lead</Button>
          </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-[80vh]">
            <form onSubmit={handleAddLead}>
              <DialogHeader>
                <DialogTitle>Add New Lead</DialogTitle>
                <DialogDescription>
                  Add a new lead to your pipeline.
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
                  <Label htmlFor="source">Source</Label>
                  <Input id="source" name="source" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expected_value">Expected Value</Label>
                  <Input id="expected_value" name="expected_value" type="number" />
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
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[ "new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"].map((status) => (
          <Card key={status}>
            <CardHeader>
              <CardTitle className="capitalize">{status}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {leads
                  .filter((lead) => lead.status === status)
                  .map((lead) => (
                    <div
                      key={lead.id}
                      className="p-3 bg-white rounded-lg shadow border relative"
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div>
                      <h3 className="font-medium">{lead.name}</h3>
                            <div className="text-sm text-muted-foreground">
                              {lead.email}
                              {lead.lead_employer_company_name && <div>{lead.lead_employer_company_name}</div>}
                              {lead.mobile_number && <div>{lead.mobile_number}</div>}
                            </div>
                          </div>
                        <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditLead(lead)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteLead(lead.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      {lead.expected_value && (
                        <p className="text-sm font-medium">₹{lead.expected_value.toLocaleString()}</p>
                      )}
                        {lead.notes && (
                          <p className="text-sm text-muted-foreground">{lead.notes}</p>
                        )}
                      </div>
                      <div className="mt-2">
                        <Label>Status</Label>
                        <Select value={lead.status} onValueChange={val => handleStageChange(lead, val as Lead['status'])}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"].map(s => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl">
            <form onSubmit={handleEditSubmit}>
              <DialogHeader>
                <DialogTitle>Edit Lead</DialogTitle>
              <DialogDescription>
                Update the lead's information.
              </DialogDescription>
              </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={editLead?.name}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  defaultValue={editLead?.email}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-mobile_number">Mobile Number</Label>
                <Input
                  id="edit-mobile_number"
                  name="mobile_number"
                  defaultValue={editLead?.mobile_number || ""}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-company_name">Company Name</Label>
                <Input
                  id="edit-company_name"
                  name="company_name"
                  defaultValue={editLead?.lead_employer_company_name || ""}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-profession">Profession</Label>
                <Input
                  id="edit-profession"
                  name="profession"
                  defaultValue={editLead?.profession || ""}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-qualification">Qualification</Label>
                <Input
                  id="edit-qualification"
                  name="qualification"
                  defaultValue={editLead?.qualification || ""}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-income">Income</Label>
                <Input
                  id="edit-income"
                  name="income"
                  type="number"
                  defaultValue={editLead?.income || ""}
                />
              </div>
                <div className="grid gap-2">
                <Label htmlFor="edit-date_of_investment">Date of Investment</Label>
                <Input
                  id="edit-date_of_investment"
                  name="date_of_investment"
                  type="date"
                  defaultValue={editLead?.date_of_investment || ""}
                />
                </div>
                <div className="grid gap-2">
                <Label htmlFor="edit-investment_type">Investment Type</Label>
                <Select name="investment_type" defaultValue={editLead?.investment_type || ""}>
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
                <Label htmlFor="edit-relationship_manager">Relationship Manager</Label>
                <Input
                  id="edit-relationship_manager"
                  name="relationship_manager"
                  defaultValue={editLead?.relationship_manager || ""}
                />
                </div>
                <div className="grid gap-2">
                <Label htmlFor="edit-interaction_type">Interaction Type</Label>
                <Select name="interaction_type" defaultValue={editLead?.interaction_type || ""}>
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
                <Label htmlFor="edit-source">Source</Label>
                <Input
                  id="edit-source"
                  name="source"
                  defaultValue={editLead?.source || ""}
                />
                </div>
                <div className="grid gap-2">
                <Label htmlFor="edit-expected_value">Expected Value</Label>
                <Input
                  id="edit-expected_value"
                  name="expected_value"
                  type="number"
                  defaultValue={editLead?.expected_value || ""}
                />
                </div>
                <div className="grid gap-2">
                <Label htmlFor="edit-assigned_to">Assign To</Label>
                <Select name="assigned_to" defaultValue={editLead?.assigned_to?.toString() || ""}>
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
                <Label htmlFor="edit-reference_name">Reference Name</Label>
                <Input
                  id="edit-reference_name"
                  name="reference_name"
                  defaultValue={editLead?.reference_name || ""}
                />
                </div>
                <div className="grid gap-2">
                <Label htmlFor="edit-reference_email">Reference Email</Label>
                <Input
                  id="edit-reference_email"
                  name="reference_email"
                  type="email"
                  defaultValue={editLead?.reference_email || ""}
                />
                </div>
                <div className="grid gap-2">
                <Label htmlFor="edit-reference_contact">Reference Contact</Label>
                <Input
                  id="edit-reference_contact"
                  name="reference_contact"
                  defaultValue={editLead?.reference_contact || ""}
                />
              </div>
              <div className="col-span-2 grid gap-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  name="notes"
                  defaultValue={editLead?.notes || ""}
                />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 