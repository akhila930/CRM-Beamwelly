import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { FeedbackManagement } from "@/components/feedback/FeedbackManagement";

export default function Feedback() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Header title="Feedback Management" />
        <main className="flex-1 overflow-y-auto bg-muted/10 p-6">
          <div className="mx-auto max-w-7xl">
            <FeedbackManagement />
          </div>
        </main>
      </div>
    </div>
  );
}
