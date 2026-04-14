import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  FolderIcon, 
  FileIcon, 
  PlusIcon, 
  SearchIcon, 
  UploadIcon, 
  TrashIcon, 
  LockIcon, 
  UnlockIcon, 
  EyeIcon, 
  FilePlusIcon,
  SettingsIcon,
  FolderPlusIcon,
  DownloadIcon,
  FolderPlus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/axios";

interface Folder {
  id: number;
  name: string;
  description: string | null;
  is_confidential: boolean;
  document_count: number;
  created_at: string;
  updated_at: string;
  created_by: number;
  access_key?: string;
}

interface Document {
  id: number;
  title: string;
  description: string;
  file_type: string;
  file_size: number;
  folder_id: number | null;
  is_confidential: boolean;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
}

interface DocumentLibraryProps {
  documents?: Document[];
  isLoading?: boolean;
}

export function DocumentLibrary({ documents: externalDocuments, isLoading: externalLoading }: DocumentLibraryProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null);
  const [isConfidentialAccessGranted, setIsConfidentialAccessGranted] = useState(false);
  const [accessCodeDialogOpen, setAccessCodeDialogOpen] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [hasConfidentialAccess, setHasConfidentialAccess] = useState(false);
  const [showFolderManagement, setShowFolderManagement] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isConfidential, setIsConfidential] = useState(false);
  const [attemptingConfidentialAccess, setAttemptingConfidentialAccess] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const isAdmin = user?.role === "admin" || user?.email === "equitywalaa@gmail.com";

  const CONFIDENTIAL_ACCESS_CODE = "EW2024SECRET";

  useEffect(() => {
    fetchFolders();
    if (!externalDocuments) {
      fetchDocuments();
    }
  }, [externalDocuments]);

  useEffect(() => {
    if (externalDocuments) {
      setDocuments(externalDocuments);
    }
  }, [externalDocuments]);

  useEffect(() => {
    const hasStoredAccess = localStorage.getItem('confidentialAccess') === 'true';
    console.log('Confidential access from storage:', hasStoredAccess);
    setHasConfidentialAccess(hasStoredAccess);
    
    // Also set the flag if user is admin
    if (isAdmin) {
      console.log('User is admin, granting confidential access automatically');
      setHasConfidentialAccess(true);
    }
  }, [isAdmin]); // Re-check if admin status changes

  useEffect(() => {
    // This effect will force the access code dialog for the confidential tab
    // for non-admin users who don't have confidential access
    if (activeTab === "confidential") {
      console.log('Active tab is confidential');
      console.log('Is admin?', isAdmin);
      console.log('Has confidential access?', hasConfidentialAccess);
      
      if (!isAdmin && !hasConfidentialAccess) {
        console.log('Opening access code dialog');
        setAccessCodeDialogOpen(true);
        // If this is the initial load, switch back to "all" tab
        // until the user provides the correct code
        if (!attemptingConfidentialAccess) {
          console.log('Switching back to all tab');
          setTimeout(() => {
            setActiveTab("all");
          }, 0);
        }
      }
    }
  }, [activeTab, isAdmin, hasConfidentialAccess, attemptingConfidentialAccess]);

  const fetchFolders = async () => {
    try {
      const response = await api.get('/api/documents/folders');
      setFolders(response.data);
      console.log('Fetched folders:', response.data);
    } catch (error) {
      console.error('Error fetching folders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch folders",
        variant: "destructive"
      });
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await api.get(selectedFolder 
        ? `/api/documents/folders/${selectedFolder}/documents`
        : '/api/documents/documents/all'
      );
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "Failed to fetch documents",
        variant: "destructive"
      });
    }
  };

  const handleCreateFolder = async () => {
    try {
      const response = await api.post('/api/documents/folders', {
        name: newFolderName,
        description: null,
        is_confidential: isConfidential,
        created_by: user?.id,
      });
      console.log('Created folder:', response.data);
      await fetchFolders();
      setNewFolderName('');
      setIsConfidential(false);
      setIsFolderDialogOpen(false);
      
      // If we created a confidential folder, switch to confidential tab
      if (isConfidential) {
        setActiveTab("confidential");
      }
      
      toast({
        title: 'Success',
        description: 'Folder created successfully',
      });
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: 'Error',
        description: 'Failed to create folder. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const verifyFolderAccess = (folder: Folder) => {
    if (!folder.is_confidential) return true;
    if (isAdmin) return true;
    if (folder.created_by === Number(user?.id)) return true;
    return hasConfidentialAccess;
  };

  const handleUploadDocument = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', (e.currentTarget.elements.namedItem('title') as HTMLInputElement).value);
    formData.append('description', (e.currentTarget.elements.namedItem('description') as HTMLTextAreaElement).value || '');
    formData.append('folder_id', (e.currentTarget.elements.namedItem('folder_id') as HTMLSelectElement).value);
    const isConfidentialChecked = (e.currentTarget.elements.namedItem('is_confidential') as HTMLInputElement)?.checked;
    formData.append('is_confidential', isConfidentialChecked ? 'true' : 'false');
    
    try {
      const response = await api.post('/api/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      await fetchDocuments();
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
    } catch (error: any) {
      console.error('Error uploading document:', error);
      
      let errorMessage = "Failed to upload document";
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
          // If it's a database error, provide a more user-friendly message
          if (errorMessage.includes('psycopg2') || errorMessage.includes('SQLAlchemy')) {
            errorMessage = "There was a database error. Please check your file type and try again.";
          }
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleDeleteDocument = async (documentId: number) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      await api.delete(`/api/documents/documents/${documentId}`);
      await fetchDocuments();
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive"
      });
    }
  };

  const handleDeleteFolder = async (folderId: number) => {
    if (!confirm("Are you sure you want to delete this folder and all its documents?")) return;

    try {
      await api.delete(`/api/documents/folders/${folderId}`);
      await fetchFolders();
      setSelectedFolder(null);
      toast({
        title: "Success",
        description: "Folder deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting folder:', error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to delete folder",
        variant: "destructive"
      });
    }
  };

  const handleDownloadDocument = async (doc: Document) => {
    try {
      console.log('Downloading document:', doc);
      toast({
        title: "Starting download",
        description: "Please wait while we prepare your file...",
      });
      
      // For PDF files, open in a new tab instead of downloading directly
      const isPdf = doc.file_type.toLowerCase() === 'pdf';
      
      const response = await api.get(`/api/documents/documents/${doc.id}/download`, {
        responseType: 'blob'
      });
      
      console.log('Download response:', response);
      const contentType = response.headers['content-type'];
      console.log('Content-Type:', contentType);
      
      // Create blob with proper content type
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      
      // Get filename from Content-Disposition header if possible
      let filename = doc.title;
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      // Add file extension if needed
      if (!filename.includes('.')) {
        filename += '.' + doc.file_type.toLowerCase();
      }
      
      if (isPdf) {
        // For PDFs, open in new tab
        const newTab = window.open(url, '_blank');
        if (!newTab) {
          // If popup blocked, provide direct download link
          toast({
            title: "Popup Blocked",
            description: "Please allow popups or use the download link provided.",
            variant: "destructive"
          });
          
          // Fallback to direct download
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        // For other files, download directly
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      // Clean up URL after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
      
      toast({
        title: "Success",
        description: isPdf ? "PDF opened in new tab" : "File downloaded successfully"
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Error",
        description: "Failed to download document. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleAccessCodeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (accessCode === CONFIDENTIAL_ACCESS_CODE) {
        // Set access flags first
        setHasConfidentialAccess(true);
        localStorage.setItem('confidentialAccess', 'true');
        
        // Fetch data before showing confidential content
        await Promise.all([fetchFolders(), fetchDocuments()]);
        
        // Update UI state
        setAccessCodeDialogOpen(false);
        setActiveTab("confidential");
        setAttemptingConfidentialAccess(true);
        
        toast({
          title: "Success",
          description: "Access granted to confidential documents",
        });
      } else {
        // Reset state if incorrect code
        setAttemptingConfidentialAccess(false);
        setActiveTab("all");
        
        toast({
          title: "Error",
          description: "Invalid access code",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error while validating access code:", error);
      setAttemptingConfidentialAccess(false);
      setActiveTab("all");
      
      toast({
        title: "Error",
        description: "Failed to process access code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAccessCode(""); // Clear the access code input
    }
  };

  const handleEditDocument = async (doc: Document) => {
    try {
      const formData = new FormData();
      formData.append('title', doc.title);
      if (doc.description) {
        formData.append('description', doc.description);
      }
      formData.append('is_confidential', String(doc.is_confidential));
      formData.append('folder_id', String(doc.folder_id));

      await api.patch(`/api/documents/documents/${doc.id}`, formData);
      await fetchDocuments();
      toast({
        title: "Success",
        description: "Document updated successfully",
      });
    } catch (error) {
      console.error('Error updating document:', error);
      toast({
        title: "Error",
        description: "Failed to update document",
        variant: "destructive"
      });
    }
  };

  // Function to format date properly
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    
    // Check if it's a valid date
    const date = new Date(dateString);
    if (isNaN(date.getTime()) || date.getFullYear() <= 1971) {
      return 'Unknown';
    }
    
    // Format date as DD/MM/YYYY
    return date.toLocaleDateString();
  };

  // Modify the filteredDocuments to only show documents for the currently selected folder
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const folder = folders.find(f => f.id === doc.folder_id);
    if (!folder) return false;
    
    const hasAccess = verifyFolderAccess(folder);
    
    // Only show documents for selected folder if one is selected
    if (selectedFolder && doc.folder_id !== selectedFolder) {
      return false;
    }
    
    if (activeTab === "all") {
      return matchesSearch && !folder.is_confidential && hasAccess;
    } else if (activeTab === "confidential") {
      return matchesSearch && folder.is_confidential && hasAccess;
    }
    
    return false;
  });

  const filteredFolders = folders.filter(folder => {
    const matchesTab = activeTab === "all" ? !folder.is_confidential : folder.is_confidential;
    return matchesTab;
  });

  const FolderManagementDialog = () => (
    <Dialog open={showFolderManagement} onOpenChange={setShowFolderManagement}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Folders</DialogTitle>
          <DialogDescription>
            Create, edit, or delete document folders.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsFolderDialogOpen(true)}>
              <FolderPlus className="mr-2 h-4 w-4" /> Create New Folder
            </Button>
          </div>
          
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Confidential</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {folders.map((folder) => (
                  <TableRow key={folder.id}>
                    <TableCell className="font-medium">{folder.name}</TableCell>
                    <TableCell>{folder.document_count}</TableCell>
                    <TableCell>
                      {folder.is_confidential ? (
                        <LockIcon className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <UnlockIcon className="h-4 w-4 text-green-500" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFolder(folder.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="relative w-full sm:w-64">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input 
            placeholder="Search documents..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="mr-2 h-4 w-4" /> Upload
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <form onSubmit={handleUploadDocument}>
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
                <DialogDescription>
                  Upload a new document to the document library.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Document Title</Label>
                    <Input id="title" name="title" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="folder_id">Folder</Label>
                    <select 
                      id="folder_id" 
                      name="folder_id"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      required
                    >
                      {folders.map(folder => (
                        <option key={folder.id} value={folder.id}>
                          {folder.name}
                        </option>
                      ))}
                    </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="file">Document File</Label>
                  <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center gap-2">
                    <UploadIcon className="h-8 w-8 text-gray-400" />
                      <p className="text-sm text-muted-foreground">
                        {selectedFile ? selectedFile.name : "Drag and drop your file here or click to browse"}
                      </p>
                      <Input 
                        id="file" 
                        type="file" 
                        className="hidden" 
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        required
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => document.getElementById('file')?.click()}
                      >
                      Select File
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                    <Checkbox id="is_confidential" name="is_confidential" value="true" />
                    <Label htmlFor="is_confidential">This is a confidential document</Label>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button type="submit">Upload Document</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={() => setShowFolderManagement(true)}>
            <FolderIcon className="mr-2 h-4 w-4" /> Manage Folders
                  </Button>
          <FolderManagementDialog />

          <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
                <DialogDescription>
                  Create a new folder to organize your documents.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="folderName">Folder Name</Label>
                  <Input
                    id="folderName"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                  />
                  </div>
                {(isAdmin || user?.email === "equitywalaa@gmail.com") && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="confidential"
                      checked={isConfidential}
                      onCheckedChange={(checked) => setIsConfidential(checked === true)}
                    />
                    <Label htmlFor="confidential">Confidential</Label>
                </div>
                  )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsFolderDialogOpen(false)}>
                    Cancel
                </Button>
                <Button onClick={handleCreateFolder}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Tabs 
        value={activeTab} 
        className="space-y-4" 
        onValueChange={(value) => {
          if (value === "confidential") {
            if (!isAdmin && !hasConfidentialAccess) {
              setAccessCodeDialogOpen(true);
              setAttemptingConfidentialAccess(true);
              return; // Don't change tab yet
            }
          }
          setActiveTab(value);
        }}
      >
        <TabsList>
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger 
            value="confidential"
            onClick={(e) => {
              // Immediately check if user has access
              if (!isAdmin && !hasConfidentialAccess) {
                // Prevent tabs from changing
                e.preventDefault();
                // Show access code dialog
                setAccessCodeDialogOpen(true);
                setAttemptingConfidentialAccess(true);
              }
            }}
          >
            Confidential
            <LockIcon className="ml-2 h-4 w-4" />
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredFolders.map(folder => (
              <div 
                key={folder.id}
                className={`h-auto p-6 flex flex-col items-center justify-center gap-3 hover:border-primary border rounded-md cursor-pointer 
                ${selectedFolder === folder.id ? 'border-primary border-2 bg-blue-50' : 'border-input'}`}
                onClick={() => {
                  if (!verifyFolderAccess(folder)) {
                    setAccessCodeDialogOpen(true);
                    return;
                  }
                  setSelectedFolder(folder.id);
                }}
              >
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                  folder.is_confidential ? 'bg-red-100' : 'bg-blue-100'
                }`}>
                  {folder.is_confidential ? (
                    <LockIcon className="h-6 w-6 text-red-500" />
                  ) : (
                    <FolderIcon className="h-6 w-6 text-blue-500" />
                  )}
                </div>
                <div className="text-center">
                  <h3 className="font-medium">{folder.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {folder.document_count} document{folder.document_count !== 1 ? 's' : ''}
                  </p>
                </div>
                {selectedFolder === folder.id && (
                  <div className="absolute top-0 right-0 p-1 bg-blue-500 text-white rounded-bl-md">
                    <span className="text-xs">Selected</span>
                  </div>
                )}
                {(isAdmin || (!folder.is_confidential && folder.created_by === Number(user?.id))) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFolder(folder.id);
                    }}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        
          {!selectedFolder && (
            <div className="my-8 text-center p-8 border border-dashed rounded-md bg-gray-50">
              <FolderIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No folder selected</h3>
              <p className="text-sm text-gray-500 mb-4">
                Please select a folder above to view its documents
              </p>
            </div>
          )}

          {selectedFolder && filteredDocuments.length === 0 && (
            <div className="my-8 text-center p-8 border border-dashed rounded-md bg-gray-50">
              <FileIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No documents found</h3>
              <p className="text-sm text-gray-500">
                This folder doesn't contain any documents yet. Upload documents using the "Upload" button.
              </p>
            </div>
          )}

          {selectedFolder && filteredDocuments.length > 0 && (
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                  <CardDescription>
                    {folders.find(f => f.id === selectedFolder)?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDocuments.map(doc => {
                        const folder = folders.find(f => f.id === doc.folder_id);
                        return (
                          <TableRow key={doc.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {doc.is_confidential && (
                                  <LockIcon className="h-4 w-4 text-yellow-500" />
                                )}
                                {doc.title}
                              </div>
                            </TableCell>
                            <TableCell>{doc.file_type.toUpperCase()}</TableCell>
                            <TableCell>{formatDate(doc.created_at)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDownloadDocument(doc)}
                                >
                                  <DownloadIcon className="h-4 w-4" />
                                </Button>
                                {(isAdmin || doc.created_by === Number(user?.id)) && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteDocument(doc.id)}
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="confidential" className="space-y-4">
          {(() => {
            // Force access check for non-admin users
            if (!isAdmin && !hasConfidentialAccess) {
              // Show access required dialog
              return (
                <div className="text-center py-8">
                  <LockIcon className="mx-auto h-12 w-12 text-red-500" />
                  <p className="mt-4 text-xl font-medium">Access Restricted</p>
                  <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                    You need special permissions to view confidential documents.
                    Please enter the access code to continue.
                  </p>
                  <Button 
                    onClick={() => {
                      setAccessCodeDialogOpen(true);
                      setAttemptingConfidentialAccess(true);
                    }}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Enter Access Code
                  </Button>
                </div>
              );
            }
            
            // If they have access, show folder content
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredFolders.map(folder => (
                    <div 
                      key={folder.id}
                      className={`h-auto p-6 flex flex-col items-center justify-center gap-3 hover:border-primary border rounded-md cursor-pointer 
                      ${selectedFolder === folder.id ? 'border-primary border-2 bg-red-50' : 'border-input'}`}
                      onClick={() => setSelectedFolder(folder.id)}
                    >
                      <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                        <LockIcon className="h-6 w-6 text-red-500" />
                      </div>
                      <div className="text-center">
                        <h3 className="font-medium">{folder.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {folder.document_count} document{folder.document_count !== 1 ? 's' : ''}
                        </p>
                      </div>
                      {selectedFolder === folder.id && (
                        <div className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-bl-md">
                          <span className="text-xs">Selected</span>
                        </div>
                      )}
                      {(isAdmin || folder.created_by === Number(user?.id)) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFolder(folder.id);
                          }}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                
                {!selectedFolder && filteredFolders.length > 0 && (
                  <div className="my-8 text-center p-8 border border-dashed rounded-md bg-gray-50">
                    <FolderIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No folder selected</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Please select a confidential folder above to view its documents
                    </p>
                  </div>
                )}
              
                {selectedFolder && filteredDocuments.length === 0 && (
                  <div className="my-8 text-center p-8 border border-dashed rounded-md bg-gray-50">
                    <FileIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No documents found</h3>
                    <p className="text-sm text-gray-500">
                      This confidential folder doesn't contain any documents yet. Upload documents using the "Upload" button.
                    </p>
                  </div>
                )}

                {selectedFolder && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Confidential Documents</CardTitle>
                      <CardDescription>
                        {folders.find(f => f.id === selectedFolder)?.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Uploaded</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredDocuments.filter(doc => doc.folder_id === selectedFolder).map(doc => (
                            <TableRow key={doc.id}>
                              <TableCell className="font-medium">{doc.title}</TableCell>
                              <TableCell>{doc.file_type.toUpperCase()}</TableCell>
                              <TableCell>{formatDate(doc.created_at)}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDownloadDocument(doc)}
                                  >
                                    <DownloadIcon className="h-4 w-4" />
                                  </Button>
                                  {(isAdmin || doc.created_by === Number(user?.id)) && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeleteDocument(doc.id)}
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

                {filteredFolders.length === 0 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                    <p className="font-medium mb-1">No confidential folders found</p>
                    <p className="text-sm">
                      If you just created a confidential folder and don't see it, please try the following:
                    </p>
                    <ul className="list-disc list-inside text-sm mt-2">
                      <li>Refresh the page to reload all folders</li>
                      <li>Create a new confidential folder using the "Manage Folders" button</li>
                      <li>Make sure the "Confidential" checkbox is selected when creating the folder</li>
                    </ul>
                  </div>
                )}
              </div>
            );
          })()}
        </TabsContent>

        <Dialog 
          open={accessCodeDialogOpen} 
          onOpenChange={(isOpen) => {
            // If dialog is being closed without proper access, stay on "all" tab
            if (!isOpen && !hasConfidentialAccess && !isAdmin && activeTab === "confidential") {
              setActiveTab("all");
              setAttemptingConfidentialAccess(false);
            }
            setAccessCodeDialogOpen(isOpen);
          }}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Enter Access Code</DialogTitle>
              <DialogDescription>
                Please enter the access code to view confidential documents.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAccessCodeSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="accessCode">Access Code</Label>
                  <Input
                    id="accessCode"
                    type="password"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setAccessCodeDialogOpen(false);
                  setActiveTab("all");
                  setAttemptingConfidentialAccess(false);
                }}>
                  Cancel
                </Button>
                <Button type="submit">Submit</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </Tabs>
    </div>
  );
}
