import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { profileService, passwordService } from "@/services/apiService";
import { getErrorMessage } from "@/services/api";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Save,
  CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const profileSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
  first_name: z.string().max(50).optional(),
  last_name: z.string().max(50).optional(),
});

const passwordSchema = z.object({
  current_password: z.string().min(1, "Current password is required"),
  new_password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase")
    .regex(/[a-z]/, "Must contain lowercase")
    .regex(/[0-9]/, "Must contain number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Must contain special character"),
  new_password_confirm: z.string(),
}).refine((data) => data.new_password === data.new_password_confirm, {
  message: "Passwords don't match",
  path: ["new_password_confirm"],
});

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Profile form
  const [profile, setProfile] = useState({
    username: user?.username || "",
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
  });

  // Password form
  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
    new_password_confirm: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setProfile({
        username: user.username || "",
        first_name: user.first_name || "",
        last_name: user.last_name || "",
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = profileSchema.safeParse(profile);
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
      const updated = await profileService.update(profile);
      updateUser(updated);
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved.",
      });
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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = passwordSchema.safeParse(passwords);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setPasswordLoading(true);

    try {
      await passwordService.change(passwords);
      setPasswords({
        current_password: "",
        new_password: "",
        new_password_confirm: "",
      });
      toast({
        title: "Password Changed",
        description: "Your password has been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setPasswordLoading(false);
    }
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
          <User className="h-6 w-6 text-primary" />
          Profile Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account information
        </p>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleProfileUpdate} className="glass-card rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold mb-4">Personal Information</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              value={profile.first_name}
              onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
              className="bg-secondary/50 border-border"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              value={profile.last_name}
              onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
              className="bg-secondary/50 border-border"
              disabled={loading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
            <Input
              id="username"
              value={profile.username}
              onChange={(e) => setProfile({ ...profile, username: e.target.value })}
              className="pl-8 bg-secondary/50 border-border"
              disabled={loading}
            />
          </div>
          {errors.username && (
            <p className="text-sm text-destructive">{errors.username}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              value={user?.email || ""}
              className="pl-10 bg-secondary/30 border-border"
              disabled
            />
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-success" />
          </div>
          <p className="text-xs text-muted-foreground">Email cannot be changed</p>
        </div>

        <Button
          type="submit"
          className="gradient-primary text-primary-foreground"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </form>

      {/* Password Form */}
      <form onSubmit={handlePasswordChange} className="glass-card rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Change Password
        </h2>

        <div className="space-y-2">
          <Label htmlFor="current_password">Current Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="current_password"
              type={showPassword ? "text" : "password"}
              value={passwords.current_password}
              onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })}
              className="pl-10 pr-10 bg-secondary/50 border-border"
              disabled={passwordLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.current_password && (
            <p className="text-sm text-destructive">{errors.current_password}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="new_password">New Password</Label>
          <Input
            id="new_password"
            type={showPassword ? "text" : "password"}
            value={passwords.new_password}
            onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
            className="bg-secondary/50 border-border"
            disabled={passwordLoading}
          />
          {errors.new_password && (
            <p className="text-sm text-destructive">{errors.new_password}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="new_password_confirm">Confirm New Password</Label>
          <Input
            id="new_password_confirm"
            type={showPassword ? "text" : "password"}
            value={passwords.new_password_confirm}
            onChange={(e) => setPasswords({ ...passwords, new_password_confirm: e.target.value })}
            className="bg-secondary/50 border-border"
            disabled={passwordLoading}
          />
          {errors.new_password_confirm && (
            <p className="text-sm text-destructive">{errors.new_password_confirm}</p>
          )}
        </div>

        <Button
          type="submit"
          variant="outline"
          disabled={passwordLoading}
        >
          {passwordLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Changing...
            </>
          ) : (
            "Change Password"
          )}
        </Button>
      </form>
    </motion.div>
  );
}
