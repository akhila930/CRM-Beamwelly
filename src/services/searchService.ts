// Mock search results data
const searchData = {
  pages: [
    { id: "dashboard", title: "Dashboard", path: "/dashboard", name: "Dashboard" },
    { id: "employee", title: "Employee Management", path: "/employee", name: "Employee Management" },
    { id: "recruitment", title: "Recruitment", path: "/recruitment", name: "Recruitment" },
    { id: "leave", title: "Leave Management", path: "/leave", name: "Leave Management" },
    { id: "tasks", title: "Task Management", path: "/tasks", name: "Task Management" },
    { id: "leads", title: "Client Management", path: "/leads", name: "Client Management" },
    { id: "budget", title: "Budget Management", path: "/budget", name: "Budget Management" },
    { id: "documents", title: "Documents", path: "/documents", name: "Documents" },
    { id: "salary", title: "Salary Management", path: "/salary", name: "Salary Management" },
    { id: "social", title: "Social Media", path: "/social", name: "Social Media" },
    { id: "analytics", title: "Analytics", path: "/analytics", name: "Analytics" },
    { id: "feedback", title: "Feedback", path: "/feedback", name: "Feedback" },
  ],
  recent: [
    { id: "recent-1", title: "Recent Task: Q3 Planning", path: "/tasks/q3-planning", name: "Recent Task: Q3 Planning" },
    { id: "recent-2", title: "Recent Document: HR Policy", path: "/documents/hr-policy", name: "Recent Document: HR Policy" },
  ]
};

export interface SearchResult {
  id: string;
  title: string;
  path: string;
  name: string;
}

// Function to search through our data
export const searchItems = (query: string): { pages: SearchResult[], recent: SearchResult[] } => {
  if (!query) {
    return searchData;
  }

  const normalizedQuery = query.toLowerCase().trim();
  
  const filteredPages = searchData.pages.filter(item => 
    item.title.toLowerCase().includes(normalizedQuery)
  );
  
  const filteredRecent = searchData.recent.filter(item => 
    item.title.toLowerCase().includes(normalizedQuery)
  );

  return {
    pages: filteredPages,
    recent: filteredRecent
  };
};
