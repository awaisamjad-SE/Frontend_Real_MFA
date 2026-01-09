import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { OTPInput } from "@/components/ui/otp-input";
import { totpService, TOTPStatus, TOTPSetupResponse } from "@/services/apiService";
import { getErrorMessage } from "@/services/api";
import {
  Shield,
  Smartphone,
  Key,
  Loader2,
  QrCode,
  Copy,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function SecuritySettings() {
  const { toast } = useToast();

  const [status, setStatus] = useState<TOTPStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupData, setSetupData] = useState<TOTPSetupResponse | null>(null);
  const [setupOpen, setSetupOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [regenerateOpen, setRegenerateOpen] = useState(false);
  const [backupCodesOpen, setBackupCodesOpen] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  
  const [verifyCode, setVerifyCode] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showSetupPassword, setShowSetupPassword] = useState(false);
  const [processing, setProcessing] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const data = await totpService.getStatus();
      setStatus(data);
    } catch (error) {
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSetup = async () => {
    if (!setupPassword) {
      toast({
        title: "Password Required",
        description: "Please enter your password to continue.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const data = await totpService.setup(setupPassword);
      console.log("Setup response:", data);
      setSetupData(data);
      setPasswordDialogOpen(false);
      setSetupOpen(true);
      setSetupPassword("");
    } catch (error) {
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleVerify = async () => {
    if (verifyCode.length !== 6) return;
    
    setProcessing(true);
    try {
      const result = await totpService.verify(verifyCode);
      setBackupCodes(result.backup_codes);
      setSetupOpen(false);
      setBackupCodesOpen(true);
      setVerifyCode("");
      await fetchStatus();
      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication is now active.",
      });
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
      setVerifyCode("");
    } finally {
      setProcessing(false);
    }
  };

  const handleDisable = async () => {
    if (!password) return;
    
    setProcessing(true);
    try {
      await totpService.disable(password);
      setDisableOpen(false);
      setPassword("");
      await fetchStatus();
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been turned off.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRegenerate = async () => {
    if (!password) return;
    
    setProcessing(true);
    try {
      const result = await totpService.regenerateBackupCodes(password);
      setBackupCodes(result.backup_codes);
      setRegenerateOpen(false);
      setBackupCodesOpen(true);
      setPassword("");
      await fetchStatus();
      toast({
        title: "Backup Codes Regenerated",
        description: "Save these new codes securely.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Copied to clipboard.",
    });
  };

  const downloadBackupCodes = () => {
    const content = backupCodes.join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-2xl"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Security Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account security and two-factor authentication
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* 2FA Status */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  status?.mfa_enabled ? "gradient-primary" : "bg-secondary"
                }`}>
                  <Smartphone className={`h-6 w-6 ${
                    status?.mfa_enabled ? "text-primary-foreground" : "text-muted-foreground"
                  }`} />
                </div>
                <div>
                  <h3 className="font-semibold">Two-Factor Authentication</h3>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {status?.mfa_enabled ? (
                  <span className="flex items-center gap-1 text-sm text-success">
                    <CheckCircle2 className="h-4 w-4" />
                    Enabled
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-sm text-warning">
                    <AlertTriangle className="h-4 w-4" />
                    Disabled
                  </span>
                )}
                <Switch
                  checked={status?.mfa_enabled || false}
                  onCheckedChange={(checked) => {
                    if (checked) setPasswordDialogOpen(true);
                    else setDisableOpen(true);
                  }}
                  disabled={processing}
                />
              </div>
            </div>

            {status?.mfa_enabled && (
              <div className="border-t border-border pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Backup Codes Remaining</span>
                  </div>
                  <span className={`text-sm font-medium ${
                    (status.backup_codes_remaining || 0) < 3 ? "text-warning" : "text-foreground"
                  }`}>
                    {status.backup_codes_remaining || 0} / 10
                  </span>
                </div>
                
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setRegenerateOpen(true)}
                >
                  <RefreshCw className="h-4 w-4" />
                  Regenerate Backup Codes
                </Button>
              </div>
            )}
          </div>

          {/* Security Tips */}
          <div className="glass-card rounded-xl p-6 border-l-4 border-l-primary">
            <h3 className="font-semibold mb-2">🔐 Security Tips</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Use a password manager to generate and store strong passwords</li>
              <li>• Enable 2FA for maximum account protection</li>
              <li>• Store backup codes in a secure, offline location</li>
              <li>• Regularly review your active sessions and devices</li>
            </ul>
          </div>
        </>
      )}

      {/* Password Dialog for Setup */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="glass-card max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Your Password</DialogTitle>
            <DialogDescription>
              Enter your password to set up two-factor authentication
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="setup-password">Password</Label>
              <div className="relative">
                <Input
                  id="setup-password"
                  type={showSetupPassword ? "text" : "password"}
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={processing}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSetupPassword(!showSetupPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showSetupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPasswordDialogOpen(false);
                setSetupPassword("");
              }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSetup}
              disabled={processing || !setupPassword}
              className="gradient-primary text-primary-foreground"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Setup Dialog */}
      <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
        <DialogContent className="glass-card max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Set Up Authenticator
            </DialogTitle>
            <DialogDescription>
              Scan this QR code with your authenticator app
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {setupData?.secret && (
              <div className="flex justify-center p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <QRCodeSVG 
                  value={`otpauth://totp/Real%20MFA:${setupData.secret}?secret=${setupData.secret}&issuer=Real%20MFA`}
                  size={192}
                  level="H"
                  includeMargin={true}
                  bgColor="transparent"
                  fgColor="currentColor"
                  className="text-gray-900 dark:text-white"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <p className="text-sm text-center text-muted-foreground">
                Or enter this secret key manually:
              </p>
              <div className="flex items-center gap-2">
                <Input
                  value={setupData?.secret || ""}
                  readOnly
                  className="font-mono text-center tracking-wider bg-secondary/50"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(setupData?.secret || "")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Enter the 6-digit code from your app</Label>
              <OTPInput
                value={verifyCode}
                onChange={setVerifyCode}
                disabled={processing}
              />
            </div>

            <Button
              className="w-full gradient-primary text-primary-foreground"
              onClick={handleVerify}
              disabled={processing || verifyCode.length !== 6}
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify & Enable"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Disable Dialog */}
      <AlertDialog open={disableOpen} onOpenChange={setDisableOpen}>
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Two-Factor Authentication</AlertDialogTitle>
            <AlertDialogDescription>
              This will make your account less secure. Enter your password to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <Label htmlFor="disable-password">Password</Label>
            <div className="relative mt-2">
              <Input
                id="disable-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10 bg-secondary/50"
                disabled={processing}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing} onClick={() => setPassword("")}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisable}
              disabled={processing || !password}
              className="bg-destructive hover:bg-destructive/90"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Disabling...
                </>
              ) : (
                "Disable 2FA"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Regenerate Dialog */}
      <AlertDialog open={regenerateOpen} onOpenChange={setRegenerateOpen}>
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate Backup Codes</AlertDialogTitle>
            <AlertDialogDescription>
              This will invalidate all existing backup codes. Enter your password to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <Label htmlFor="regen-password">Password</Label>
            <div className="relative mt-2">
              <Input
                id="regen-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10 bg-secondary/50"
                disabled={processing}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing} onClick={() => setPassword("")}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRegenerate}
              disabled={processing || !password}
              className="gradient-primary text-primary-foreground"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                "Regenerate Codes"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Backup Codes Dialog */}
      <Dialog open={backupCodesOpen} onOpenChange={setBackupCodesOpen}>
        <DialogContent className="glass-card max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Your Backup Codes
            </DialogTitle>
            <DialogDescription>
              Save these codes securely. Each code can only be used once.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, index) => (
                <div
                  key={index}
                  className="p-2 bg-secondary/50 rounded font-mono text-sm text-center"
                >
                  {code}
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => copyToClipboard(backupCodes.join("\n"))}
              >
                <Copy className="h-4 w-4" />
                Copy All
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={downloadBackupCodes}
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              ⚠️ Store these codes in a secure location. You won't be able to see them again.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
