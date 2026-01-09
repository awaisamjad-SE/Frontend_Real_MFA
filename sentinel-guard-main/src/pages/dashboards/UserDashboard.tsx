import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Smartphone,
  MonitorSmartphone,
  ArrowRight,
  Lock,
  Activity,
  CheckCircle2
} from "lucide-react";

const quickActions = [
  {
    icon: Shield,
    title: "Security Settings",
    description: "Enable 2FA and manage security",
    path: "/user/security",
    color: "primary",
  },
  {
    icon: Smartphone,
    title: "Devices",
    description: "Manage trusted devices",
    path: "/user/devices",
  },
  {
    icon: MonitorSmartphone,
    title: "Sessions",
    description: "View active sessions",
    path: "/user/sessions",
  },
];

export default function UserDashboard() {
  const { user } = useAuth();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Welcome Section */}
      <div className="glass-card rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute inset-0 gradient-glow opacity-30" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.first_name || user?.username}! 👋
          </h1>
          <p className="text-muted-foreground">
            Your account is secured with enterprise-grade protection.
          </p>
          
          <div className="flex flex-wrap gap-4 mt-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success/10 border border-success/20">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-sm text-success">Account Verified</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
              <Lock className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary">Encrypted Session</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        {quickActions.map((action, index) => (
          <motion.div
            key={action.path}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={action.path}>
              <div className="glass-card rounded-xl p-6 hover:border-primary/30 transition-all group cursor-pointer h-full">
                <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center mb-4 group-hover:shadow-glow transition-shadow">
                  <action.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">{action.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{action.description}</p>
                <div className="flex items-center text-primary text-sm font-medium group-hover:gap-2 transition-all">
                  View
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Account Info */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Account Overview
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-secondary/30">
            <p className="text-sm text-muted-foreground mb-1">Username</p>
            <p className="font-medium">@{user?.username}</p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/30">
            <p className="text-sm text-muted-foreground mb-1">Email</p>
            <p className="font-medium truncate">{user?.email}</p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/30">
            <p className="text-sm text-muted-foreground mb-1">Account Type</p>
            <p className="font-medium capitalize">{user?.role || "User"}</p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/30">
            <p className="text-sm text-muted-foreground mb-1">Security</p>
            <p className="font-medium text-success">Protected</p>
          </div>
        </div>
      </div>

      {/* Security Tip */}
      <div className="glass-card rounded-xl p-6 border-l-4 border-l-primary">
        <h3 className="font-semibold mb-2">🔐 Security Tip</h3>
        <p className="text-sm text-muted-foreground">
          Enable Two-Factor Authentication (2FA) for an extra layer of security. 
          Even if someone gets your password, they won't be able to access your account.
        </p>
        <Link to="/user/security">
          <Button variant="link" className="px-0 mt-2 text-primary">
            Enable 2FA now
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
