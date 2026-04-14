import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadPipeline } from "@/components/leads/LeadPipeline";
import { ClientList } from "@/components/client/ClientList";
import { ClientDetailsTabs } from "@/components/client/ClientDetailsTabs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useFadeIn } from "@/lib/animations";

export default function ClientManagement() {
  const [selectedTab, setSelectedTab] = useState("leads");
  const [clientDetailOpen, setClientDetailOpen] = useState(false);
  const fadeStyle = useFadeIn();

  return (
    <div className="flex min-h-screen w-full bg-gray-50/40">
      <Sidebar />
      <div className="flex-1">
        <Header title="Lead & Client Management" />
        <main className="flex-1 p-6 md:p-8">
          <div style={fadeStyle} className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Lead & Client Management</h1>
            <p className="text-muted-foreground">
              Track leads, manage clients, and monitor services
            </p>
          </div>

          <div className="mt-8">
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="leads">Lead Pipeline</TabsTrigger>
                <TabsTrigger value="clients">Clients</TabsTrigger>
              </TabsList>
              
              <TabsContent value="leads">
                <LeadPipeline />
              </TabsContent>
              
              <TabsContent value="clients">
                <ClientList />
              </TabsContent>
            </Tabs>
          </div>
          
          <Sheet open={clientDetailOpen} onOpenChange={setClientDetailOpen}>
            <SheetContent side="right" className="w-full sm:max-w-xl lg:max-w-2xl">
              <SheetHeader>
                <SheetTitle>Client Details</SheetTitle>
                <SheetDescription>
                  View and edit client information
                </SheetDescription>
              </SheetHeader>
              
              <div className="mt-6">
                <ClientDetailsTabs />
              </div>
            </SheetContent>
          </Sheet>
        </main>
      </div>
    </div>
  );
}
