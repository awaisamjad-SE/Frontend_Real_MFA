import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { AuthCard } from "@/components/ui/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { OTPInput } from "@/components/ui/otp-input";
import { useAuth, useDeviceData } from "@/context/AuthContext";
import { authService, otpService } from "@/services/apiService";
import { getErrorMessage } from "@/services/api";
import { 
  Loader2, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock,
  Shield,
  ArrowLeft,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

interface MFAData {
  user_id: string;
  fingerprint_hash: string;
}

interface LocationState {
  from?: { pathname: string };
  mfa_required?: boolean;
  user_id?: string;
  fingerprint_hash?: string;
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user, loading: authLoading } = useAuth();
  const deviceData = useDeviceData();
  const { toast } = useToast();

  const locationState = location.state as LocationState | null;

  // If user is already authenticated and tries to visit the login page,
  // redirect them to their appropriate dashboard (or the "from" route).
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const redirect = getRoleBasedRedirect(user?.role || "user");
      const from = locationState?.from?.pathname;
      navigate(from || redirect, { replace: true });
    }
  }, [authLoading, isAuthenticated, user, navigate, locationState]);

  // Check if coming back from device verification with MFA required
  const [showMFA, setShowMFA] = useState(locationState?.mfa_required || false);
  const [mfaData, setMfaData] = useState<MFAData | null>(
    locationState?.mfa_required && locationState.user_id && locationState.fingerprint_hash
      ? { user_id: locationState.user_id, fingerprint_hash: locationState.fingerprint_hash }
      : null
  );

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form data
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberDevice, setRememberDevice] = useState(true);
  
  // MFA data
  const [otpCode, setOtpCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Clear location state after reading
  useEffect(() => {
    if (locationState?.mfa_required) {
      window.history.replaceState({}, document.title);
    }
  }, [locationState]);

  const getRoleBasedRedirect = (role: string) => {
    switch (role) {
      case 'admin':
        return '/admin/dashboard';
      case 'manager':
        return '/manager/dashboard';
      default:
        return '/user/dashboard';
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const result = loginSchema.safeParse({ identifier, password });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    
    setErrors({});
    setLoading(true);

    try {
      if (!deviceData) {
        throw new Error("Device data not available. Please try again.");
      }

      // Store device fingerprint for MFA verification
      localStorage.setItem('device_fingerprint', deviceData.fingerprint_hash);

      // Send both nested and flat device fields for backend compatibility.
      const response = await authService.login({
        identifier,
        password,
        device_fingerprint: deviceData.fingerprint_hash,
        device_name: deviceData.device_name,
        device_type: deviceData.device_type,
        browser: deviceData.browser,
        os: deviceData.os,
        device: {
          fingerprint_hash: deviceData.fingerprint_hash,
          device_type: deviceData.device_type,
          browser: deviceData.browser,
          os: deviceData.os,
          device_name: deviceData.device_name,
        },
      });

      // Scenario 1: Success (HTTP 200) with tokens
      if (response.status === "success" && response.tokens && response.user) {
        login(response.user, response.tokens.access, response.tokens.refresh);
        
        // Store device ID if provided
        if (response.device?.id) {
          localStorage.setItem('current_device_id', response.device.id);
        }
        
        // Clean up pending data
        localStorage.removeItem('mfa_user_id');
        localStorage.removeItem('pending_user_id');
        
        const from = locationState?.from?.pathname || getRoleBasedRedirect(response.user.role);
        navigate(from, { replace: true });
        return;
      }
      
      // Scenario: Device Verification Required (HTTP 202)
      if (response.status === "device_verification_required") {
        localStorage.setItem('pending_device_verification', identifier);
        localStorage.setItem('pending_user_id', response.user_id || '');
        if (response.fingerprint_hash) {
          localStorage.setItem('fingerprint_hash', response.fingerprint_hash);
        }
        toast({
          title: "New Device Detected",
          description: response.message || "Please verify with the OTP sent to your email.",
        });
        navigate('/verify-device', {
          state: {
            user_id: response.user_id,
            fingerprint_hash: response.fingerprint_hash || deviceData.fingerprint_hash,
            email: identifier,
            email_hint: response.email_hint,
            otp_expires_at: response.otp_expires_at,
          },
          replace: true,
        });
        return;
      }
      
      // Scenario: MFA Required (HTTP 202)
      if (response.status === "mfa_required") {
        localStorage.setItem('mfa_user_id', response.user_id || '');
        localStorage.setItem('pending_user_id', response.user_id || '');
        if (response.fingerprint_hash) {
          localStorage.setItem('fingerprint_hash', response.fingerprint_hash);
        }
        setMfaData({
          user_id: response.user_id || "",
          fingerprint_hash: response.fingerprint_hash || deviceData.fingerprint_hash,
        });
        setShowMFA(true);
        toast({
          title: "MFA Required",
          description: "Please enter your authenticator code.",
        });
        return;
      }

      // Scenario: Email Not Verified
      if (response.status === "email_not_verified") {
        localStorage.setItem('pending_verification_email', identifier);
        localStorage.setItem('pending_user_id', response.user_id || '');
        navigate('/verify-email', {
          state: {
            userId: response.user_id,
            email: identifier,
          },
          replace: true,
        });
        return;
      }

      // Default to MFA if user_id is present but status not specified
      if (response.user_id) {
        localStorage.setItem('mfa_user_id', response.user_id);
        localStorage.setItem('pending_user_id', response.user_id);
        if (response.fingerprint_hash) {
          localStorage.setItem('fingerprint_hash', response.fingerprint_hash);
        }
        setMfaData({
          user_id: response.user_id,
          fingerprint_hash: response.fingerprint_hash || deviceData.fingerprint_hash,
        });
        setShowMFA(true);
        return;
      }

      // Handle other error scenarios
      toast({
        title: "Login Failed",
        description: response.message || "Login failed. Please try again.",
        variant: "destructive",
      });
    } catch (error: any) {
      // Handle error responses that might contain verification requirements
      const errorData = error.response?.data || {};
      
      // Check for verification required in error response
      if (errorData.status === 'device_verification_required' || errorData.new_device === true || errorData.requires_device_verification) {
        localStorage.setItem('pending_device_verification', identifier);
        localStorage.setItem('device_fingerprint', deviceData?.fingerprint_hash || '');
        localStorage.setItem('pending_user_id', errorData.user_id || '');
        if (errorData.fingerprint_hash) {
          localStorage.setItem('fingerprint_hash', errorData.fingerprint_hash);
        }
        navigate('/verify-device', {
          state: {
            user_id: errorData.user_id,
            fingerprint_hash: errorData.fingerprint_hash,
            email: identifier,
          },
          replace: true,
        });
        return;
      }
      
      // Check for MFA required in error response
      if (errorData.status === 'mfa_required') {
        localStorage.setItem('mfa_user_id', errorData.user_id || '');
        localStorage.setItem('pending_user_id', errorData.user_id || '');
        if (errorData.fingerprint_hash) {
          localStorage.setItem('fingerprint_hash', errorData.fingerprint_hash);
        }
        setMfaData({
          user_id: errorData.user_id || "",
          fingerprint_hash: errorData.fingerprint_hash || deviceData?.fingerprint_hash || "",
        });
        setShowMFA(true);
        toast({
          title: "MFA Required",
          description: "Please enter your authenticator code.",
        });
        return;
      }

      // Check for email verification required
      if (errorData.email_verified === false || errorData.status === 'email_not_verified' ||
          (errorData.message && errorData.message.toLowerCase().includes('email not verified'))) {
        localStorage.setItem('pending_verification_email', identifier);
        localStorage.setItem('pending_user_id', errorData.user_id || '');
        navigate('/verify-email', {
          state: {
            userId: errorData.user_id,
            email: identifier,
          },
          replace: true,
        });
        return;
      }

      // Default error handling
      toast({
        title: "Login Failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMFASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get MFA data from state or localStorage fallback
    const currentUserId = mfaData?.user_id || localStorage.getItem('mfa_user_id') || '';
    const fingerprintHash = mfaData?.fingerprint_hash || localStorage.getItem('device_fingerprint') || localStorage.getItem('fingerprint_hash') || '';
    
    if (!currentUserId) {
      toast({
        title: "Error",
        description: "Session expired. Please login again.",
        variant: "destructive",
      });
      goBack();
      return;
    }
    
    // Validate input
    if (useBackupCode && !backupCode) {
      toast({
        title: "Error",
        description: "Please enter a backup code",
        variant: "destructive",
      });
      return;
    }
    if (!useBackupCode && otpCode.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await authService.verifyMFA({
        user_id: currentUserId,
        fingerprint_hash: fingerprintHash,
        totp_code: useBackupCode ? undefined : otpCode,
        backup_code: useBackupCode ? backupCode.replace(/-/g, '') : undefined,
        trust_device: rememberDevice,
        trust_days: 30,
      });

      if ((response.status === "success" || response.tokens) && response.tokens && response.user) {
        login(response.user, response.tokens.access, response.tokens.refresh);
        
        // Store device ID if provided
        if (response.device?.id) {
          localStorage.setItem('current_device_id', response.device.id);
        }
        
        // Clean up MFA related localStorage
        localStorage.removeItem('mfa_user_id');
        localStorage.removeItem('pending_user_id');
        localStorage.removeItem('fingerprint_hash');
        
        navigate(getRoleBasedRedirect(response.user.role), { replace: true });
      } else {
        toast({
          title: "Verification Failed",
          description: response.message || "MFA verification failed",
          variant: "destructive",
        });
        setOtpCode("");
        setBackupCode("");
      }
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
      setOtpCode("");
      setBackupCode("");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setShowMFA(false);
    setMfaData(null);
    setOtpCode("");
    setBackupCode("");
    setUseBackupCode(false);
    // Clean up localStorage like mfa_frontend
    localStorage.removeItem('mfa_user_id');
    localStorage.removeItem('fingerprint_hash');
  };

  return (
    <AuthCard
      title={showMFA ? "Two-Factor Authentication" : "Welcome Back"}
      subtitle={showMFA ? "Enter the code from your authenticator app" : "Sign in to your secure account"}
    >
      <AnimatePresence mode="wait">
        {!showMFA && (
          <motion.form
            key="credentials"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onSubmit={handleCredentialsSubmit}
            className="space-y-5"
          >
            <div className="space-y-2">
              <Label htmlFor="identifier">Email or Username</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="identifier"
                  type="text"
                  placeholder="Enter your email or username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="pl-10 bg-secondary/50 border-border focus:border-primary"
                  disabled={loading}
                />
              </div>
              {errors.identifier && (
                <p className="text-sm text-destructive">{errors.identifier}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-secondary/50 border-border focus:border-primary"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>


            <Button
              type="submit"
              className="w-full gradient-primary text-primary-foreground hover:opacity-90 h-11"
              disabled={loading || !deviceData}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </motion.form>
        )}

        {showMFA && (
          <motion.form
            key="mfa"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleMFASubmit}
            className="space-y-6"
          >
            <button
              type="button"
              onClick={goBack}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </button>

            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>

            {!useBackupCode && (
              <div className="space-y-4">
                <OTPInput
                  value={otpCode}
                  onChange={setOtpCode}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setUseBackupCode(true)}
                  className="text-sm text-muted-foreground hover:text-primary w-full text-center"
                >
                  Use a backup code instead
                </button>
              </div>
            )}

            {useBackupCode && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="backup">Backup Code</Label>
                  <Input
                    id="backup"
                    type="text"
                    placeholder="Enter backup code"
                    value={backupCode}
                    onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                    className="text-center uppercase tracking-widest bg-secondary/50 border-border"
                    disabled={loading}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setUseBackupCode(false)}
                  className="text-sm text-muted-foreground hover:text-primary w-full text-center"
                >
                  Use authenticator app instead
                </button>
              </div>
            )}


            <Button
              type="submit"
              className="w-full gradient-primary text-primary-foreground hover:opacity-90 h-11"
              disabled={loading || (useBackupCode ? !backupCode : otpCode.length !== 6)}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify"
              )}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthCard>
  );
}