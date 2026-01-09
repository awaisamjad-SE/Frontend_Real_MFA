import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AuthCard } from "@/components/ui/auth-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { OTPInput } from "@/components/ui/otp-input";
import { useAuth } from "@/context/AuthContext";
import { deviceService, otpService } from "@/services/apiService";
import { getErrorMessage } from "@/services/api";
import { 
  Loader2, 
  Smartphone,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LocationState {
  user_id?: string;
  fingerprint_hash?: string;
  email?: string;
  email_hint?: string;
  otp_expires_at?: string;
}

export default function VerifyDevice() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();

  const state = (location.state as LocationState) || {};
  const { user_id, fingerprint_hash, email, email_hint, otp_expires_at } = state;

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(true);
  const [trustDays, setTrustDays] = useState(30);
  const [cooldown, setCooldown] = useState(0);

  // Cooldown timer for resend
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleVerify = async () => {
    if (!user_id || !fingerprint_hash || otpCode.length !== 6) return;
    
    setLoading(true);

    try {
      // Backend expects: { user_id, otp_code, fingerprint_hash, trust_device, trust_days }
      const response = await deviceService.verify({
        user_id,
        otp_code: otpCode,
        fingerprint_hash,
        trust_device: trustDevice,
        trust_days: trustDevice ? trustDays : undefined,
      });

      // If tokens returned, log user in directly
      if (response.status === "success" && response.tokens && response.user) {
        setVerified(true);
        toast({
          title: "Device Verified!",
          description: "Your device has been verified successfully.",
        });
        
        login(response.user, response.tokens.access, response.tokens.refresh);
        
        // Role-based redirect
        setTimeout(() => {
          const role = response.user?.role;
          if (role === 'admin') {
            navigate('/admin/dashboard', { replace: true });
          } else if (role === 'manager') {
            navigate('/manager/dashboard', { replace: true });
          } else {
            navigate('/user/dashboard', { replace: true });
          }
        }, 1500);
      } else if (response.status === "mfa_required") {
        // Device verified but MFA is still required
        navigate('/login', {
          state: { 
            mfa_required: true,
            user_id: response.user_id,
            fingerprint_hash: response.fingerprint_hash
          },
          replace: true
        });
      }
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
      setOtpCode("");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!user_id || !fingerprint_hash || cooldown > 0) return;
    
    setResending(true);

    try {
      await otpService.resendDevice(user_id, fingerprint_hash);
      toast({
        title: "Code Sent!",
        description: "A new verification code has been sent to your email.",
      });
      setCooldown(60); // 60 second cooldown
    } catch (error) {
      toast({
        title: "Failed to Resend",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  // Use email_hint from API response, or mask the email
  const maskedEmail = email_hint || (email ? email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : null);

  if (!user_id || !fingerprint_hash) {
    return (
      <AuthCard
        title="Device Verification"
        subtitle="Something went wrong"
      >
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            Missing required information. Please try logging in again.
          </p>
          <Link to="/login">
            <Button className="gradient-primary text-primary-foreground">
              Back to Login
            </Button>
          </Link>
        </div>
      </AuthCard>
    );
  }

  if (verified) {
    return (
      <AuthCard
        title="Device Verified!"
        subtitle="Your device is now trusted"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-success" />
          </div>
          <p className="text-muted-foreground text-center">
            Redirecting you to your dashboard...
          </p>
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </motion.div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Verify Your Device"
      subtitle={maskedEmail ? `We sent a code to ${maskedEmail}` : "Enter the verification code from your email"}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <Smartphone className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="bg-secondary/30 border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground text-center">
            We detected a login from a new device. For your security, please enter the 6-digit code we sent to your email.
          </p>
        </div>

        <div className="space-y-4">
          <OTPInput
            value={otpCode}
            onChange={setOtpCode}
            disabled={loading}
          />

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="trustDevice"
                checked={trustDevice}
                onCheckedChange={(checked) => setTrustDevice(checked === true)}
              />
              <Label htmlFor="trustDevice" className="text-sm text-muted-foreground cursor-pointer">
                Trust this device
              </Label>
            </div>

            {trustDevice && (
              <div className="ml-6">
                <Label className="text-xs text-muted-foreground mb-2 block">Trust duration</Label>
                <div className="flex gap-2 flex-wrap">
                  {[7, 30, 60, 90].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setTrustDays(days)}
                      className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                        trustDays === days
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-secondary/50 border-border hover:border-primary/50'
                      }`}
                    >
                      {days} days
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={handleVerify}
            className="w-full gradient-primary text-primary-foreground hover:opacity-90 h-11"
            disabled={loading || otpCode.length !== 6}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Device"
            )}
          </Button>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Didn't receive the code?
          </p>
          <Button
            variant="ghost"
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="text-primary hover:text-primary/80"
          >
            {resending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : cooldown > 0 ? (
              <>Resend in {cooldown}s</>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Resend Code
              </>
            )}
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="text-primary hover:underline">
            Back to login
          </Link>
        </p>
      </motion.div>
    </AuthCard>
  );
}
