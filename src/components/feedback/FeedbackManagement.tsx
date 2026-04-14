import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeeFeedback } from "./EmployeeFeedback";
import { ClientFeedback } from "./ClientFeedback";

export function FeedbackManagement() {
  const [activeTab, setActiveTab] = useState("employee");

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Feedback Management</h1>
      
      <Tabs defaultValue="employee" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="employee">Employee Feedback</TabsTrigger>
          <TabsTrigger value="client">Client Feedback</TabsTrigger>
        </TabsList>
        
        <TabsContent value="employee" className="mt-6">
          <EmployeeFeedback />
        </TabsContent>
        
        <TabsContent value="client" className="mt-6">
          <ClientFeedback />
        </TabsContent>
      </Tabs>
    </div>
  );
} 