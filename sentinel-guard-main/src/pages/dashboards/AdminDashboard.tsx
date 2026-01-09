import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { adminUsersService, adminMfaService, AdminUserSummary, AdminMfaDetails, AdminMfaComplianceReport } from "@/services/apiService";
import {
  Shield,
  Users,
  Activity,
  Settings,
  Smartphone,
  MonitorSmartphone,
  ArrowRight,
  Lock,
  BarChart3,
} from "lucide-react";

const adminQuickActions = [
  {
    icon: Settings,
    title: "Security Settings",
    description: "Review and enforce global security policies",
    path: "/admin/security",
  },
  {
    icon: Smartphone,
    title: "Devices",
    description: "Monitor trusted devices across users",
    path: "/admin/devices",
  },
  {
    icon: MonitorSmartphone,
    title: "Sessions",
    description: "Inspect active sessions and revoke access",
    path: "/admin/sessions",
  },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Users list state
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const usersQuery = useQuery({
    queryKey: ["admin-users", page],
    queryFn: () => adminUsersService.list(page, pageSize),
    keepPreviousData: true,
  });

  const [selectedUser, setSelectedUser] = useState<AdminUserSummary | null>(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [userMfaDetails, setUserMfaDetails] = useState<AdminMfaDetails | null>(null);
  const [userAuditEvents, setUserAuditEvents] = useState<any[] | null>(null);
  const [userActionsLoading, setUserActionsLoading] = useState(false);

  const [bulkUserIds, setBulkUserIds] = useState("");
  const [bulkReason, setBulkReason] = useState("");
  const [bulkMethod, setBulkMethod] = useState("totp");

  const [complianceReport, setComplianceReport] = useState<AdminMfaComplianceReport | null>(null);
  const [policyJson, setPolicyJson] = useState<string>("");
  const [policyLoading, setPolicyLoading] = useState(false);

  const openUserDialog = async (userRow: AdminUserSummary) => {
    setSelectedUser(userRow);
    setUserDialogOpen(true);
    try {
      setUserActionsLoading(true);
      const [mfa, audit] = await Promise.all([
        adminMfaService.getUserMfaDetails(userRow.id),
        adminMfaService.getUserMfaAuditHistory(userRow.id),
      ]);
      setUserMfaDetails(mfa);
      // backend can return { events: [...] } or an array directly
      // normalize to array
      // @ts-expect-error - tolerant of unknown shape
      const events = (audit as any).events ?? audit;
      setUserAuditEvents(Array.isArray(events) ? events : []);
    } catch {
      toast({ title: "Failed to load user MFA data", variant: "destructive" });
    } finally {
      setUserActionsLoading(false);
    }
  };

  const handleSoftDelete = async (userId: string) => {
    try {
      setUserActionsLoading(true);
      await adminUsersService.softDelete(userId);
      toast({ title: "User soft-deleted" });
      usersQuery.refetch();
    } catch {
      toast({ title: "Failed to delete user", variant: "destructive" });
    } finally {
      setUserActionsLoading(false);
    }
  };

  const handleRestore = async (userId: string) => {
    try {
      setUserActionsLoading(true);
      await adminUsersService.restore(userId);
      toast({ title: "User restored" });
      usersQuery.refetch();
    } catch {
      toast({ title: "Failed to restore user", variant: "destructive" });
    } finally {
      setUserActionsLoading(false);
    }
  };

  const handleResetMfa = async () => {
    if (!selectedUser) return;
    try {
      setUserActionsLoading(true);
      await adminMfaService.resetUserMfa(selectedUser.id, {
        reason: "Reset via admin dashboard",
        notify_user: true,
      });
      toast({ title: "MFA reset for user" });
      const details = await adminMfaService.getUserMfaDetails(selectedUser.id);
      setUserMfaDetails(details);
    } catch {
      toast({ title: "Failed to reset MFA", variant: "destructive" });
    } finally {
      setUserActionsLoading(false);
    }
  };

  const handleForceEnableMfa = async () => {
    if (!selectedUser) return;
    try {
      setUserActionsLoading(true);
      await adminMfaService.forceEnableMfa(selectedUser.id, {
        method: "totp",
        reason: "Enforced by admin dashboard",
      });
      toast({ title: "MFA required for user" });
      const details = await adminMfaService.getUserMfaDetails(selectedUser.id);
      setUserMfaDetails(details);
    } catch {
      toast({ title: "Failed to force enable MFA", variant: "destructive" });
    } finally {
      setUserActionsLoading(false);
    }
  };

  const handleForceDisableMfa = async () => {
    if (!selectedUser) return;
    try {
      setUserActionsLoading(true);
      await adminMfaService.forceDisableMfa(selectedUser.id, {
        reason: "Temporarily disabled via admin dashboard",
      });
      toast({ title: "MFA disabled for user" });
      const details = await adminMfaService.getUserMfaDetails(selectedUser.id);
      setUserMfaDetails(details);
    } catch {
      toast({ title: "Failed to force disable MFA", variant: "destructive" });
    } finally {
      setUserActionsLoading(false);
    }
  };

  const handleEmergencyCodes = async () => {
    if (!selectedUser) return;
    try {
      setUserActionsLoading(true);
      const res: any = await adminMfaService.generateEmergencyCodes(selectedUser.id);
      toast({ title: "Emergency codes generated" });
      if (res?.codes) {
        setUserMfaDetails((prev) => ({ ...(prev || {}), emergency_codes: res.codes }));
      }
    } catch {
      toast({ title: "Failed to generate codes", variant: "destructive" });
    } finally {
      setUserActionsLoading(false);
    }
  };

  const handleRevokeDevices = async () => {
    if (!selectedUser) return;
    try {
      setUserActionsLoading(true);
      await adminMfaService.revokeTrustedDevices(selectedUser.id);
      toast({ title: "Trusted devices revoked" });
    } catch {
      toast({ title: "Failed to revoke devices", variant: "destructive" });
    } finally {
      setUserActionsLoading(false);
    }
  };

  const handleEmergencyBypass = async () => {
    if (!selectedUser) return;
    try {
      setUserActionsLoading(true);
      await adminMfaService.emergencyBypass(selectedUser.id, {
        duration_hours: 24,
        reason: "Emergency access via admin dashboard",
      });
      toast({ title: "Emergency MFA bypass granted" });
    } catch {
      toast({ title: "Failed to create bypass", variant: "destructive" });
    } finally {
      setUserActionsLoading(false);
    }
  };

  const handleLoadCompliance = async () => {
    try {
      const report = await adminMfaService.getComplianceReport();
      setComplianceReport(report);
      toast({ title: "Compliance report loaded" });
    } catch {
      toast({ title: "Failed to load compliance report", variant: "destructive" });
    }
  };

  const parseUserIdsInput = (): string[] => {
    return bulkUserIds
      .split(/[\n,]+/)
      .map((id) => id.trim())
      .filter(Boolean);
  };

  const handleBulkEnable = async () => {
    const ids = parseUserIdsInput();
    if (!ids.length) {
      toast({ title: "No user IDs provided", variant: "destructive" });
      return;
    }
    try {
      await adminMfaService.bulkEnableMfa(ids, bulkMethod, bulkReason || undefined);
      toast({ title: "Bulk MFA enable requested" });
    } catch {
      toast({ title: "Bulk enable failed", variant: "destructive" });
    }
  };

  const handleBulkDisable = async () => {
    const ids = parseUserIdsInput();
    if (!ids.length) {
      toast({ title: "No user IDs provided", variant: "destructive" });
      return;
    }
    try {
      await adminMfaService.bulkDisableMfa(ids, bulkReason || undefined);
      toast({ title: "Bulk MFA disable requested" });
    } catch {
      toast({ title: "Bulk disable failed", variant: "destructive" });
    }
  };

  const handleLoadPolicy = async () => {
    try {
      setPolicyLoading(true);
      const policy = await adminMfaService.getPolicy();
      setPolicyJson(JSON.stringify(policy, null, 2));
    } catch {
      toast({ title: "Failed to load policy", variant: "destructive" });
    } finally {
      setPolicyLoading(false);
    }
  };

  const handleSavePolicy = async () => {
    try {
      setPolicyLoading(true);
      const parsed = policyJson ? JSON.parse(policyJson) : {};
      await adminMfaService.updatePolicy(parsed);
      toast({ title: "Policy updated" });
    } catch {
      toast({ title: "Failed to update policy", variant: "destructive" });
    } finally {
      setPolicyLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Welcome Section */}
      <div className="glass-card rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute inset-0 gradient-glow opacity-30" />
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Admin Console, {user?.first_name || user?.username}
            </h1>
            <p className="text-muted-foreground max-w-xl">
              Monitor security posture, review user activity, and manage sessions
              across the platform.
            </p>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary">Administrator Access</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success/10 border border-success/20">
              <Lock className="h-4 w-4 text-success" />
              <span className="text-sm text-success">All systems operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Users</p>
            <p className="text-xl font-semibold">--</p>
          </div>
        </div>
        <div className="glass-card rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-10 flex items-center justify-center bg-amber-500/10">
            <Activity className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Active Sessions</p>
            <p className="text-xl font-semibold">--</p>
          </div>
        </div>
        <div className="glass-card rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">MFA Enabled</p>
            <p className="text-xl font-semibold">--</p>
          </div>
        </div>
        <div className="glass-card rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Risk Alerts</p>
            <p className="text-xl font-semibold">--</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        {adminQuickActions.map((action, index) => (
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
                  Open
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Users, MFA Overview, Policy */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Admin Tools</h2>
            <p className="text-sm text-muted-foreground">
              Manage users and MFA enforcement directly from the admin dashboard.
            </p>
          </div>
        </div>

        <Tabs defaultValue="users">
          <TabsList className="mb-2">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="mfa-overview">MFA Overview</TabsTrigger>
            <TabsTrigger value="policy">Policy &amp; Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-medium">Users</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  Page {usersQuery.data?.current_page ?? page} of {usersQuery.data?.total_pages ?? "?"}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1 || usersQuery.isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    !usersQuery.data ||
                    usersQuery.isFetching ||
                    usersQuery.data.current_page >= usersQuery.data.total_pages
                  }
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>

            {usersQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading users…</p>
            ) : usersQuery.isError ? (
              <p className="text-sm text-destructive">Failed to load users.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>MFA</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(usersQuery.data?.users ?? []).map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.username}</TableCell>
                      <TableCell className="capitalize">{u.role}</TableCell>
                      <TableCell>{u.is_deleted ? "Deleted" : "Active"}</TableCell>
                      <TableCell>{u.mfa_enabled ? "Enabled" : "Disabled"}</TableCell>
                      <TableCell>{u.last_login ? new Date(u.last_login).toLocaleString() : "-"}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openUserDialog(u)}
                        >
                          View
                        </Button>
                        {!u.is_deleted ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            disabled={userActionsLoading}
                            onClick={() => handleSoftDelete(u.id)}
                          >
                            Soft Delete
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={userActionsLoading}
                            onClick={() => handleRestore(u.id)}
                          >
                            Restore
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>User Details &amp; MFA</DialogTitle>
                  <DialogDescription>
                    Manage MFA configuration and view recent audit activity for this user.
                  </DialogDescription>
                </DialogHeader>

                {selectedUser && (
                  <div className="space-y-4 mt-2">
                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Email</p>
                        <p className="font-medium break-all">{selectedUser.email}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Username</p>
                        <p className="font-medium">{selectedUser.username}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Role</p>
                        <p className="font-medium capitalize">{selectedUser.role}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <p className="font-medium">{selectedUser.is_deleted ? "Deleted" : "Active"}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">MFA Actions</h4>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" disabled={userActionsLoading} onClick={handleResetMfa}>
                          Reset MFA
                        </Button>
                        <Button size="sm" variant="outline" disabled={userActionsLoading} onClick={handleForceEnableMfa}>
                          Force Enable
                        </Button>
                        <Button size="sm" variant="outline" disabled={userActionsLoading} onClick={handleForceDisableMfa}>
                          Force Disable
                        </Button>
                        <Button size="sm" variant="outline" disabled={userActionsLoading} onClick={handleEmergencyCodes}>
                          Emergency Codes
                        </Button>
                        <Button size="sm" variant="outline" disabled={userActionsLoading} onClick={handleRevokeDevices}>
                          Revoke Devices
                        </Button>
                        <Button size="sm" variant="outline" disabled={userActionsLoading} onClick={handleEmergencyBypass}>
                          Emergency Bypass (24h)
                        </Button>
                      </div>
                    </div>

                    {userMfaDetails && (
                      <div className="space-y-1 text-xs">
                        <p className="font-medium">MFA Details</p>
                        <pre className="max-h-40 overflow-auto rounded-md bg-secondary/40 p-2 text-[11px] text-muted-foreground">
{JSON.stringify(userMfaDetails, null, 2)}
                        </pre>
                      </div>
                    )}

                    {userAuditEvents && (
                      <div className="space-y-1 text-xs">
                        <p className="font-medium">Recent MFA Events</p>
                        <pre className="max-h-40 overflow-auto rounded-md bg-secondary/40 p-2 text-[11px] text-muted-foreground">
{JSON.stringify(userAuditEvents.slice(0, 50), null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="mfa-overview" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">MFA Compliance Overview</h3>
              <Button size="sm" variant="outline" onClick={handleLoadCompliance}>
                Refresh
              </Button>
            </div>

            {complianceReport ? (
              <pre className="max-h-60 overflow-auto rounded-md bg-secondary/40 p-3 text-xs text-muted-foreground">
{JSON.stringify(complianceReport, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">
                Load the compliance report to see MFA adoption metrics and high-risk users.
              </p>
            )}

            <div className="border-t border-border pt-4 space-y-3">
              <h4 className="font-medium text-sm">Bulk Actions</h4>
              <p className="text-xs text-muted-foreground">
                Paste one or more user IDs (comma or newline separated) to enable or disable MFA in bulk.
              </p>
              <div className="grid md:grid-cols-[2fr,1fr] gap-3">
                <textarea
                  className="min-h-[80px] rounded-md border border-border bg-secondary/40 p-2 text-xs font-mono"
                  placeholder="user-id-1\nuser-id-2\nuser-id-3"
                  value={bulkUserIds}
                  onChange={(e) => setBulkUserIds(e.target.value)}
                />
                <div className="space-y-2 text-xs">
                  <div className="space-y-1">
                    <p className="font-medium">Method (for enable)</p>
                    <Input
                      value={bulkMethod}
                      onChange={(e) => setBulkMethod(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">Reason (optional)</p>
                    <Input
                      value={bulkReason}
                      onChange={(e) => setBulkReason(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" onClick={handleBulkEnable}>
                      Bulk Enable
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleBulkDisable}>
                      Bulk Disable
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="policy" className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">MFA Policy</h3>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleLoadPolicy} disabled={policyLoading}>
                  Load
                </Button>
                <Button size="sm" onClick={handleSavePolicy} disabled={policyLoading}>
                  Save
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Edit the JSON representation of the MFA policy. Typical fields include
              <code className="mx-1">require_for_roles</code>, <code className="mx-1">allow_methods</code>,
              <code className="mx-1">backup_codes_required</code>, and trusted device expiry.
            </p>
            <textarea
              className="min-h-[200px] rounded-md border border-border bg-secondary/40 p-3 text-xs font-mono"
              value={policyJson}
              onChange={(e) => setPolicyJson(e.target.value)}
              placeholder={"{\n  \"require_for_roles\": [\"admin\"],\n  ...\n}"}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Info Banner */}
      <div className="glass-card rounded-xl p-6 border-l-4 border-l-primary flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="font-semibold mb-1">Need deeper insights?</h3>
          <p className="text-sm text-muted-foreground">
            Connect the admin API to power these metrics with real data like
            user counts, login anomalies, and device trust scores.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/admin/sessions" className="gap-2">
            View session activity
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}
