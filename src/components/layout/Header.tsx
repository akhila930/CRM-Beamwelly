import { useState, useEffect } from "react";
import { Bell, Search, User, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuShortcut
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFadeIn } from "@/lib/animations";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  CommandDialog, 
  CommandInput, 
  CommandList, 
  CommandEmpty, 
  CommandGroup, 
  CommandItem 
} from "@/components/ui/command";
import { useNavigate } from "react-router-dom";
import { searchItems, SearchResult } from "@/services/searchService";
import { format, formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import api from "@/lib/axios";
import { toAbsoluteApiUrl } from "@/lib/runtimeConfig";

interface HeaderProps {
  title?: string;
}

export function Header({ title = "Dashboard" }: HeaderProps) {
  const fadeStyle = useFadeIn(100);
  const { user, logout, setUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [editableUser, setEditableUser] = useState(user);
  
  useEffect(() => {
    console.log("[Header] Component mounted or user changed. User object:", user);
    console.log("[Header] Company name from user object:", user?.company_name);
    setEditableUser(user);
  }, [user]);

  // Search functionality
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    pages: SearchResult[];
    recent: SearchResult[];
  }>({ pages: [], recent: [] });
  
  // Function to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  // Function to handle search
  const handleSearch = () => {
    setSearchResults(searchItems(searchQuery));
    setSearchOpen(true);
  };

  useEffect(() => {
    if (!searchOpen) return;
    setSearchResults(searchItems(searchQuery));
  }, [searchQuery, searchOpen]);

  // Function to handle search item selection
  const handleSelectSearchItem = (path: string) => {
    setSearchOpen(false);
    navigate(path);
  };

  const handleProfileUpdate = async () => {
    if (!editableUser) return;
    try {
      const response = await api.put('/api/auth/me', editableUser);
      setUser(response.data);
      toast({
        title: 'Profile Updated',
        description: 'Your profile details have been updated.',
      });
      setIsProfileDialogOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Profile Update Failed',
        description: 'Could not update profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle logo file selection
  const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && user?.role === 'admin') { // Only allow admin to upload logo
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await api.post('/api/admin/upload-logo', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        // Update user state with new logo URL (assuming the backend returns it)
        if (response.data?.logo_url) {
          setUser({...user, logo_url: response.data.logo_url});
        }

        toast({
          title: "Logo Uploaded",
          description: "Company logo uploaded successfully.", 
        });

      } catch (error: any) {
        console.error("Error uploading logo:", error);
        toast({
          title: "Upload Failed",
          description: error.response?.data?.detail || "Failed to upload company logo.",
          variant: "destructive",
        });
      }
      // Reset file input
      event.target.value = '';
    } else if (file && user?.role !== 'admin') {
       toast({
          title: "Permission Denied",
          description: "Only administrators can upload company logos.",
          variant: "destructive",
        });
         // Reset file input
        event.target.value = '';
    }
  };

  return (
    <header 
      className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur-sm"
      style={fadeStyle}
    >
      {title && (
        <div className="flex-1">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        </div>
      )}

      <div className="hidden flex-1 md:flex">
        <form className="w-full max-w-sm" onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full bg-background pl-8 rounded-full"
              onClick={handleSearch}
            />
          </div>
        </form>
      </div>

      {user?.company_name && (
        <div className="hidden md:flex items-center mr-4">
          <span className="text-sm font-medium">{user.company_name}</span>
        </div>
      )}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full p-0 overflow-hidden">
              {user?.avatar ? (
                <Avatar className="h-full w-full">
                  <AvatarImage src={toAbsoluteApiUrl(user.avatar)} alt={user.name} />
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
              ) : user?.logo_url ? ( // Display company logo if available
                 <Avatar className="h-full w-full">
                  <AvatarImage src={toAbsoluteApiUrl(user.logo_url)} alt="Company Logo" />
                  <AvatarFallback>{user.company_name ? user.company_name[0] : "C"}</AvatarFallback>
                </Avatar>
              ) : (
                <Avatar className="h-full w-full">
                  <AvatarFallback>{user ? getInitials(user.name) : "U"}</AvatarFallback>
                </Avatar>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              {user?.name}
              <div className="text-xs text-muted-foreground">{user?.email}</div>
              {user?.company_name && <div className="text-xs text-muted-foreground">Company: {user.company_name}</div>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsProfileDialogOpen(true)}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </DropdownMenuItem>
            
            {/* Add Upload Logo Option (only for admin) */}
            {user?.role === 'admin' && (
              <DropdownMenuItem onSelect={() => document.getElementById('logo-upload-input')?.click()}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Upload Company Logo</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
              <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Hidden file input for logo upload */}
        <input 
          id="logo-upload-input"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleLogoChange}
        />

        <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit profile</DialogTitle>
              <DialogDescription>
                Make changes to your profile here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                  <Input 
                    id="name" 
                  value={editableUser?.name || ''} 
                  onChange={(e) => setEditableUser({...editableUser!, name: e.target.value})} 
                    className="col-span-3" 
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                  <Input 
                    id="email" 
                  value={editableUser?.email || ''} 
                  readOnly 
                  className="col-span-3 text-muted-foreground" 
                  />
                </div>
               {user?.role === 'admin' && (
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="companyName" className="text-right">
                    Company
                  </Label>
                  <Input 
                     id="companyName" 
                     value={editableUser?.company_name || ''} 
                     onChange={(e) => setEditableUser({...editableUser!, company_name: e.target.value})} 
                    className="col-span-3" 
                  />
                </div>
               )}
              </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="button" onClick={handleProfileUpdate}>Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput 
          placeholder="Type a command or search..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {searchResults.pages.length > 0 && (
            <CommandGroup heading="Pages">
              {searchResults.pages.map((result) => (
                <CommandItem 
                  key={result.path} 
                  onSelect={() => handleSelectSearchItem(result.path)}
                >
                  {result.name}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
           {searchResults.recent.length > 0 && ( // Display recent searches
            <CommandGroup heading="Recent">
              {searchResults.recent.map((result) => (
                <CommandItem 
                  key={result.path} 
                  onSelect={() => handleSelectSearchItem(result.path)}
                >
                  {result.name}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </header>
  );
}
