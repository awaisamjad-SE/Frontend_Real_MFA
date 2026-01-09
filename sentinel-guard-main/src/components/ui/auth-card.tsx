import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";

interface AuthCardProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
}

export function AuthCard({ children, title, subtitle, className }: AuthCardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background security-grid relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 gradient-glow opacity-50" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn(
          "w-full max-w-md relative z-10",
          className
        )}
      >
        <div className="glass-card rounded-2xl p-8 shadow-xl">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex justify-center mb-6"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-full gradient-primary opacity-20 blur-xl" />
              <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center relative shadow-glow">
                <Shield className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="text-center mb-8"
          >
            <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
            {subtitle && (
              <p className="text-muted-foreground text-sm">{subtitle}</p>
            )}
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            {children}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
