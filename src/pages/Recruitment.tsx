import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserCheck, Search, Plus, Filter, Download, Upload } from "lucide-react";
import { useFadeIn, useSequentialFadeIn } from "@/lib/animations";
import { CandidateList } from "@/components/recruitment/CandidateList";
import { RecruitmentStats } from "@/components/recruitment/RecruitmentStats";
import { AddCandidateForm } from "@/components/recruitment/AddCandidateForm";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployees } from "@/contexts/EmployeeContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";

export default function Recruitment() {
  const [selectedTab, setSelectedTab] = useState("candidates");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshList, setRefreshList] = useState(false);
  const fadeStyle = useFadeIn();
  const { user } = useAuth();
  const { getEmployeeByEmail } = useEmployees();
  const [employee, setEmployee] = useState<any>(null);

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!user?.email) return;
      const emp = await getEmployeeByEmail(user.email);
      setEmployee(emp);
      setLoading(false);
    };
    fetchEmployee();
  }, [getEmployeeByEmail, user?.email]);

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/api/recruitment/template', {
        responseType: 'blob', // Important for binary data
      });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'candidate_template.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Template downloaded successfully!");
    } catch (error) {
      console.error("Error downloading template:", error);
      toast.error("Failed to download template.");
    }
  };

  const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/api/recruitment/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success("Candidates uploaded successfully!");
      setRefreshList(prev => !prev);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload candidates.");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  // Only show access denied if employee is loaded and does not have access
  if (employee && user?.role !== "admin" && !employee.can_access_recruitment) {
    return (
      <div className="flex min-h-screen w-full bg-gray-50/40">
        <Sidebar />
        <div className="flex-1">
          <Header title="Recruitment" />
          <main className="flex-1 p-6 md:p-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Access Denied</AlertTitle>
              <AlertDescription>
                You don't have permission to access the recruitment page. Please contact your administrator for access.
              </AlertDescription>
            </Alert>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-gray-50/40">
      <Sidebar />
      <div className="flex-1">
        <Header title="Recruitment" />
        <main className="flex-1 p-6 md:p-8">
          <div style={fadeStyle} className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <UserCheck className="h-8 w-8 text-brand-red" />
              Recruitment Management
            </h1>
            <p className="text-muted-foreground">
              Track candidates, manage recruitment pipeline, and streamline hiring
            </p>
          </div>

          <div className="mt-6">
            <RecruitmentStats />
          </div>

          <div className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Candidate Management</CardTitle>
                    <CardDescription>
                      View and manage all candidates in the recruitment pipeline
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {/* Download Template Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadTemplate}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>

                    {/* Bulk Upload Button */}
                    <Input
                      id="bulk-upload-input"
                      type="file"
                      accept=".xlsx, .xls"
                      className="hidden"
                      onChange={handleBulkUpload}
                    />
                    <label htmlFor="bulk-upload-input">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <div>
                          <Upload className="h-4 w-4 mr-2" />
                          Bulk Upload
                        </div>
                      </Button>
                    </label>

                    {/* Add Candidate Dialog Trigger */}
                    <Dialog open={showAddCandidate} onOpenChange={setShowAddCandidate}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAddCandidate(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Candidate
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Add New Candidate</DialogTitle>
                          <DialogDescription>
                            Fill out the form below to add a new candidate.
                          </DialogDescription>
                        </DialogHeader>
                        <AddCandidateForm
                          onSuccess={() => {
                            setShowAddCandidate(false);
                            toast.success("Candidate added successfully");
                            setRefreshList(prev => !prev);
                          }}
                          onCancel={() => setShowAddCandidate(false)}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search candidates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>

                <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                  <TabsList>
                    <TabsTrigger value="candidates">All Candidates</TabsTrigger>
                    <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
                  </TabsList>
                  <TabsContent value="candidates">
                    <CandidateList filter={searchQuery} stage="all" refreshList={refreshList} />
                  </TabsContent>
                  <TabsContent value="pipeline">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="space-y-2">
                        <h3 className="font-semibold">Applied</h3>
                        <CandidateList filter={searchQuery} stage="applied" refreshList={refreshList} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold">Screening</h3>
                        <CandidateList filter={searchQuery} stage="screening" refreshList={refreshList} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold">Interview</h3>
                        <CandidateList filter={searchQuery} stage="interview" refreshList={refreshList} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold">Offer</h3>
                        <CandidateList filter={searchQuery} stage="offer" refreshList={refreshList} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold">Hired</h3>
                        <CandidateList filter={searchQuery} stage="hired" refreshList={refreshList} />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* The inline form is now removed as it's in the Dialog */}
          {/* showAddCandidate && (
            <AddCandidateForm
              onSuccess={() => {
                setShowAddCandidate(false);
                toast.success("Candidate added successfully");
              }}
              onCancel={() => setShowAddCandidate(false)}
            />
          ) */}
        </main>
      </div>
    </div>
  );
}
