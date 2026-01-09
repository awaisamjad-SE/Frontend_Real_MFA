import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { 
  Shield, 
  Fingerprint, 
  Smartphone, 
  Lock, 
  Eye,
  Key,
  ArrowRight,
  CheckCircle2,
  Zap,
  Globe
} from "lucide-react";

const features = [
  {
    icon: Fingerprint,
    title: "Device Fingerprinting",
    description: "Unique device identification for enhanced security and seamless access control.",
  },
  {
    icon: Smartphone,
    title: "TOTP Authentication",
    description: "Time-based one-time passwords for robust two-factor authentication.",
  },
  {
    icon: Key,
    title: "Backup Codes",
    description: "Recovery codes ensure you never lose access to your account.",
  },
  {
    icon: Eye,
    title: "Session Monitoring",
    description: "Track and manage all active sessions across your devices.",
  },
  {
    icon: Lock,
    title: "Device Trust",
    description: "Mark trusted devices for faster, frictionless authentication.",
  },
  {
    icon: Globe,
    title: "Geo-Location Tracking",
    description: "Monitor login locations and detect suspicious access attempts.",
  },
];

const stats = [
  { value: "99.9%", label: "Uptime" },
  { value: "256-bit", label: "Encryption" },
  { value: "< 100ms", label: "Auth Speed" },
  { value: "24/7", label: "Monitoring" },
];

export default function Landing() {
  const { isAuthenticated, loading, user } = useAuth();

  if (!loading && isAuthenticated) {
    const roleDashboards: Record<string, string> = {
      user: "/user/dashboard",
      manager: "/manager/dashboard",
      admin: "/admin/dashboard",
    };

    const target = user?.role ? roleDashboards[user.role] || "/user/dashboard" : "/user/dashboard";

    return <Navigate to={target} replace />;
  }

  return (
    <div className="min-h-screen bg-background security-grid">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">SecureAuth</span>
            </Link>
            
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button className="gradient-primary text-primary-foreground hover:opacity-90 transition-opacity">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 gradient-glow opacity-30" />
        <div className="absolute top-1/3 -left-64 w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -right-64 w-[500px] h-[500px] bg-accent/20 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">Enterprise-Grade Security</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Secure Your Apps with{" "}
              <span className="text-gradient">Multi-Factor Authentication</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Protect your users with advanced MFA, device tracking, and session management. 
              Built for modern applications that demand the highest security standards.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="gradient-primary text-primary-foreground hover:opacity-90 transition-opacity px-8 h-14 text-lg shadow-glow">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="h-14 text-lg border-border hover:bg-secondary">
                  View Demo
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20"
          >
            {stats.map((stat, index) => (
              <div key={index} className="glass-card rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-gradient mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Complete Security Suite
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to secure your application and protect your users.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass-card rounded-xl p-6 hover:border-primary/30 transition-colors group"
              >
                <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center mb-4 group-hover:shadow-glow transition-shadow">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Auth Flow Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Intelligent Authentication Flow
              </h2>
              <p className="text-muted-foreground mb-8">
                Our adaptive authentication system automatically adjusts security measures 
                based on device trust, location, and user behavior.
              </p>
              
              <ul className="space-y-4">
                {[
                  "Password-based primary authentication",
                  "Automatic new device detection",
                  "Email OTP for device verification",
                  "TOTP support with backup codes",
                  "Trusted device management",
                  "Real-time session monitoring",
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="glass-card rounded-2xl p-8"
            >
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">1</div>
                  <div>
                    <h4 className="font-semibold">User Login</h4>
                    <p className="text-sm text-muted-foreground">Email/username + password</p>
                  </div>
                </div>
                
                <div className="ml-5 w-0.5 h-6 bg-border" />
                
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">2</div>
                  <div>
                    <h4 className="font-semibold">Device Check</h4>
                    <p className="text-sm text-muted-foreground">Verify device fingerprint</p>
                  </div>
                </div>
                
                <div className="ml-5 w-0.5 h-6 bg-border" />
                
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center text-warning font-semibold">?</div>
                  <div>
                    <h4 className="font-semibold">MFA Required?</h4>
                    <p className="text-sm text-muted-foreground">New device or MFA enabled</p>
                  </div>
                </div>
                
                <div className="ml-5 w-0.5 h-6 bg-border" />
                
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center text-success font-semibold">✓</div>
                  <div>
                    <h4 className="font-semibold">Access Granted</h4>
                    <p className="text-sm text-muted-foreground">Secure session established</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="glass-card rounded-2xl p-12 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 gradient-glow opacity-30" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Secure Your Application?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Start protecting your users today with enterprise-grade multi-factor authentication.
              </p>
              <Link to="/register">
                <Button size="lg" className="gradient-primary text-primary-foreground hover:opacity-90 transition-opacity px-8 h-14 text-lg shadow-glow">
                  Get Started for Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-semibold">SecureAuth</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} SecureAuth. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
