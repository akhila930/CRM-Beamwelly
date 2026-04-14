import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogClose, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Plus, Filter, Edit, Trash } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/axios";
import { useAuth } from "@/contexts/AuthContext";

interface Campaign {
  id: number;
  name: string;
  description?: string;
  platforms: string[];
  budget: number;
  spent: number;
  roi: number;
  status: string;
  start_date: string;
  end_date: string;
  company_name: string;
}

interface Stats {
  total_budget: number;
  total_spent: number;
  campaign_count: number;
  active_campaigns: number;
  completed_campaigns: number;
  total_posts: number;
  scheduled_posts: number;
  published_posts: number;
}

export function CampaignTracker() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filter, setFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.company_name) {
      fetchCampaigns();
      fetchStats();
    }
  }, [user?.company_name]);

  const fetchCampaigns = async () => {
    try {
      const response = await api.get<Campaign[]>('/api/social/campaigns');
      setCampaigns(response.data);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: "Error",
        description: "Failed to fetch campaigns",
        variant: "destructive"
      });
      setCampaigns([]);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get<Stats>('/api/social/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats(null);
    }
  };

  const handleAddCampaign = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const campaignData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        platforms: [formData.get('platform') as string],
        budget: parseFloat(formData.get('budget') as string),
        start_date: new Date(formData.get('startDate') as string).toISOString(),
        end_date: new Date(formData.get('endDate') as string).toISOString(),
        status: "PLANNED",
        company_name: user?.company_name
      };
  
      console.log('Sending campaign data:', campaignData);  
  
      await api.post('/api/social/campaigns', campaignData);
      
      await fetchCampaigns();
      await fetchStats();
      
      toast({
        title: "Success",
        description: "Campaign created successfully",
      });
    
      setIsAddDialogOpen(false);
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to create campaign",
        variant: "destructive"
      });
    }
  };

  const handleEditCampaign = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCampaign) return;

    const formData = new FormData(e.currentTarget);
    
    try {
      const campaignData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string || undefined,
        platforms: [formData.get('platform') as string],
        budget: parseFloat(formData.get('budget') as string),
        spent: parseFloat(formData.get('spent') as string) || 0,
        start_date: new Date(formData.get('startDate') as string).toISOString().split('T')[0],
        end_date: new Date(formData.get('endDate') as string).toISOString().split('T')[0],
        status: formData.get('status') as string
      };
  
      await api.put(`/api/social/campaigns/${selectedCampaign.id}`, campaignData);
      
      await fetchCampaigns();
      await fetchStats();
      
      toast({
        title: "Success",
        description: "Campaign updated successfully",
      });
    
      setIsEditDialogOpen(false);
      setSelectedCampaign(null);
    } catch (error: any) {
      console.error('Error updating campaign:', error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to update campaign",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCampaign = async (campaignId: number) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;

    try {
      await api.delete(`/api/social/campaigns/${campaignId}`);
      
      await fetchCampaigns();
      await fetchStats();
      
      toast({
        title: "Success",
        description: "Campaign deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting campaign:', error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to delete campaign",
        variant: "destructive"
      });
    }
  };

  const renderStats = () => {
    if (!stats) return null;

    const remainingBudget = stats.total_budget - stats.total_spent;
    const spentPercentage = (stats.total_spent / stats.total_budget) * 100;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Budget Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.total_budget.toLocaleString()}</div>
            <div className="mt-2 space-y-1">
              <p className="text-sm">
                <span className="text-green-600">Spent: ₹{stats.total_spent.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground ml-1">({spentPercentage.toFixed(1)}%)</span>
              </p>
              <p className="text-sm">
                <span className="text-blue-600">Remaining: ₹{remainingBudget.toLocaleString()}</span>
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.campaign_count}</div>
            <div className="mt-2 space-y-1">
              <p className="text-sm">
                <span className="text-green-600">Active: {stats.active_campaigns}</span>
              </p>
              <p className="text-sm">
                <span className="text-blue-600">Completed: {stats.completed_campaigns}</span>
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_posts}</div>
            <div className="mt-2 space-y-1">
              <p className="text-sm">
                <span className="text-yellow-600">Scheduled: {stats.scheduled_posts}</span>
              </p>
              <p className="text-sm">
                <span className="text-green-600">Published: {stats.published_posts}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderCampaignDialog = (type: 'add' | 'edit') => {
    const isEdit = type === 'edit';
    const campaign = isEdit ? selectedCampaign : null;

    return (
      <Dialog 
        open={isEdit ? isEditDialogOpen : isAddDialogOpen} 
        onOpenChange={isEdit ? setIsEditDialogOpen : setIsAddDialogOpen}
      >
        <DialogTrigger asChild>
          {isEdit ? null : (
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Campaign
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[525px]">
          <form onSubmit={isEdit ? handleEditCampaign : handleAddCampaign}>
            <DialogHeader>
              <DialogTitle>{isEdit ? 'Edit Campaign' : 'Create New Campaign'}</DialogTitle>
              <DialogDescription>
                {isEdit ? 'Update campaign details' : 'Add a new campaign to track its budget and performance.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Campaign Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  defaultValue={campaign?.name} 
                  required 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input 
                  id="description" 
                  name="description" 
                  defaultValue={campaign?.description}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="platform">Platform</Label>
                <Select 
                  name="platform" 
                  defaultValue={campaign?.platforms[0] || "facebook"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="budget">Budget</Label>
                  <Input 
                    id="budget" 
                    name="budget" 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    defaultValue={campaign?.budget}
                    required 
                  />
                </div>
                {isEdit && (
                  <div className="grid gap-2">
                    <Label htmlFor="spent">Spent Amount</Label>
                    <Input 
                      id="spent" 
                      name="spent" 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      defaultValue={campaign?.spent || 0}
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input 
                    id="startDate" 
                    name="startDate" 
                    type="date" 
                    defaultValue={campaign?.start_date}
                    required 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input 
                    id="endDate" 
                    name="endDate" 
                    type="date" 
                    defaultValue={campaign?.end_date}
                    required 
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  name="status" 
                  defaultValue={campaign?.status || "planned"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">{isEdit ? 'Update Campaign' : 'Create Campaign'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      {renderStats()}
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          
          {renderCampaignDialog('add')}
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Spent</TableHead>
              <TableHead>ROI</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell className="font-medium">{campaign.name}</TableCell>
                <TableCell>{campaign.platforms.join(", ")}</TableCell>
                <TableCell>₹{campaign.budget.toLocaleString()}</TableCell>
                <TableCell>₹{campaign.spent.toLocaleString()}</TableCell>
                <TableCell>{campaign.roi.toFixed(2)}%</TableCell>
                <TableCell>
                  <span className={`capitalize ${
                    campaign.status === "active" ? "text-green-600" :
                    campaign.status === "completed" ? "text-blue-600" :
                    campaign.status === "cancelled" ? "text-red-600" :
                    "text-yellow-600"
                  }`}>
                    {campaign.status}
                  </span>
                </TableCell>
                <TableCell>
                  {new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedCampaign(campaign);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteCampaign(campaign.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedCampaign && renderCampaignDialog('edit')}
    </div>
  );
}
