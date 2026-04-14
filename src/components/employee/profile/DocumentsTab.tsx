import { useState, useRef } from "react";
import { Document } from "@/types/employee";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useEmployees } from "@/contexts/EmployeeContext";
import { Plus, Download, Trash, FileText, Calendar, File, Upload } from "lucide-react";
import { useSequentialFadeIn } from "@/lib/animations";
import { toast } from "@/hooks/use-toast";

interface DocumentsTabProps {
  employeeId: string;
  documents: Document[];
}

export function DocumentsTab({ employeeId, documents }: DocumentsTabProps) {
  const { addDocument, deleteDocument } = useEmployees();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<'all' | 'resume' | 'contract' | 'id_proof' | 'certificate' | 'other'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newDocument, setNewDocument] = useState<Omit<Document, 'id'>>({
    title: '',
    description: '',
    file_path: '',
    file_type: 'other',
  });
  
  const personalDocuments = documents.filter((doc) => doc.file_type === 'resume');
  const contractDocuments = documents.filter((doc) => doc.file_type === 'contract');
  const idProofDocuments = documents.filter((doc) => doc.file_type === 'id_proof');
  const certificateDocuments = documents.filter((doc) => doc.file_type === 'certificate');
  const otherDocuments = documents.filter((doc) => doc.file_type === 'other');
  
  // Filter documents based on search query and selected type
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedDocumentType === 'all' || doc.file_type === selectedDocumentType;
    return matchesSearch && matchesType;
  });
  
  const cardStyles = useSequentialFadeIn(filteredDocuments.length, 100, 50);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewDocument({ ...newDocument, [name]: value });
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setNewDocument({ ...newDocument, [name]: value });
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 10MB",
          variant: "destructive",
        });
        return;
      }
      
      // Check file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Error",
          description: "Only PDF and Word documents are allowed",
          variant: "destructive",
        });
        return;
      }
      
      // Update document name and file, but preserve the user-selected file_type
      setNewDocument({
        ...newDocument,
        title: file.name,
        // Don't override the manually selected file_type
        file: file,
      });
    }
  };
  
  const handleAddDocument = async () => {
    if (!newDocument.title || !newDocument.file) {
      toast({
        title: "Error",
        description: "Please select a file and enter a name",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Make sure to use the selected file_type from the dropdown
      console.log('Uploading document with file_type:', newDocument.file_type);
      await addDocument(employeeId, newDocument);
      
      // Reset form
      setNewDocument({
        title: '',
        description: '',
        file_path: '',
        file_type: 'other',
        file: undefined,
      });
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      setIsAddDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteDocument = () => {
    if (!selectedDocumentId) {
      return;
    }
    
    deleteDocument(employeeId, selectedDocumentId);
    setIsDeleteDialogOpen(false);
    
    toast({
      title: "Success",
      description: "Document deleted successfully",
    });
  };
  
  const simulateDownload = async (doc: Document) => {
    try {
      // Create a temporary anchor element
      const link = document.createElement('a');
      // Use the API endpoint instead of direct file path
      link.href = `/api/employees/${employeeId}/documents/${doc.id}/download`;
      link.download = doc.title;
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Success",
        description: `Downloading ${doc.title}`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Error",
        description: "Failed to download document. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-4 w-4 text-blue-500" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };
  
  return (
    <Card className="border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Documents</CardTitle>
          <CardDescription>Manage employee documents</CardDescription>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Document</DialogTitle>
              <DialogDescription>
                Upload a new document for this employee.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); handleAddDocument(); }}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Document Title</Label>
                  <Input 
                    id="title" 
                    name="title" 
                    value={newDocument.title}
                    onChange={handleInputChange}
                    placeholder="Enter document title" 
                    required 
                    autoFocus
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="file_type">Document Type</Label>
                  <Select 
                    value={newDocument.file_type} 
                    onValueChange={(value) => handleSelectChange('file_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="resume">Resume</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="id_proof">ID Proof</SelectItem>
                      <SelectItem value="certificate">Certificate</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input 
                    id="description" 
                    name="description" 
                    value={newDocument.description}
                    onChange={handleInputChange}
                    placeholder="Enter document description"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="file">File</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      id="file" 
                      name="file" 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx"
                      required 
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Browse
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Upload Document</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div className="relative w-full sm:w-64">
              <FileText className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search documents..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select 
              value={selectedDocumentType} 
              onValueChange={(value: 'all' | 'resume' | 'contract' | 'id_proof' | 'certificate' | 'other') => setSelectedDocumentType(value)}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Documents</SelectItem>
                <SelectItem value="resume">Resumes</SelectItem>
                <SelectItem value="contract">Contracts</SelectItem>
                <SelectItem value="id_proof">ID Proofs</SelectItem>
                <SelectItem value="certificate">Certificates</SelectItem>
                <SelectItem value="other">Others</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Tabs defaultValue="all" onValueChange={(value) => setSelectedDocumentType(value as 'all' | 'resume' | 'contract' | 'id_proof' | 'certificate' | 'other')}>
            <TabsList>
              <TabsTrigger value="all">All Documents ({documents.length})</TabsTrigger>
              <TabsTrigger value="resume">Resumes</TabsTrigger>
              <TabsTrigger value="contract">Contracts</TabsTrigger>
              <TabsTrigger value="id_proof">ID Proofs</TabsTrigger>
              <TabsTrigger value="certificate">Certificates</TabsTrigger>
              <TabsTrigger value="other">Others</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-4">
              {renderDocumentList(filteredDocuments)}
            </TabsContent>
            
            <TabsContent value="resume" className="mt-4">
              {renderDocumentList(personalDocuments)}
            </TabsContent>
            
            <TabsContent value="contract" className="mt-4">
              {renderDocumentList(contractDocuments)}
            </TabsContent>
            
            <TabsContent value="id_proof" className="mt-4">
              {renderDocumentList(idProofDocuments)}
            </TabsContent>
            
            <TabsContent value="certificate" className="mt-4">
              {renderDocumentList(certificateDocuments)}
            </TabsContent>
            
            <TabsContent value="other" className="mt-4">
              {renderDocumentList(otherDocuments)}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
      
      {/* Delete Document Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteDocument}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
  
  function renderDocumentList(documents: Document[]) {
    if (documents.length === 0) {
      return (
        <div className="text-center py-10 text-muted-foreground">
          <p>No documents found.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Document
          </Button>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documents.map((document, index) => (
          <div
            key={document.id}
            style={cardStyles[index]}
            className="p-4 border rounded-lg flex items-start justify-between hover:bg-gray-50"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 rounded">
                {getFileIcon(document.file_type)}
              </div>
              <div>
                <h4 className="font-medium">{document.title}</h4>
                <div className="flex gap-2 items-center text-xs text-muted-foreground mt-1">
                  <Badge variant="outline" className={
                    document.file_type === 'resume' ? 'bg-blue-50' :
                    document.file_type === 'contract' ? 'bg-green-50' :
                    document.file_type === 'id_proof' ? 'bg-purple-50' :
                    document.file_type === 'certificate' ? 'bg-amber-50' : 
                    'bg-gray-50'
                  }>
                    {document.file_type === 'resume' ? 'Resume' :
                     document.file_type === 'contract' ? 'Contract' :
                     document.file_type === 'id_proof' ? 'ID Proof' :
                     document.file_type === 'certificate' ? 'Certificate' :
                     'Other'}
                  </Badge>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {document.created_at ? new Date(document.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => simulateDownload(document)}
                title="Download"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedDocumentId(document.id);
                  setIsDeleteDialogOpen(true);
                }}
                title="Delete"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  }
}
