import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";
import { AdminSignupForm } from "@/components/auth/AdminSignupForm";
import { useFadeIn } from "@/lib/animations";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

export default function Auth() {
  const fadeStyle = useFadeIn();
  const location = useLocation();
  const showLogin = location.state?.showLogin;

  useEffect(() => {
    // Clear the state after using it
    if (location.state?.showLogin) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="w-full max-w-md mb-8 text-center" style={fadeStyle}>
        {/* Removed logo */}
        {/* <img 
          src="/lovable-uploads/a4e99198-de20-47c1-bb2c-d61dc76aacf4.png" 
          alt="EquityWala" 
          className="w-64 mx-auto mb-6"
        /> */}
        <h1 className="text-2xl font-bold tracking-tight mb-2">Company Management System</h1>
        <p className="text-muted-foreground">Access your company portal</p>
      </div>

      <Tabs defaultValue={"login"} className="w-full max-w-md">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="login">User Login</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <LoginForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
