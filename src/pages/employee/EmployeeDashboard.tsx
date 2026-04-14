
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { EmployeeDirectory } from "@/components/employee/EmployeeDirectory";
import { useFadeIn } from "@/lib/animations";
import { EmployeeProvider } from "@/contexts/EmployeeContext";

export default function EmployeeDashboard() {
  const fadeStyle = useFadeIn();
  const navigate = useNavigate();

  return (
    <EmployeeProvider>
      <div className="flex min-h-screen w-full bg-gray-50/40">
        <Sidebar />
        <div className="flex-1">
          <Header title="Employee Dashboard" />
          <main className="flex-1 p-6 md:p-8">
            <div style={fadeStyle} className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Employee Dashboard</h1>
              <p className="text-muted-foreground">
                Manage your organization's employees
              </p>
            </div>

            <div className="mt-6">
              <EmployeeDirectory />
            </div>
          </main>
        </div>
      </div>
    </EmployeeProvider>
  );
}
