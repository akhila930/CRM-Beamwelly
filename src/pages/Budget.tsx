
import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BudgetDashboard } from "@/components/budget/BudgetDashboard";
import { ExpenseTracker } from "@/components/budget/ExpenseTracker";
import { BudgetForecast } from "@/components/budget/BudgetForecast";
import { useFadeIn } from "@/lib/animations";

export default function Budget() {
  const fadeStyle = useFadeIn();
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="flex min-h-screen w-full bg-gray-50/40">
      <Sidebar />
      <div className="flex-1">
        <Header title="Budget Management" />
        <main className="flex-1 p-6 md:p-8">
          <div style={fadeStyle} className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Budget Management</h1>
            <p className="text-muted-foreground">
              Track, allocate, and forecast your organization's finances
            </p>
          </div>

          <Tabs 
            defaultValue={activeTab} 
            className="mt-6" 
            onValueChange={setActiveTab}
          >
            <TabsList className="grid w-full md:w-auto grid-cols-3 gap-2">
              <TabsTrigger value="dashboard">Overview</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="forecast">Forecasting</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard" className="mt-6">
              <BudgetDashboard />
            </TabsContent>
            
            <TabsContent value="expenses" className="mt-6">
              <ExpenseTracker />
            </TabsContent>
            
            <TabsContent value="forecast" className="mt-6">
              <BudgetForecast />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
