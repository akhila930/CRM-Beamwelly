import { useNavigate } from "react-router-dom";
import { ChevronRight, User, Shield, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFadeIn, useSequentialFadeIn } from "@/lib/animations";

export default function Index() {
  const navigate = useNavigate();
  const heroStyle = useFadeIn(100);
  const featureStyles = useSequentialFadeIn(3, 300, 100);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div 
        className="relative overflow-hidden bg-white"
        style={heroStyle}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-brand-red/5 to-gray-50/50 backdrop-blur-3xl z-0"></div>
        
        <header className="relative z-10 mx-auto max-w-7xl px-4 py-6 flex items-center justify-between">
          <Button 
            variant="outline" 
            className="hidden sm:flex"
            onClick={() => navigate("/auth")}
          >
            Sign In
          </Button>
        </header>
        
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-24 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-brand-red/10 text-brand-red">
                <span>Employee Management System</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
                Streamline Your Workforce Management
              </h1>
              <p className="text-lg text-gray-600 max-w-md">
                A comprehensive solution for managing employees, recruitment, tasks, and company resources efficiently.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="relative overflow-hidden group"
                  onClick={() => navigate("/auth")}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Get Started
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-brand-red to-red-600 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => navigate("/dashboard")}
                >
                  Live Demo
                </Button>
              </div>
            </div>
            
            <div className="hidden md:block relative">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-red/20 to-transparent rounded-lg transform -rotate-3"></div>
              <img 
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=2070" 
                alt="Dashboard" 
                className="rounded-lg shadow-xl transform rotate-3 transition-transform hover:rotate-0 duration-500"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-4">
              Comprehensive Management Solution
            </h2>
            <p className="text-lg text-gray-600">
              Our platform offers a suite of powerful tools to streamline your organization's workflow and improve productivity.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <User className="h-6 w-6" />,
                title: "Employee & Recruitment",
                description: "Manage your workforce, track recruitment pipeline, and streamline onboarding process."
              },
              {
                icon: <Shield className="h-6 w-6" />,
                title: "Tasks & Document Management",
                description: "Assign tasks, track productivity, and organize documents in a centralized repository."
              },
              {
                icon: <BarChart className="h-6 w-6" />,
                title: "Analytics & Reporting",
                description: "Generate custom reports, analyze performance metrics, and make data-driven decisions."
              }
            ].map((feature, i) => (
              <div 
                key={feature.title}
                className="flex flex-col items-center text-center p-6 rounded-lg border bg-gray-50/50"
                style={featureStyles[i]}
              >
                <div className="bg-brand-red/10 text-brand-red p-3 rounded-lg mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")}
            >
              Get Started Today
            </Button>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-gray-400">© {new Date().getFullYear()} Your Company Name. All rights reserved.</p>
              <div className="flex justify-center md:justify-end gap-4 mt-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
