import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { deviceService, Device } from "@/services/apiService";
import { getErrorMessage } from "@/services/api";
import {
  Smartphone,
  Monitor,
  Tablet,
  Trash2,
  Loader2,
  Shield,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
import { formatDistanceToNow } from "date-fns";

const getDeviceIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "mobile":
      return Smartphone;
    case "tablet":
      return Tablet;
    default:
      return Monitor;
  }
};

export default function Devices() {
  const { toast } = useToast();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const data = await deviceService.list();
      setDevices(data.devices);
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
    fetchDevices();
  }, []);

  const handleRevoke = async () => {
    if (!revokeId) return;
    
    setRevoking(true);
    try {
      await deviceService.revoke(revokeId);
      setDevices((prev) => prev.filter((d) => d.id !== revokeId));
      toast({
        title: "Device Revoked",
        description: "The device has been removed from your account.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setRevoking(false);
      setRevokeId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Smartphone className="h-6 w-6 text-primary" />
            Your Devices
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage devices that have access to your account
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchDevices}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Device List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : devices.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <Smartphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Devices Found</h3>
          <p className="text-muted-foreground">
            Devices will appear here once you log in from different locations.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {devices.map((device, index) => {
            const DeviceIcon = getDeviceIcon(device.device_type);
            return (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`glass-card rounded-xl p-5 ${
                  device.is_current ? "border-primary/30" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    device.is_current ? "gradient-primary" : "bg-secondary"
                  }`}>
                    <DeviceIcon className={`h-6 w-6 ${
                      device.is_current ? "text-primary-foreground" : "text-muted-foreground"
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{device.device_name}</h3>
                      {device.is_current && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary">
                          Current
                        </span>
                      )}
                      {device.is_trusted && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-success/20 text-success flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          Trusted
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Monitor className="h-3 w-3" />
                        {device.browser} on {device.os}
                      </span>
                      {device.city && device.country && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {device.city}, {device.country}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(device.last_used_at), { addSuffix: true })}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-3 text-sm">
                      {device.is_verified ? (
                        <span className="flex items-center gap-1 text-success">
                          <CheckCircle2 className="h-3 w-3" />
                          Verified
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-warning">
                          <AlertTriangle className="h-3 w-3" />
                          Unverified
                        </span>
                      )}
                      <span className="text-muted-foreground">
                        {device.total_logins} login{device.total_logins !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  
                  {!device.is_current && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setRevokeId(device.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Revoke Dialog */}
      <AlertDialog open={!!revokeId} onOpenChange={() => setRevokeId(null)}>
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Device Access</AlertDialogTitle>
            <AlertDialogDescription>
              This device will be logged out and will need to verify again to access your account.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              disabled={revoking}
              className="bg-destructive hover:bg-destructive/90"
            >
              {revoking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Revoking...
                </>
              ) : (
                "Revoke Access"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
