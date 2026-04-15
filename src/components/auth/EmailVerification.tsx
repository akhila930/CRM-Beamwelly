import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useZoomIn } from "@/lib/animations";
import axios from "axios";
import { getApiBaseUrl } from "@/lib/runtimeConfig";

interface EmailVerificationProps {
  email: string;
}

export function EmailVerification({ email }: EmailVerificationProps) {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const zoomStyle = useZoomIn(100);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${getApiBaseUrl()}/api/auth/verify-email`, {
        email,
        otp,
      });

      if (response.data.success) {
        toast({
          title: "Success",
          description: response.data.message,
        });
        navigate("/auth", { state: { showLogin: true } });
      }
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.response?.data?.detail || "Failed to verify email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${getApiBaseUrl()}/api/auth/resend-otp`, {
        email,
      });

      if (response.data.success) {
        toast({
          title: "Success",
          description: response.data.message,
        });
      }
    } catch (error: any) {
      toast({
        title: "Failed to resend code",
        description: error.response?.data?.detail || "Could not resend verification code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg border" style={zoomStyle}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
        <CardDescription>
          Enter the verification code sent to {email}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={setOtp}
            className="flex justify-center"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>

          <Button 
            className="w-full" 
            onClick={handleVerify}
            disabled={isLoading || otp.length !== 6}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                <span>Verifying...</span>
              </div>
            ) : (
              "Verify Email"
            )}
          </Button>

          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleResendCode}
            disabled={isLoading}
          >
            Resend Code
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 