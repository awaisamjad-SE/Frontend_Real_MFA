import { useState, useEffect } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AuthCard } from "@/components/ui/auth-card";
import { Button } from "@/components/ui/button";
import { emailService } from "@/services/apiService";
import { getErrorMessage } from "@/services/api";
import { 
  Loader2, 
  Mail,
  CheckCircle2,
  RefreshCw,
  XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function VerifyEmail() {
  // Get uid and token from URL params: /verify-email/:uid/:token
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get email from location state (passed from registration)
  const { email } = (location.state as { email?: string }) || {};

  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resendCount, setResendCount] = useState(0);

  // Cooldown timer for resend (60 seconds)
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Auto-verify if uid and token are in URL
  useEffect(() => {
    if (uid && token && !verified && !verifying && !error) {
      handleVerify();
    }
  }, [uid, token]);

  const handleVerify = async () => {
    if (!uid || !token) return;
    
    setVerifying(true);
    setError(null);

    try {
      // Backend expects: POST /api/notifications/verify-email/ with { uid, token }
      await emailService.verify(uid, token);
      setVerified(true);
      toast({
        title: "Email Verified!",
        description: "Your account has been verified. You can now sign in.",
      });
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      toast({
        title: "Verification Failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email || cooldown > 0 || resendCount >= 4) return;
    
    setResending(true);

    try {
      // Backend: POST /api/notifications/resend-verification-email/
      // Rate limited: 60s cooldown, max 4 resends per hour
      await emailService.resendVerification(email);
      toast({
        title: "Email Sent!",
        description: "A new verification link has been sent to your email.",
      });
      setCooldown(60);
      setResendCount(prev => prev + 1);
    } catch (err) {
      toast({
        title: "Failed to Resend",
        description: getErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  // If no uid/token in URL - show "check your email" screen
  if (!uid || !token) {
    return (
      <AuthCard
        title="Verify Your Email"
        subtitle="We've sent you a verification link"
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          
          <div className="space-y-2">
            <p className="text-muted-foreground">
              We've sent a verification link to:
            </p>
            {email && (
              <p className="font-medium text-foreground">{email}</p>
            )}
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Please check your email and click the verification link.</p>
            <p>The link will expire in 24 hours.</p>
          </div>

          {email && (
            <div className="pt-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Didn't receive the email?
              </p>
              <Button
                variant="outline"
                onClick={handleResend}
                disabled={resending || cooldown > 0 || resendCount >= 4}
                className="w-full"
              >
                {resending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : cooldown > 0 ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resend in {cooldown}s
                  </>
                ) : resendCount >= 4 ? (
                  "Max resends reached (4/hour)"
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resend Verification Email
                  </>
                )}
              </Button>
              {resendCount > 0 && resendCount < 4 && (
                <p className="text-xs text-muted-foreground">
                  {4 - resendCount} resends remaining this hour
                </p>
              )}
            </div>
          )}

          <div className="pt-4">
            <Link to="/login" className="text-sm text-primary hover:underline">
              Back to Login
            </Link>
          </div>
        </motion.div>
      </AuthCard>
    );
  }

  // Verifying state
  if (verifying) {
    return (
      <AuthCard
        title="Verifying Email"
        subtitle="Please wait..."
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-6"
        >
          <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
          <p className="text-muted-foreground">
            Verifying your email address...
          </p>
        </motion.div>
      </AuthCard>
    );
  }

  // Success state
  if (verified) {
    return (
      <AuthCard
        title="Email Verified!"
        subtitle="Your account is now active"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          
          <div className="space-y-2">
            <p className="text-muted-foreground">
              Your email has been verified successfully.
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecting to login...
            </p>
          </div>

          <Link to="/login">
            <Button className="gradient-primary text-primary-foreground">
              Continue to Login
            </Button>
          </Link>
        </motion.div>
      </AuthCard>
    );
  }

  // Error state
  if (error) {
    return (
      <AuthCard
        title="Verification Failed"
        subtitle="Unable to verify your email"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          
          <div className="space-y-2">
            <p className="text-muted-foreground">{error}</p>
            <p className="text-sm text-muted-foreground">
              The verification link may have expired or is invalid.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              variant="outline"
              onClick={handleVerify}
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            
            <Link to="/register" className="block">
              <Button variant="ghost" className="w-full">
                Register Again
              </Button>
            </Link>
          </div>
        </motion.div>
      </AuthCard>
    );
  }

  return null;
}
