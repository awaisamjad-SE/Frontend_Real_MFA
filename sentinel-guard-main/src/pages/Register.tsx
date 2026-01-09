import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { z } from "zod";
import { AuthCard } from "@/components/ui/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDeviceData } from "@/context/AuthContext";
import { authService } from "@/services/apiService";
import { getErrorMessage } from "@/services/api";
import { 
  Loader2, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock,
  User,
  CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be less than 50 characters")
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Username must start with a letter and contain only letters, numbers, and underscores"),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character"),
  password2: z.string(),
}).refine((data) => data.password === data.password2, {
  message: "Passwords don't match",
  path: ["password2"],
});

export default function Register() {
  const navigate = useNavigate();
  const deviceData = useDeviceData();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    first_name: "",
    last_name: "",
    password: "",
    password2: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const result = registerSchema.safeParse(formData);
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

      // Backend expects: password2 and flat device_fingerprint_hash
      const response = await authService.register({
        email: formData.email,
        username: formData.username,
        password: formData.password,
        password2: formData.password2,
        device_fingerprint_hash: deviceData.fingerprint_hash,
      });

      setUserId(response.id);
      toast({
        title: "Registration Successful!",
        description: "Please check your email to verify your account.",
      });
      
      // Redirect to email verification
      navigate("/verify-email", { 
        state: { userId: response.id, email: formData.email } 
      });
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const passwordRequirements = [
    { test: (p: string) => p.length >= 8, text: "At least 8 characters" },
    { test: (p: string) => /[A-Z]/.test(p), text: "One uppercase letter" },
    { test: (p: string) => /[a-z]/.test(p), text: "One lowercase letter" },
    { test: (p: string) => /[0-9]/.test(p), text: "One number" },
    { test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p), text: "One special character" },
  ];

  return (
    <AuthCard
      title="Create Account"
      subtitle="Join us and secure your digital identity"
    >
      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              type="text"
              placeholder="John"
              value={formData.first_name}
              onChange={(e) => updateField("first_name", e.target.value)}
              className="bg-secondary/50 border-border focus:border-primary"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              type="text"
              placeholder="Doe"
              value={formData.last_name}
              onChange={(e) => updateField("last_name", e.target.value)}
              className="bg-secondary/50 border-border focus:border-primary"
              disabled={loading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="pl-10 bg-secondary/50 border-border focus:border-primary"
              disabled={loading}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="username"
              type="text"
              placeholder="johndoe"
              value={formData.username}
              onChange={(e) => updateField("username", e.target.value)}
              className="pl-10 bg-secondary/50 border-border focus:border-primary"
              disabled={loading}
            />
          </div>
          {errors.username && (
            <p className="text-sm text-destructive">{errors.username}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              value={formData.password}
              onChange={(e) => updateField("password", e.target.value)}
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
          
          {/* Password requirements */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            {passwordRequirements.map((req, index) => (
              <div
                key={index}
                className={`flex items-center gap-1.5 text-xs ${
                  req.test(formData.password) ? "text-success" : "text-muted-foreground"
                }`}
              >
                <CheckCircle2 className="h-3 w-3" />
                {req.text}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password2">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password2"
              type={showPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={formData.password2}
              onChange={(e) => updateField("password2", e.target.value)}
              className="pl-10 bg-secondary/50 border-border focus:border-primary"
              disabled={loading}
            />
          </div>
          {errors.password2 && (
            <p className="text-sm text-destructive">{errors.password2}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full gradient-primary text-primary-foreground hover:opacity-90 h-11"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </motion.form>
    </AuthCard>
  );
}
