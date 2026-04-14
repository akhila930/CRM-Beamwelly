import { useState } from "react";
import { Eye, EyeOff, UserPlus, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useZoomIn } from "@/lib/animations";
import { useAuth } from "@/contexts/AuthContext";
import { EmailVerification } from "./EmailVerification";

export function AdminSignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [numEmployees, setNumEmployees] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { toast } = useToast();
  const { signup, isLoading } = useAuth();
  const zoomStyle = useZoomIn(100);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!termsAccepted) {
      toast({
        title: "Terms & Conditions",
        description: "You must accept the terms and conditions to continue.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await signup(name, email, password, "admin", companyName, parseInt(numEmployees));
      setShowVerification(true);
    } catch (error) {
      // Error is already handled in AuthContext
    }
  };

  if (showVerification) {
    return <EmailVerification email={email} />;
  }

  return (
    <Card className="w-full max-w-md shadow-lg border" style={zoomStyle}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Admin Sign Up</CardTitle>
        <CardDescription>
          Create an admin account to manage the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              type="text"
              placeholder="Your Company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="numEmployees">Number of Employees</Label>
            <Input
              id="numEmployees"
              type="number"
              placeholder="e.g. 50"
              value={numEmployees}
              onChange={(e) => setNumEmployees(e.target.value)}
              required
              className="h-11"
              min={1}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Password must be at least 8 characters and include a number
            </p>
          </div>
          <div className="flex items-top space-x-2 mt-4">
            <Checkbox 
              id="terms" 
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(checked === true)}
            />
            <Label 
              htmlFor="terms" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              <div className="text-xs text-muted-foreground">
                I agree to the <a href="#" className="text-brand-red hover:underline">Terms of Service</a> and <a href="#" className="text-brand-red hover:underline">Privacy Policy</a>
              </div>
            </Label>
          </div>
          <Button type="submit" className="w-full h-11" disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                <span>Creating account...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                <span>Create Admin Account</span>
              </div>
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <a 
            href="#login" 
            className="text-brand-red hover:underline"
            onClick={(e) => {
              e.preventDefault();
              (document.querySelector('[value="login"]') as HTMLElement)?.click();
            }}
          >
            Login
          </a>
        </p>
      </CardFooter>
    </Card>
  );
} 