import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { sessionService, Session } from "@/services/apiService";
import { getErrorMessage } from "@/services/api";
import {
  MonitorSmartphone,
  Smartphone,
  Monitor,
  Tablet,
  Trash2,
  Loader2,
  MapPin,
  Clock,
  Activity,
  RefreshCw,
  AlertTriangle
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
import { formatDistanceToNow, format } from "date-fns";

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

export default function Sessions() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [revokeAll, setRevokeAll] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const data = await sessionService.list();
      setSessions(data.sessions);
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
    fetchSessions();
  }, []);

  const handleRevoke = async () => {
    if (!revokeId) return;
    
    setRevoking(true);
    try {
      await sessionService.revoke(revokeId);
      setSessions((prev) => prev.filter((s) => s.id !== revokeId));
      toast({
        title: "Session Revoked",
        description: "The session has been terminated.",
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

  const handleRevokeAll = async () => {
    setRevoking(true);
    try {
      await sessionService.revokeAll(false);
      setSessions((prev) => prev.filter((s) => s.is_current));
      toast({
        title: "Sessions Revoked",
        description: "All other sessions have been terminated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setRevoking(false);
      setRevokeAll(false);
    }
  };

  const otherSessions = sessions.filter((s) => !s.is_current);

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
            <MonitorSmartphone className="h-6 w-6 text-primary" />
            Active Sessions
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage your active sessions
          </p>
        </div>
        <div className="flex gap-2">
          {otherSessions.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => setRevokeAll(true)}
              className="gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              End All Others
            </Button>
          )}
          <Button
            variant="outline"
            onClick={fetchSessions}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Session List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <MonitorSmartphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Sessions Found</h3>
          <p className="text-muted-foreground">
            Your active sessions will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session, index) => {
            const DeviceIcon = getDeviceIcon(session.device_type);
            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`glass-card rounded-xl p-5 ${
                  session.is_current ? "border-primary/30" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    session.is_current ? "gradient-primary" : "bg-secondary"
                  }`}>
                    <DeviceIcon className={`h-6 w-6 ${
                      session.is_current ? "text-primary-foreground" : "text-muted-foreground"
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{session.device_name}</h3>
                      {session.is_current && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary">
                          Current Session
                        </span>
                      )}
                      {session.is_active && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-success/20 text-success flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          Active
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Monitor className="h-3 w-3" />
                        {session.browser} on {session.os}
                      </span>
                      {session.city && session.country && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {session.city}, {session.country}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Last active {formatDistanceToNow(new Date(session.last_activity), { addSuffix: true })}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span>Started: {format(new Date(session.created_at), "MMM d, yyyy 'at' h:mm a")}</span>
                      <span>Expires: {format(new Date(session.expires_at), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                  
                  {!session.is_current && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setRevokeId(session.id)}
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

      {/* Revoke Single Session Dialog */}
      <AlertDialog open={!!revokeId} onOpenChange={() => setRevokeId(null)}>
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle>End Session</AlertDialogTitle>
            <AlertDialogDescription>
              This session will be terminated immediately. The device will need to log in again.
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
                  Ending...
                </>
              ) : (
                "End Session"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke All Sessions Dialog */}
      <AlertDialog open={revokeAll} onOpenChange={() => setRevokeAll(false)}>
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle>End All Other Sessions</AlertDialogTitle>
            <AlertDialogDescription>
              All sessions except your current one will be terminated. Other devices will need to log in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeAll}
              disabled={revoking}
              className="bg-destructive hover:bg-destructive/90"
            >
              {revoking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ending...
                </>
              ) : (
                "End All Sessions"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
