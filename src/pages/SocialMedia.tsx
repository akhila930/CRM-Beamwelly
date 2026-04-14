
import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CampaignTracker } from "@/components/social/CampaignTracker";
import { PostScheduler } from "@/components/social/PostScheduler";
import { useFadeIn } from "@/lib/animations";

export default function SocialMedia() {
  const fadeStyle = useFadeIn();
  const [activeTab, setActiveTab] = useState("campaigns");

  return (
    <div className="flex min-h-screen w-full bg-gray-50/40">
      <Sidebar />
      <div className="flex-1">
        <Header title="Social Media Management" />
        <main className="flex-1 p-6 md:p-8">
          <div style={fadeStyle} className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Social Media Management</h1>
            <p className="text-muted-foreground">
              Manage campaigns, schedule posts, and track performance
            </p>
          </div>

          <Tabs 
            defaultValue={activeTab} 
            className="mt-6" 
            onValueChange={setActiveTab}
          >
            <TabsList className="grid w-full md:w-auto grid-cols-2 gap-2">
              <TabsTrigger value="campaigns">Campaign Tracker</TabsTrigger>
              <TabsTrigger value="scheduler">Post Scheduler</TabsTrigger>
            </TabsList>
            
            <TabsContent value="campaigns" className="mt-6">
              <CampaignTracker />
            </TabsContent>
            
            <TabsContent value="scheduler" className="mt-6">
              <PostScheduler />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
