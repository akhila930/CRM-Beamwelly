import { useState, useEffect, useRef } from "react";
import { Search, Plus, Filter, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Client, ClientService } from "@/types/client";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { employeeService } from '@/services/employeeService';
import { Employee } from '@/types/employee';

export function ClientList() {
  const { isAuthenticated } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isAddServiceDialogOpen, setIsAddServiceDialogOpen] = useState(false);
  const [selectedClientForService, setSelectedClientForService] = useState<Client | null>(null);
  const [isAddInteractionDialogOpen, setIsAddInteractionDialogOpen] = useState(false);
  const [isAddDocumentDialogOpen, setIsAddDocumentDialogOpen] = useState(false);
  const [selectedServiceForInteraction, setSelectedServiceForInteraction] = useState<any>(null);
  const [selectedServiceForDocument, setSelectedServiceForDocument] = useState<any>(null);
  const [expandedServiceId, setExpandedServiceId] = useState<number | null>(null);
  const [serviceInteractions, setServiceInteractions] = useState<{ [key: number]: any[] }>({});
  const [serviceDocuments, setServiceDocuments] = useState<{ [key: number]: any[] }>({});
  const [isEditServiceDialogOpen, setIsEditServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [isDeleteServiceDialogOpen, setIsDeleteServiceDialogOpen] = useState(false);
  const [deletingService, setDeletingService] = useState<any>(null);
  const [isEditInteractionDialogOpen, setIsEditInteractionDialogOpen] = useState(false);
  const [editingInteraction, setEditingInteraction] = useState<any>(null);
  const [editingInteractionService, setEditingInteractionService] = useState<any>(null);
  const [isDeleteInteractionDialogOpen, setIsDeleteInteractionDialogOpen] = useState(false);
  const [deletingInteraction, setDeletingInteraction] = useState<any>(null);
  const [deletingInteractionService, setDeletingInteractionService] = useState<any>(null);
  const [isDeleteDocumentDialogOpen, setIsDeleteDocumentDialogOpen] = useState(false);
  const [deletingDocument, setDeletingDocument] = useState<any>(null);
  const [deletingDocumentService, setDeletingDocumentService] = useState<any>(null);

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

  useEffect(() => {
    if (isAuthenticated) {
      fetchClients();
      fetchEmployees();
    }
  }, [isAuthenticated]);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/clients');
      const clientsWithServices = await Promise.all(
        response.data.map(async (client: Client) => {
          try {
            const servicesRes = await api.get(`/api/clients/${client.id}/services`);
            return { 
                ...client, 
                services: servicesRes.data as ClientService[],
                client_employer_company_name: client.client_employer_company_name || null,
                managing_company_name: client.managing_company_name
            };
          } catch (e) {
            return { 
                ...client, 
                services: [],
                client_employer_company_name: client.client_employer_company_name || null,
                managing_company_name: client.managing_company_name
            };
          }
        })
      );
      setClients(clientsWithServices);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Error",
        description: "Failed to fetch clients",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const data = await employeeService.getAllEmployees();
      setEmployees(data as Employee[]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch employees',
        variant: 'destructive',
      });
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await api.get('/api/clients/template', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'clients_template.xlsx');
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

  const downloadReport = async () => {
    try {
      const response = await api.get('/api/clients/report', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'client_report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        title: "Error",
        description: "Failed to download report",
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
      
      const response = await api.post('/api/clients/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      await fetchClients();
      
      toast({
        title: "Success",
        description: `Successfully imported ${response.data?.message || 'clients'}`,
      });
    } catch (error: any) {
      console.error('Error uploading clients:', error);
      let desc = error.response?.data?.detail || "Failed to import clients";
      if (typeof desc !== 'string') desc = JSON.stringify(desc);
      toast({
        title: "Error",
        description: desc,
        variant: "destructive",
      });
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteClient = async (id: string) => {
    try {
      await api.delete(`/api/clients/${id}`);
      await fetchClients();
      toast({
        title: "Success",
        description: "Client deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive",
      });
    }
  };

  const handleAddClient = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    try {
      const clientData = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        mobile_number: formData.get('mobile_number') as string || undefined,
        client_employer_company_name: formData.get('company_name') as string || undefined,
        profession: formData.get('profession') as string || undefined,
        qualification: formData.get('qualification') as string || undefined,
        income: formData.get('income') ? parseFloat(formData.get('income') as string) : undefined,
        date_of_investment: formData.get('date_of_investment') as string || undefined,
        investment_type: formData.get('investment_type') as string || undefined,
        reference_name: formData.get('reference_name') as string || undefined,
        reference_email: formData.get('reference_email') as string || undefined,
        reference_contact: formData.get('reference_contact') as string || undefined,
        relationship_manager: formData.get('relationship_manager') as string || undefined,
        interaction_type: formData.get('interaction_type') as string || undefined,
        phone: formData.get('phone') as string || undefined,
        address: formData.get('address') as string || undefined,
        status: 'active',
        notes: formData.get('notes') as string || undefined,
        assigned_to: formData.get('assigned_to') === 'none' ? undefined : (formData.get('assigned_to') ? parseInt(formData.get('assigned_to') as string) : undefined),
      };

      // Validate required fields
      if (!clientData.name || !clientData.email) {
        toast({
          title: "Error",
          description: "Name and email are required fields",
          variant: "destructive",
        });
        return;
      }

      const response = await api.post('/api/clients', clientData);
      
      setIsAddDialogOpen(false);
      await fetchClients();
      
      toast({
        title: "Success",
        description: "Client created successfully",
      });
    } catch (error: any) {
      console.error('Error creating client:', error);
      const errorMessage = getErrorMessage(error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setIsEditDialogOpen(true);
  };

  const handleUpdateClient = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingClient) return;
    const formData = new FormData(event.currentTarget);
    try {
      const clientData = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string || undefined,
        address: formData.get('address') as string || undefined,
        mobile_number: formData.get('mobile_number') as string || undefined,
        client_employer_company_name: formData.get('company_name') as string || undefined,
        profession: formData.get('profession') as string || undefined,
        qualification: formData.get('qualification') as string || undefined,
        income: formData.get('income') ? parseFloat(formData.get('income') as string) : undefined,
        date_of_investment: formData.get('date_of_investment') as string || undefined,
        investment_type: formData.get('investment_type') as string || undefined,
        reference_name: formData.get('reference_name') as string || undefined,
        reference_email: formData.get('reference_email') as string || undefined,
        reference_contact: formData.get('reference_contact') as string || undefined,
        relationship_manager: formData.get('relationship_manager') as string || undefined,
        interaction_type: formData.get('interaction_type') as string || undefined,
        status: 'active',
        notes: formData.get('notes') as string || undefined,
        assigned_to: formData.get('assigned_to') === 'none' ? undefined : (formData.get('assigned_to') ? parseInt(formData.get('assigned_to') as string) : undefined),
      };
      await api.put(`/api/clients/${editingClient.id}`, clientData);
      setIsEditDialogOpen(false);
      setEditingClient(null);
      await fetchClients();
      toast({
        title: 'Success',
        description: 'Client updated successfully',
      });
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleAddService = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedClientForService) return;
    const formData = new FormData(event.currentTarget);
    const serviceData = {
      name: formData.get('service_name') as string,
      description: formData.get('service_description') as string,
      stage: formData.get('service_stage') as string,
    };
    try {
      const response = await api.post(`/api/clients/${selectedClientForService.id}/services`, serviceData);
      await fetchClients();
      setIsAddServiceDialogOpen(false);
      setSelectedClientForService(null);
      toast({
        title: 'Success',
        description: 'Service added successfully',
      });
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleAddInteraction = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedServiceForInteraction) return;
    const formData = new FormData(event.currentTarget);
    const interactionData = {
      details: formData.get('interaction_details') as string,
    };
    try {
      await api.post(`/api/clients/${selectedServiceForInteraction.clientId}/services/${selectedServiceForInteraction.id}/interactions`, interactionData);
      await fetchServiceDetails(selectedServiceForInteraction.clientId, selectedServiceForInteraction.id);
      setIsAddInteractionDialogOpen(false);
      setSelectedServiceForInteraction(null);
      toast({ title: 'Success', description: 'Interaction added successfully' });
    }  catch (error: any) {
      const errorMessage = getErrorMessage(error);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    }
  };

  const handleAddDocument = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedServiceForDocument) return;
    const formData = new FormData(event.currentTarget);
    const documentData = {
      name: formData.get('document_name') as string,
      file: formData.get('document_file') as File,
    };
    try {
      await api.post(`/api/clients/${selectedServiceForDocument.clientId}/services/${selectedServiceForDocument.id}/documents`, documentData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchServiceDetails(selectedServiceForDocument.clientId, selectedServiceForDocument.id);
      setIsAddDocumentDialogOpen(false);
      setSelectedServiceForDocument(null);
      toast({ title: 'Success', description: 'Document added successfully' });
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    }
  };

  const fetchServiceDetails = async (clientId: number, serviceId: number) => {
    try {
      const [interactionsRes, documentsRes] = await Promise.all([
        api.get(`/api/clients/${clientId}/services/${serviceId}/interactions`),
        api.get(`/api/clients/${clientId}/services/${serviceId}/documents`),
      ]);
      setServiceInteractions((prev) => ({ ...prev, [serviceId]: interactionsRes.data }));
      setServiceDocuments((prev) => ({ ...prev, [serviceId]: documentsRes.data }));
    } catch (e) {
      setServiceInteractions((prev) => ({ ...prev, [serviceId]: [] }));
      setServiceDocuments((prev) => ({ ...prev, [serviceId]: [] }));
    }
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  console.log('Employees for Select:', employees);
  const validEmployees = employees.filter(emp => emp.id !== undefined && emp.id !== null);
  if (employees.length !== validEmployees.length) {
    console.warn('Some employees have invalid ids and will be excluded from the Select:', employees.filter(emp => emp.id === undefined || emp.id === null));
  }

  // Defensive: log any employees with invalid ids
  useEffect(() => {
    const invalidEmployees = employees.filter(emp => emp.id === undefined || emp.id === null);
    if (invalidEmployees.length > 0) {
      console.warn('Invalid employees detected:', invalidEmployees);
    }
  }, [employees]);

  useEffect(() => {
    if (isAddDialogOpen) {
      setSelectedEmployee('');
    }
  }, [isAddDialogOpen]);

  // Edit service handler
  const handleEditService = (service: any) => {
    setEditingService(service);
    setIsEditServiceDialogOpen(true);
  };

  const handleUpdateService = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingService) return;
    const formData = new FormData(event.currentTarget);
    const serviceData = {
      name: formData.get('service_name') as string,
      description: formData.get('service_description') as string,
      stage: formData.get('service_stage') as string,
    };
    try {
      await api.put(`/api/clients/${editingService.client_id}/services/${editingService.id}`, serviceData);
      setIsEditServiceDialogOpen(false);
      setEditingService(null);
      await fetchClients();
      toast({ title: 'Success', description: 'Service updated successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to update service', variant: 'destructive' });
    }
  };

  // Delete service handler
  const handleDeleteService = (service: any) => {
    setDeletingService(service);
    setIsDeleteServiceDialogOpen(true);
  };

  const confirmDeleteService = async () => {
    if (!deletingService) return;
    try {
      await api.delete(`/api/clients/${deletingService.client_id}/services/${deletingService.id}`);
      setIsDeleteServiceDialogOpen(false);
      setDeletingService(null);
      await fetchClients();
      toast({ title: 'Success', description: 'Service deleted successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to delete service', variant: 'destructive' });
    }
  };

  const handleEditInteraction = (service: any, interaction: any) => {
    setEditingInteraction(interaction);
    setEditingInteractionService(service);
    setIsEditInteractionDialogOpen(true);
  };

  const handleUpdateInteraction = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingInteraction || !editingInteractionService) return;
    const formData = new FormData(event.currentTarget);
    const interactionData = {
      details: formData.get('interaction_details') as string,
    };
    try {
      await api.put(`/api/clients/${editingInteractionService.client_id}/services/${editingInteractionService.id}/interactions/${editingInteraction.id}`, interactionData);
      setIsEditInteractionDialogOpen(false);
      setEditingInteraction(null);
      setEditingInteractionService(null);
      await fetchServiceDetails(editingInteractionService.client_id, editingInteractionService.id);
      toast({ title: 'Success', description: 'Interaction updated successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to update interaction', variant: 'destructive' });
    }
  };

  const handleDeleteInteraction = (service: any, interaction: any) => {
    setDeletingInteraction(interaction);
    setDeletingInteractionService(service);
    setIsDeleteInteractionDialogOpen(true);
  };

  const confirmDeleteInteraction = async () => {
    if (!deletingInteraction || !deletingInteractionService) return;
    try {
      await api.delete(`/api/clients/${deletingInteractionService.client_id}/services/${deletingInteractionService.id}/interactions/${deletingInteraction.id}`);
      setIsDeleteInteractionDialogOpen(false);
      setDeletingInteraction(null);
      setDeletingInteractionService(null);
      await fetchServiceDetails(deletingInteractionService.client_id, deletingInteractionService.id);
      toast({ title: 'Success', description: 'Interaction deleted successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to delete interaction', variant: 'destructive' });
    }
  };

  const handleDeleteDocument = (service: any, doc: any) => {
    setDeletingDocument(doc);
    setDeletingDocumentService(service);
    setIsDeleteDocumentDialogOpen(true);
  };

  const confirmDeleteDocument = async () => {
    if (!deletingDocument || !deletingDocumentService) return;
    try {
      await api.delete(`/api/clients/${deletingDocumentService.client_id}/services/${deletingDocumentService.id}/documents/${deletingDocument.id}`);
      setIsDeleteDocumentDialogOpen(false);
      setDeletingDocument(null);
      setDeletingDocumentService(null);
      await fetchServiceDetails(deletingDocumentService.client_id, deletingDocumentService.id);
      toast({ title: 'Success', description: 'Document deleted successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to delete document', variant: 'destructive' });
    }
  };

  const handleDownloadReport = async (clientId: number) => {
    try {
      const response = await api.get(`/api/clients/${clientId}/report/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `client_report_${clientId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast({ title: 'Success', description: 'Report downloaded' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to download report', variant: 'destructive' });
    }
  };

  const handleDownloadDocument = async (clientId: number, serviceId: number, documentId: number) => {
    try {
      const response = await api.get(`/api/clients/${Number(clientId)}/services/${Number(serviceId)}/documents/${Number(documentId)}/download`, {
        responseType: 'blob'
      });
      
      // Get the filename from the Content-Disposition header if available
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'document';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: response.headers['content-type'] }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: 'Success', description: 'Document downloaded' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to download document', variant: 'destructive' });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
        <CardTitle>Client Management</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={downloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Download Template
          </Button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx"
            className="hidden"
          />
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Import Clients
          </Button>
          
          <Button size="sm" variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
                <DialogDescription>Fill in the details to add a new client.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddClient} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input id="name" name="name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" name="email" type="email" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobile_number">Mobile Number</Label>
                    <Input id="mobile_number" name="mobile_number" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name</Label>
                    <Input id="company_name" name="company_name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profession">Profession</Label>
                    <Input id="profession" name="profession" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="qualification">Qualification</Label>
                    <Input id="qualification" name="qualification" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="income">Income</Label>
                    <Input id="income" name="income" type="number" step="0.01" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date_of_investment">Date of Investment</Label>
                    <Input id="date_of_investment" name="date_of_investment" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="investment_type">Investment Type</Label>
                    <Select name="investment_type" defaultValue="">
                      <SelectTrigger>
                        <SelectValue placeholder="Select investment type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equity">Equity</SelectItem>
                        <SelectItem value="sip">SIP</SelectItem>
                        <SelectItem value="lumsum">Lumsum</SelectItem>
                        <SelectItem value="insurance">Insurance</SelectItem>
                        <SelectItem value="pms">PMS</SelectItem>
                        <SelectItem value="aid">AID</SelectItem>
                        <SelectItem value="others">Others</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reference_name">Reference Name</Label>
                    <Input id="reference_name" name="reference_name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reference_email">Reference Email</Label>
                    <Input id="reference_email" name="reference_email" type="email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reference_contact">Reference Contact</Label>
                    <Input id="reference_contact" name="reference_contact" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="relationship_manager">Relationship Manager</Label>
                    <Input id="relationship_manager" name="relationship_manager" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interaction_type">Interaction Type</Label>
                    <Select name="interaction_type" defaultValue="">
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
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" name="address" />
                  </div>
                  
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="assigned_to">Assigned To</Label>
                    {validEmployees.length === 0 ? (
                      <Select disabled defaultValue="">
                        <SelectTrigger>
                          <SelectValue placeholder="No employees available" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No employees available</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Select
                        name="assigned_to"
                        defaultValue=""
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {validEmployees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id.toString()}>{emp.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
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
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => [
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="font-medium">{client.name}</div>
                    <div className="text-sm text-muted-foreground">{client.email}</div>
                  </TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{client.phone}</TableCell>
                  <TableCell>{client.status}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" className="ml-2" onClick={() => handleEditClient(client)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" className="ml-2" onClick={() => handleDeleteClient(client.id.toString())}>
                      Delete
                    </Button>
                    <Button size="sm" variant="outline" className="ml-2" onClick={() => { setSelectedClientForService(client); setIsAddServiceDialogOpen(true); }}>
                      Add Service
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDownloadReport(Number(client.id))}>
                      Download Report
                    </Button>
                  </TableCell>
                </TableRow>,
                client.services?.length > 0 && (
                  <tr key={client.id + '-services'}>
                    <td colSpan={5} className="p-0 border-0">
                      <div className="w-full px-4 pb-4">
                        {client.services.map((service) => (
                          <div key={service.id} className="border rounded p-4 mb-4 bg-gray-50 w-full flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <Badge variant="outline" className="bg-blue-50 mr-2">{service.name}</Badge>
                                <span className="text-xs text-muted-foreground">{service.stage}</span>
                                <span className="ml-2 text-xs truncate max-w-xs">{service.description}</span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Created: {service.created_at && !isNaN(Date.parse(service.created_at)) ? new Date(service.created_at).toLocaleDateString() : 'N/A'}
                              </div>
                              {expandedServiceId === Number(service.id) && (
                                <div className="mt-4">
                                  <div className="mb-2">
                                    <strong>Interactions:</strong>
                                    <ul className="ml-4 list-disc">
                                      {(serviceInteractions[Number(service.id)] || []).length === 0 ? (
                                        <li className="text-xs text-muted-foreground">No interactions</li>
                                      ) : (
                                        serviceInteractions[Number(service.id)].map((interaction, idx) => (
                                          <li key={interaction.id || idx} className="flex flex-col md:flex-row md:items-center gap-2">
                                            <span>{interaction.details}</span>
                                            <span className="text-xs text-muted-foreground">{interaction.created_at && !isNaN(Date.parse(interaction.created_at)) ? new Date(interaction.created_at).toLocaleDateString() : 'N/A'}</span>
                                            <div className="flex gap-2 mt-1 md:mt-0">
                                              <Button size="sm" variant="outline" onClick={() => handleEditInteraction(service, interaction)}>Edit</Button>
                                              <Button size="sm" variant="destructive" onClick={() => handleDeleteInteraction(service, interaction)}>Delete</Button>
                                            </div>
                                          </li>
                                        ))
                                      )}
                                    </ul>
                                  </div>
                                  <div className="mb-2">
                                    <strong>Documents:</strong>
                                    <ul className="ml-4 list-disc">
                                      {(serviceDocuments[Number(service.id)] || []).length === 0 ? (
                                        <li className="text-xs text-muted-foreground">No documents</li>
                                      ) : (
                                        serviceDocuments[Number(service.id)].map((doc, idx) => (
                                          <li key={doc.id || idx} className="flex items-center gap-2">
                                            <a href={`/${doc.file_url}`} target="_blank" rel="noopener noreferrer">{doc.name}</a>
                                            <span className="text-xs text-muted-foreground">{doc.created_at && !isNaN(Date.parse(doc.created_at)) ? new Date(doc.created_at).toLocaleDateString() : 'N/A'}</span>
                                            <Button size="sm" variant="outline" onClick={() => handleDownloadDocument(Number(client.id), Number(service.id), Number(doc.id))}>Download</Button>
                                            <Button size="sm" variant="destructive" onClick={() => handleDeleteDocument(service, doc)}>Delete</Button>
                                          </li>
                                        ))
                                      )}
                                    </ul>
                                  </div>
                                  <div className="flex gap-2 mt-2">
                                    <Button size="sm" variant="outline" onClick={() => { setSelectedServiceForInteraction({ clientId: Number(client.id), id: Number(service.id) }); setIsAddInteractionDialogOpen(true); }}>
                                      Add Interaction
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => { setSelectedServiceForDocument({ clientId: Number(client.id), id: Number(service.id) }); setIsAddDocumentDialogOpen(true); }}>
                                      Add Document
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 flex-shrink-0 mt-2 md:mt-0">
                              <Button size="sm" variant="outline" onClick={() => handleEditService(service)}>Edit</Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDeleteService(service)}>Delete</Button>
                              <Button size="sm" variant="outline" onClick={() => {
                                setExpandedServiceId(expandedServiceId === Number(service.id) ? null : Number(service.id));
                                if (expandedServiceId !== Number(service.id)) fetchServiceDetails(Number(client.id), Number(service.id));
                              }}>
                                {expandedServiceId === Number(service.id) ? 'Hide Details' : 'Show Details'}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )
              ])}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateClient} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_name">Name *</Label>
                <Input id="edit_name" name="name" defaultValue={editingClient?.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_email">Email *</Label>
                <Input id="edit_email" name="email" type="email" defaultValue={editingClient?.email} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_mobile_number">Mobile Number</Label>
                <Input id="edit_mobile_number" name="mobile_number" defaultValue={editingClient?.mobile_number || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_company_name">Company Name</Label>
                <Input id="edit_company_name" name="company_name" defaultValue={editingClient?.client_employer_company_name || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_profession">Profession</Label>
                <Input id="edit_profession" name="profession" defaultValue={editingClient?.profession || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_qualification">Qualification</Label>
                <Input id="edit_qualification" name="qualification" defaultValue={editingClient?.qualification || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_income">Income</Label>
                <Input id="edit_income" name="income" type="number" step="0.01" defaultValue={editingClient?.income ? editingClient.income.toString() : ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_date_of_investment">Date of Investment</Label>
                <Input id="edit_date_of_investment" name="date_of_investment" type="date" defaultValue={editingClient?.date_of_investment ? editingClient.date_of_investment : ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_investment_type">Investment Type</Label>
                <Select
                  name="investment_type"
                  defaultValue={editingClient?.investment_type || ''}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select investment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equity">Equity</SelectItem>
                    <SelectItem value="sip">SIP</SelectItem>
                    <SelectItem value="lumsum">Lumsum</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="pms">PMS</SelectItem>
                    <SelectItem value="aid">AID</SelectItem>
                    <SelectItem value="others">Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_reference_name">Reference Name</Label>
                <Input id="edit_reference_name" name="reference_name" defaultValue={editingClient?.reference_name || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_reference_email">Reference Email</Label>
                <Input id="edit_reference_email" name="reference_email" type="email" defaultValue={editingClient?.reference_email || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_reference_contact">Reference Contact</Label>
                <Input id="edit_reference_contact" name="reference_contact" defaultValue={editingClient?.reference_contact || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_relationship_manager">Relationship Manager</Label>
                <Input id="edit_relationship_manager" name="relationship_manager" defaultValue={editingClient?.relationship_manager || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_interaction_type">Interaction Type</Label>
                <Select
                  name="interaction_type"
                  defaultValue={editingClient?.interaction_type || ''}
                >
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
              <div className="space-y-2">
                <Label htmlFor="edit_phone">Phone</Label>
                <Input id="edit_phone" name="phone" defaultValue={editingClient?.phone || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_address">Address</Label>
                <Input id="edit_address" name="address" defaultValue={editingClient?.address || ''} />
              </div>
              
              <div className="col-span-2 space-y-2">
                <Label htmlFor="edit_assigned_to">Assigned To</Label>
                {validEmployees.length === 0 ? (
                  <Select disabled defaultValue="">
                    <SelectTrigger>
                      <SelectValue placeholder="No employees available" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No employees available</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Select
                    name="assigned_to"
                    defaultValue={editingClient?.assigned_to ? editingClient.assigned_to.toString() : ""}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {validEmployees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>{emp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="edit_notes">Notes</Label>
                <Input id="edit_notes" name="notes" defaultValue={editingClient?.notes || ''} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isAddServiceDialogOpen} onOpenChange={setIsAddServiceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddService} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="service_name">Service Name *</Label>
              <Input id="service_name" name="service_name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service_description">Description</Label>
              <Input id="service_description" name="service_description" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service_stage">Stage</Label>
              <Input id="service_stage" name="service_stage" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddServiceDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isAddInteractionDialogOpen} onOpenChange={setIsAddInteractionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Interaction</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddInteraction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="interaction_details">Interaction Details *</Label>
              <Input id="interaction_details" name="interaction_details" required />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddInteractionDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isAddDocumentDialogOpen} onOpenChange={setIsAddDocumentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Document</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddDocument} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="document_name">Document Name *</Label>
              <Input id="document_name" name="document_name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="document_file">Document File *</Label>
              <Input id="document_file" name="document_file" type="file" required />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddDocumentDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isEditServiceDialogOpen} onOpenChange={setIsEditServiceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateService} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="service_name">Service Name *</Label>
              <Input id="service_name" name="service_name" defaultValue={editingService?.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service_description">Description</Label>
              <Input id="service_description" name="service_description" defaultValue={editingService?.description} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service_stage">Stage</Label>
              <Input id="service_stage" name="service_stage" defaultValue={editingService?.stage} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditServiceDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isDeleteServiceDialogOpen} onOpenChange={setIsDeleteServiceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Service</DialogTitle>
          </DialogHeader>
          <div>Are you sure you want to delete this service?</div>
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => setIsDeleteServiceDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDeleteService}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isEditInteractionDialogOpen} onOpenChange={setIsEditInteractionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Interaction</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateInteraction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="interaction_details">Interaction Details *</Label>
              <Input id="interaction_details" name="interaction_details" defaultValue={editingInteraction?.details} required />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditInteractionDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isDeleteInteractionDialogOpen} onOpenChange={setIsDeleteInteractionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Interaction</DialogTitle>
          </DialogHeader>
          <div>Are you sure you want to delete this interaction?</div>
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => setIsDeleteInteractionDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDeleteInteraction}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isDeleteDocumentDialogOpen} onOpenChange={setIsDeleteDocumentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
          </DialogHeader>
          <div>Are you sure you want to delete this document?</div>
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => setIsDeleteDocumentDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDeleteDocument}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
