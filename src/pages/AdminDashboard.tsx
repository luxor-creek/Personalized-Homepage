import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import BrandLogo from "@/components/BrandLogo";
import {
  LogOut, Users, Layout, HelpCircle, FileText, Shield,
  BarChart3, Crown, Clock, UserPlus, Pencil, Trash2, Mail,
  DollarSign, TrendingUp, AlertTriangle, ChevronRight, ArrowLeft,
  Send, CheckSquare, Plug
} from "lucide-react";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import FormSubmissionsPanel from "@/components/admin/FormSubmissionsPanel";
import IntegrationsPanel from "@/components/admin/IntegrationsPanel";
interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  plan: string;
  trial_ends_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  max_pages: number;
  max_live_pages: number;
  max_campaigns: number;
  created_at: string;
  feature_flags?: Record<string, boolean>;
}

interface InfoRequest {
  id: string;
  first_name: string;
  email: string;
  created_at: string;
}

interface Campaign {
  id: string;
  name: string;
}

const PLAN_LIMITS: Record<string, { max_pages: number; max_live_pages: number; max_campaigns: number }> = {
  trial: { max_pages: 3, max_live_pages: 1, max_campaigns: 1 },
  starter: { max_pages: 25, max_live_pages: 25, max_campaigns: 50 },
  pro: { max_pages: 999999, max_live_pages: 999999, max_campaigns: 999999 },
  enterprise: { max_pages: 999999, max_live_pages: 999999, max_campaigns: 999999 },
};

const planBadgeVariant = (plan: string) => {
  switch (plan) {
    case "trial": return "secondary";
    case "starter": return "default";
    case "pro": return "default";
    case "enterprise": return "outline";
    default: return "secondary";
  }
};

type DrilldownFilter = "trial_active" | "trial_expired" | "starter" | "pro" | "enterprise" | null;

const DRILLDOWN_LABELS: Record<string, string> = {
  trial_active: "Trial (Active)",
  trial_expired: "Trial (Expired)",
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, checkingAuth, profile, handleLogout } = useAuth(true);

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userPageCounts, setUserPageCounts] = useState<Record<string, number>>({});
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editPlan, setEditPlan] = useState("");
  const [editTrialDays, setEditTrialDays] = useState("");
  const [editSnovEnabled, setEditSnovEnabled] = useState(false);
  const [editLemlistEnabled, setEditLemlistEnabled] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);

  // Drilldown
  const [drilldownFilter, setDrilldownFilter] = useState<DrilldownFilter>(null);
  const [drilldownSort, setDrilldownSort] = useState<"newest" | "oldest" | "name_asc" | "ending_soon" | "most_pages" | "least_pages">("newest");

  // Add to campaign
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [addToCampaignOpen, setAddToCampaignOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [addingToCampaign, setAddingToCampaign] = useState(false);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  // Create user
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserSendEmail, setNewUserSendEmail] = useState(true);
  const [newUserPlan, setNewUserPlan] = useState("trial");
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUserSnovEnabled, setNewUserSnovEnabled] = useState(false);
  const [newUserLemlistEnabled, setNewUserLemlistEnabled] = useState(false);

  // Beta questions
  const [infoRequests, setInfoRequests] = useState<InfoRequest[]>([]);
  const [infoRequestCount, setInfoRequestCount] = useState(0);
  const [betaEmailDialogOpen, setBetaEmailDialogOpen] = useState(false);
  const [betaEmailTarget, setBetaEmailTarget] = useState<InfoRequest | null>(null);
  const [betaEmailSubject, setBetaEmailSubject] = useState("");
  const [betaEmailBody, setBetaEmailBody] = useState("");
  const [sendingBetaEmail, setSendingBetaEmail] = useState(false);

  useEffect(() => {
    if (user && isAdmin) {
      fetchUsers();
      fetchInfoRequests();
    }
  }, [user, isAdmin]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setUsers((data as UserProfile[]) || []);

      // Fetch page counts per user via campaigns join
      const userIds = (data || []).map((u: any) => u.user_id);
      if (userIds.length > 0) {
        const { data: campaigns } = await supabase
          .from("campaigns")
          .select("id, user_id")
          .in("user_id", userIds);

        if (campaigns && campaigns.length > 0) {
          const campaignIds = campaigns.map(c => c.id);
          const { data: pages } = await supabase
            .from("personalized_pages")
            .select("id, campaign_id")
            .in("campaign_id", campaignIds);

          // Build user_id -> page count map
          const campaignToUser = new Map<string, string>();
          campaigns.forEach(c => campaignToUser.set(c.id, c.user_id));

          const counts: Record<string, number> = {};
          (pages || []).forEach(p => {
            const uid = campaignToUser.get(p.campaign_id);
            if (uid) counts[uid] = (counts[uid] || 0) + 1;
          });
          setUserPageCounts(counts);
        } else {
          setUserPageCounts({});
        }
      }
    } catch (err: any) {
      toast({ title: "Error loading users", description: err.message, variant: "destructive" });
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchCampaigns = async () => {
    setLoadingCampaigns(true);
    try {
      const { data, error } = await supabase
        .from("campaigns")
        .select("id, name")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setCampaigns(data || []);
    } catch (err: any) {
      toast({ title: "Error loading campaigns", description: err.message, variant: "destructive" });
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const fetchInfoRequests = async () => {
    try {
      const { data, error, count } = await supabase
        .from("info_requests")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });
      if (error) throw error;
      setInfoRequests(data || []);
      setInfoRequestCount(count || 0);
    } catch (error: any) {
      console.error("Error fetching info requests:", error.message);
    }
  };

  const openEditUser = (profile: UserProfile) => {
    setEditingUser(profile);
    setEditPlan(profile.plan);
    setEditTrialDays("");
    const flags = (profile.feature_flags as Record<string, boolean>) || {};
    setEditSnovEnabled(!!flags.snov_enabled);
    setEditLemlistEnabled(!!flags.lemlist_enabled);
    setEditUserOpen(true);
  };

  const saveUserChanges = async () => {
    if (!editingUser) return;
    setSavingUser(true);
    try {
      const limits = PLAN_LIMITS[editPlan] || PLAN_LIMITS.trial;
      const updateData: any = {
        plan: editPlan,
        max_pages: limits.max_pages,
        max_live_pages: limits.max_live_pages,
        max_campaigns: limits.max_campaigns,
        feature_flags: {
          ...(editingUser.feature_flags || {}),
          snov_enabled: editSnovEnabled,
          lemlist_enabled: editLemlistEnabled,
        },
      };

      if (editTrialDays && parseInt(editTrialDays) > 0) {
        const daysToAdd = parseInt(editTrialDays);
        const baseDate = editingUser.trial_ends_at ? new Date(editingUser.trial_ends_at) : new Date();
        baseDate.setDate(baseDate.getDate() + daysToAdd);
        updateData.trial_ends_at = baseDate.toISOString();
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", editingUser.id);

      if (error) throw error;
      toast({ title: "User updated" });
      setEditUserOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingUser(false);
    }
  };

  const sendBetaEmail = async () => {
    if (!betaEmailTarget) return;
    setSendingBetaEmail(true);
    try {
      const { error } = await supabase.functions.invoke("send-beta-info-email", {
        body: {
          to: betaEmailTarget.email,
          firstName: betaEmailTarget.first_name,
          subject: betaEmailSubject,
          body: betaEmailBody,
        },
      });
      if (error) throw error;
      toast({ title: "Email sent!" });
      setBetaEmailDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Error sending email", description: err.message, variant: "destructive" });
    } finally {
      setSendingBetaEmail(false);
    }
  };

  const getTrialStatus = (profile: UserProfile) => {
    if (profile.plan !== "trial") return null;
    if (!profile.trial_ends_at) return "no trial set";
    const end = new Date(profile.trial_ends_at);
    const now = new Date();
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return "expired";
    if (daysLeft === 0) return "expires today";
    return `${daysLeft} days left`;
  };

  const isTrialExpired = (profile: UserProfile) => {
    if (profile.plan !== "trial" || !profile.trial_ends_at) return false;
    return new Date(profile.trial_ends_at) <= new Date();
  };

  const handleCreateUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim()) {
      toast({ title: "Name and email are required", variant: "destructive" });
      return;
    }
    setCreatingUser(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: {
          email: newUserEmail.trim(),
          full_name: newUserName.trim(),
          plan: newUserPlan,
          password: newUserPassword.trim() || undefined,
          send_email: newUserSendEmail,
          feature_flags: {
            snov_enabled: newUserSnovEnabled,
            lemlist_enabled: newUserLemlistEnabled,
          },
        },
      });
      // data?.error contains the real message even on non-2xx responses
      if (data?.error) throw new Error(data.error);
      if (error) throw new Error(error.message || "Failed to create user");
      if (data?.email_error) {
        toast({ title: "User created, but invite email failed", description: data.email_error, variant: "destructive" });
      } else if (newUserSendEmail) {
        toast({ title: "User created", description: `Welcome email sent to ${newUserEmail}` });
      } else {
        toast({ title: "User created", description: `Account ready for ${newUserEmail}` });
      }
      setCreateUserOpen(false);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserSendEmail(true);
      setNewUserPlan("trial");
      setNewUserSnovEnabled(false);
      setNewUserLemlistEnabled(false);
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Error creating user", description: err.message, variant: "destructive" });
    } finally {
      setCreatingUser(false);
    }
  };

  // Internal user number is based on creation order (ascending)
  const userNumberMap = useMemo(() => {
    const map = new Map<string, number>();
    users.forEach((u, i) => map.set(u.id, i + 1));
    return map;
  }, [users]);

  // Computed stats
  const totalUsers = users.length;
  const activeTrials = users.filter(u => u.plan === "trial" && u.trial_ends_at && new Date(u.trial_ends_at) > new Date()).length;
  const expiredTrials = users.filter(u => u.plan === "trial" && u.trial_ends_at && new Date(u.trial_ends_at) <= new Date()).length;
  const paidUsers = users.filter(u => u.plan === "starter" || u.plan === "pro").length;
  const starterUsers = users.filter(u => u.plan === "starter").length;
  const proUsers = users.filter(u => u.plan === "pro").length;
  const enterpriseUsers = users.filter(u => u.plan === "enterprise").length;
  const estimatedMRR = (starterUsers * 29) + (proUsers * 59);

  // Drilldown filtered users
  const drilldownUsers = useMemo(() => {
    if (!drilldownFilter) return [];
    const filtered = users.filter(u => {
      switch (drilldownFilter) {
        case "trial_active":
          return u.plan === "trial" && u.trial_ends_at && new Date(u.trial_ends_at) > new Date();
        case "trial_expired":
          return u.plan === "trial" && u.trial_ends_at && new Date(u.trial_ends_at) <= new Date();
        case "starter":
          return u.plan === "starter";
        case "pro":
          return u.plan === "pro";
        case "enterprise":
          return u.plan === "enterprise";
        default:
          return false;
      }
    });
    const sorted = [...filtered];
    switch (drilldownSort) {
      case "newest":
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "oldest":
        sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "name_asc":
        sorted.sort((a, b) => (a.full_name || a.email || "").localeCompare(b.full_name || b.email || ""));
        break;
      case "ending_soon":
        sorted.sort((a, b) => {
          const aEnd = a.trial_ends_at ? new Date(a.trial_ends_at).getTime() : Infinity;
          const bEnd = b.trial_ends_at ? new Date(b.trial_ends_at).getTime() : Infinity;
          return aEnd - bEnd;
        });
        break;
      case "most_pages":
        sorted.sort((a, b) => (userPageCounts[b.user_id] || 0) - (userPageCounts[a.user_id] || 0));
        break;
      case "least_pages":
        sorted.sort((a, b) => (userPageCounts[a.user_id] || 0) - (userPageCounts[b.user_id] || 0));
        break;
    }
    return sorted;
  }, [drilldownFilter, users, drilldownSort, userPageCounts]);

  // Selection helpers
  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleAllVisible = (visibleUsers: UserProfile[]) => {
    const allSelected = visibleUsers.every(u => selectedUserIds.has(u.id));
    if (allSelected) {
      setSelectedUserIds(prev => {
        const next = new Set(prev);
        visibleUsers.forEach(u => next.delete(u.id));
        return next;
      });
    } else {
      setSelectedUserIds(prev => {
        const next = new Set(prev);
        visibleUsers.forEach(u => next.add(u.id));
        return next;
      });
    }
  };

  const openAddToCampaign = () => {
    fetchCampaigns();
    setSelectedCampaignId("");
    setAddToCampaignOpen(true);
  };

  const addSelectedToCampaign = async () => {
    if (!selectedCampaignId || selectedUserIds.size === 0) return;
    setAddingToCampaign(true);
    try {
      const selectedUsers = users.filter(u => selectedUserIds.has(u.id));
      const inserts = selectedUsers.map(u => ({
        campaign_id: selectedCampaignId,
        first_name: u.full_name?.split(" ")[0] || u.email?.split("@")[0] || "User",
        last_name: u.full_name?.split(" ").slice(1).join(" ") || null,
        email: u.email,
        company: null,
      }));

      const { error } = await supabase.from("personalized_pages").insert(inserts);
      if (error) throw error;

      toast({ title: `${inserts.length} user(s) added to campaign` });
      setAddToCampaignOpen(false);
      setSelectedUserIds(new Set());
    } catch (err: any) {
      toast({ title: "Error adding to campaign", description: err.message, variant: "destructive" });
    } finally {
      setAddingToCampaign(false);
    }
  };

  // Shared user table component
  const UserTable = ({ userList, showSelect = true }: { userList: UserProfile[]; showSelect?: boolean }) => (
    <div className="bg-card rounded-lg border border-border overflow-x-auto">
      {showSelect && selectedUserIds.size > 0 && (
        <div className="px-4 py-2 bg-primary/5 border-b border-border flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{selectedUserIds.size} user(s) selected</span>
          <Button size="sm" variant="outline" onClick={openAddToCampaign}>
            <Send className="w-3.5 h-3.5 mr-1.5" />Add to Campaign
          </Button>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            {showSelect && (
              <TableHead className="w-10">
                <Checkbox
                  checked={userList.length > 0 && userList.every(u => selectedUserIds.has(u.id))}
                  onCheckedChange={() => toggleAllVisible(userList)}
                />
              </TableHead>
            )}
            <TableHead className="w-16">#</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Trial Ends</TableHead>
            <TableHead>Pages Used</TableHead>
            <TableHead>Limits</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {userList.map((profile) => (
            <TableRow key={profile.id}>
              {showSelect && (
                <TableCell>
                  <Checkbox
                    checked={selectedUserIds.has(profile.id)}
                    onCheckedChange={() => toggleUserSelection(profile.id)}
                  />
                </TableCell>
              )}
              <TableCell className="text-muted-foreground font-mono text-xs">
                {userNumberMap.get(profile.id) ?? "—"}
              </TableCell>
              <TableCell className="font-medium">{profile.email || "—"}</TableCell>
              <TableCell className="text-muted-foreground">{profile.full_name || "—"}</TableCell>
              <TableCell>
                <Badge variant={planBadgeVariant(profile.plan) as any} className="capitalize">
                  {profile.plan}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(profile.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {profile.plan === "trial" ? (
                  <span className={`text-sm ${
                    isTrialExpired(profile) ? "text-destructive font-medium" :
                    getTrialStatus(profile)?.includes("1 day") ? "text-amber-500" :
                    "text-muted-foreground"
                  }`}>
                    {profile.trial_ends_at ? new Date(profile.trial_ends_at).toLocaleDateString() : "—"}
                    <span className="ml-1 text-xs opacity-70">({getTrialStatus(profile)})</span>
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                {(() => {
                  const count = userPageCounts[profile.user_id] || 0;
                  const max = profile.max_pages >= 999999 ? Infinity : profile.max_pages;
                  const pct = max === Infinity ? 0 : (count / max) * 100;
                  return (
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${count === 0 ? "text-muted-foreground" : pct >= 80 ? "text-amber-500" : "text-foreground"}`}>
                        {count}
                      </span>
                      <span className="text-xs text-muted-foreground">/ {max === Infinity ? "∞" : max}</span>
                    </div>
                  );
                })()}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {profile.max_pages >= 999999 ? "∞" : profile.max_pages} pages / {profile.max_campaigns >= 999999 ? "∞" : profile.max_campaigns} campaigns
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" onClick={() => openEditUser(profile)}>
                  <Pencil className="w-3 h-3 mr-1" />Manage
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">Admin privileges required.</p>
          <Button variant="outline" onClick={handleLogout}>Sign Out</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo className="h-8" />
            <Badge variant="outline" className="text-xs"><Shield className="w-3 h-3 mr-1" />Admin</Badge>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate("/workspace")}>
              <Layout className="w-4 h-4 mr-2" />
              User Dashboard
            </Button>
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview"><BarChart3 className="w-4 h-4 mr-2" />Overview</TabsTrigger>
            <TabsTrigger value="users"><Users className="w-4 h-4 mr-2" />Users</TabsTrigger>
            <TabsTrigger value="beta-questions">
              <HelpCircle className="w-4 h-4 mr-2" />
              Beta Questions {infoRequestCount > 0 && <span className="ml-1.5 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-primary/20 text-primary">{infoRequestCount}</span>}
            </TabsTrigger>
            <TabsTrigger value="form-submissions"><FileText className="w-4 h-4 mr-2" />Form Submissions</TabsTrigger>
            <TabsTrigger value="integrations"><Plug className="w-4 h-4 mr-2" />Integrations</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1"><Users className="w-4 h-4" /><span className="text-sm">Total Users</span></div>
                <p className="text-3xl font-bold text-foreground">{totalUsers}</p>
              </div>
              <div className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1"><DollarSign className="w-4 h-4" /><span className="text-sm">Est. MRR</span></div>
                <p className="text-3xl font-bold text-foreground">${estimatedMRR}</p>
              </div>
              <div className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1"><Crown className="w-4 h-4" /><span className="text-sm">Paid Users</span></div>
                <p className="text-3xl font-bold text-foreground">{paidUsers}</p>
              </div>
              <div className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1"><Clock className="w-4 h-4" /><span className="text-sm">Active Trials</span></div>
                <p className="text-3xl font-bold text-foreground">{activeTrials}</p>
              </div>
            </div>

            {/* Plan Distribution — drilldown or summary */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-card rounded-lg border border-border p-6">
                {drilldownFilter ? (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setDrilldownFilter(null); setSelectedUserIds(new Set()); }}>
                          <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <h3 className="font-semibold text-foreground">{DRILLDOWN_LABELS[drilldownFilter]}</h3>
                        <Badge variant="secondary" className="text-xs">{drilldownUsers.length}</Badge>
                      </div>
                      {selectedUserIds.size > 0 && (
                        <Button size="sm" variant="outline" onClick={openAddToCampaign}>
                          <Send className="w-3.5 h-3.5 mr-1.5" />Campaign ({selectedUserIds.size})
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={drilldownUsers.length > 0 && drilldownUsers.every(u => selectedUserIds.has(u.id))}
                          onCheckedChange={() => toggleAllVisible(drilldownUsers)}
                        />
                        <span className="text-xs text-muted-foreground">Select all</span>
                      </div>
                      <div className="ml-auto">
                        <Select value={drilldownSort} onValueChange={(v) => setDrilldownSort(v as any)}>
                          <SelectTrigger className="h-7 text-xs w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="newest">Newest first</SelectItem>
                            <SelectItem value="oldest">Oldest first</SelectItem>
                            <SelectItem value="name_asc">Name A–Z</SelectItem>
                            <SelectItem value="ending_soon">Ending soon</SelectItem>
                            <SelectItem value="most_pages">Most pages</SelectItem>
                            <SelectItem value="least_pages">Least pages</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1 max-h-[400px] overflow-y-auto">
                      {drilldownUsers.map(profile => (
                        <div key={profile.id} className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted/50 text-sm group">
                          <Checkbox
                            checked={selectedUserIds.has(profile.id)}
                            onCheckedChange={() => toggleUserSelection(profile.id)}
                          />
                          <span className="font-mono text-xs text-muted-foreground w-6">
                            {userNumberMap.get(profile.id)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{profile.email || "—"}</p>
                            <p className="text-xs text-muted-foreground">{profile.full_name || "No name"}</p>
                          </div>
                          <div className="text-right text-xs text-muted-foreground shrink-0">
                            <p>Joined {new Date(profile.created_at).toLocaleDateString()}</p>
                            {profile.plan === "trial" && profile.trial_ends_at && (
                              <p className={isTrialExpired(profile) ? "text-destructive" : ""}>
                                {isTrialExpired(profile) ? "Expired" : "Ends"} {new Date(profile.trial_ends_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100" onClick={() => openEditUser(profile)}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                      {drilldownUsers.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No users in this group.</p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="font-semibold text-foreground mb-4">Plan Distribution</h3>
                    <div className="space-y-1">
                      {([
                        { key: "trial_active" as DrilldownFilter, label: "Trial (active)", count: activeTrials, icon: null },
                        { key: "trial_expired" as DrilldownFilter, label: "Trial (expired)", count: expiredTrials, icon: <AlertTriangle className="w-3 h-3 text-amber-500" /> },
                        { key: "starter" as DrilldownFilter, label: "Starter ($29/mo)", count: starterUsers, icon: null },
                        { key: "pro" as DrilldownFilter, label: "Pro ($59/mo)", count: proUsers, icon: null },
                        { key: "enterprise" as DrilldownFilter, label: "Enterprise", count: enterpriseUsers, icon: null },
                      ]).map(row => (
                        <button
                          key={row.key}
                          onClick={() => { setDrilldownFilter(row.key); setSelectedUserIds(new Set()); }}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-muted/50 transition-colors group"
                        >
                          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                            {row.icon}
                            {row.label}
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{row.count}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="font-semibold text-foreground mb-4">Revenue Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Starter revenue</span>
                    <span className="font-medium text-foreground">${starterUsers * 29}/mo</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Pro revenue</span>
                    <span className="font-medium text-foreground">${proUsers * 59}/mo</span>
                  </div>
                  <div className="border-t border-border pt-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Total MRR</span>
                    <span className="text-lg font-bold text-primary">${estimatedMRR}/mo</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Trial → Paid conversion</span>
                    <span className="font-medium text-foreground">
                      {totalUsers > 0 ? Math.round((paidUsers / totalUsers) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Users</h2>
                <p className="text-muted-foreground">Manage users, plans, and trials. Select users to add to a campaign.</p>
              </div>
              <Button onClick={() => setCreateUserOpen(true)}>
                <UserPlus className="w-4 h-4 mr-2" />Create User
              </Button>
            </div>

            {loadingUsers ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <UserTable userList={users} />
            )}
          </TabsContent>

          {/* Beta Questions Tab */}
          <TabsContent value="beta-questions" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Beta Questions</h2>
              <p className="text-muted-foreground">People who expressed interest via the beta signup form.</p>
            </div>
            {infoRequests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No signups yet.</p>
              </div>
            ) : (
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>First Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {infoRequests.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell className="font-medium">{req.first_name}</TableCell>
                        <TableCell>{req.email}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(req.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setBetaEmailTarget(req);
                              setBetaEmailSubject("Personalized page info");
                              setBetaEmailBody(`Hi ${req.first_name},\n\nThanks for signing up to learn more about Personalized Pages. The platform is currently in Beta but will be released soon at discounted pricing.\n\nHow it works\n\n1. Log in and select a landing page template\n2. Upload your email list\n3. We generate a personalized landing page for every contact\n4. Send your campaign using your existing sales or automation platform\n\nThat's it. No custom builds. No one-off pages. Just fast, scalable personalization.\n\nI will send you an email once the platform is publicly available soon.\n\nTake care,\nPaul\n\nPersonalized.Pages`);
                              setBetaEmailDialogOpen(true);
                            }}
                          >
                            <Mail className="w-3.5 h-3.5 mr-1.5" />Send Email
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Form Submissions Tab */}
          <TabsContent value="form-submissions" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Form Submissions</h2>
              <p className="text-muted-foreground mb-6">View all form submissions from your landing pages.</p>
            </div>
            <FormSubmissionsPanel />
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <IntegrationsPanel isAdmin={isAdmin} featureFlags={(profile as any)?.feature_flags || {}} />
          </TabsContent>

        </Tabs>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage User</DialogTitle>
            <DialogDescription>{editingUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select value={editPlan} onValueChange={setEditPlan}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial (2 weeks, 1 live page, 1 campaign)</SelectItem>
                  <SelectItem value="starter">Starter ($29/mo — 25 pages, 50 campaigns)</SelectItem>
                  <SelectItem value="pro">Pro ($59/mo — Unlimited)</SelectItem>
                  <SelectItem value="enterprise">Enterprise (Unlimited, custom)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editPlan === "trial" && (
              <div className="space-y-2">
                <Label>Extend Trial (days)</Label>
                <Input
                  type="number"
                  min="0"
                  value={editTrialDays}
                  onChange={(e) => setEditTrialDays(e.target.value)}
                  placeholder="e.g. 7"
                />
                <p className="text-xs text-muted-foreground">
                  Current trial ends: {editingUser?.trial_ends_at
                    ? new Date(editingUser.trial_ends_at).toLocaleDateString()
                    : "not set"}
                </p>
              </div>
            )}

            <div className="bg-muted rounded-lg p-3 text-sm">
              <p className="font-medium text-foreground mb-1">Plan limits:</p>
              <p className="text-muted-foreground">
                {PLAN_LIMITS[editPlan]?.max_pages >= 999999 ? "Unlimited" : PLAN_LIMITS[editPlan]?.max_pages} pages,{" "}
                {PLAN_LIMITS[editPlan]?.max_campaigns >= 999999 ? "Unlimited" : PLAN_LIMITS[editPlan]?.max_campaigns} campaigns
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Integrations</Label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="edit-snov-enabled"
                    checked={editSnovEnabled}
                    onCheckedChange={(checked) => setEditSnovEnabled(!!checked)}
                  />
                  <Label htmlFor="edit-snov-enabled" className="cursor-pointer text-sm">Snov.io</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="edit-lemlist-enabled"
                    checked={editLemlistEnabled}
                    onCheckedChange={(checked) => setEditLemlistEnabled(!!checked)}
                  />
                  <Label htmlFor="edit-lemlist-enabled" className="cursor-pointer text-sm">LemList</Label>
                </div>
              </div>
            </div>

            <Button onClick={saveUserChanges} className="w-full" disabled={savingUser}>
              {savingUser ? "Saving..." : "Save Changes"}
            </Button>

            <div className="border-t border-border pt-4 mt-2">
              <Button
                variant="destructive"
                className="w-full"
                disabled={deletingUser || editingUser?.user_id === user?.id}
                onClick={async () => {
                  if (!editingUser) return;
                  if (!confirm(`Are you sure you want to permanently delete ${editingUser.email}? This cannot be undone.`)) return;
                  setDeletingUser(true);
                  try {
                    const { data, error } = await supabase.functions.invoke("delete-user", {
                      body: { user_id: editingUser.user_id },
                    });
                    if (error) throw error;
                    if (data?.error) throw new Error(data.error);
                    toast({ title: "User deleted" });
                    setEditUserOpen(false);
                    fetchUsers();
                  } catch (err: any) {
                    toast({ title: "Error deleting user", description: err.message, variant: "destructive" });
                  } finally {
                    setDeletingUser(false);
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deletingUser ? "Deleting..." : "Delete User"}
              </Button>
              {editingUser?.user_id === user?.id && (
                <p className="text-xs text-muted-foreground mt-1 text-center">You cannot delete your own account</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Beta Email Dialog */}
      <Dialog open={betaEmailDialogOpen} onOpenChange={setBetaEmailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Email to {betaEmailTarget?.first_name}</DialogTitle>
            <DialogDescription>Send a follow-up email to {betaEmailTarget?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input value={betaEmailSubject} onChange={(e) => setBetaEmailSubject(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Body</Label>
              <Textarea value={betaEmailBody} onChange={(e) => setBetaEmailBody(e.target.value)} rows={10} />
            </div>
            <Button onClick={sendBetaEmail} className="w-full" disabled={sendingBetaEmail}>
              {sendingBetaEmail ? "Sending..." : "Send Email"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add to Campaign Dialog */}
      <Dialog open={addToCampaignOpen} onOpenChange={setAddToCampaignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {selectedUserIds.size} User(s) to Campaign</DialogTitle>
            <DialogDescription>
              Selected users will be added as personalized page contacts in the chosen campaign.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Campaign</Label>
              {loadingCampaigns ? (
                <p className="text-sm text-muted-foreground">Loading campaigns...</p>
              ) : campaigns.length === 0 ? (
                <p className="text-sm text-muted-foreground">No campaigns found. Create one first from the User Dashboard.</p>
              ) : (
                <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="bg-muted rounded-lg p-3 text-sm max-h-32 overflow-y-auto">
              <p className="font-medium text-foreground mb-1">Selected users:</p>
              {users.filter(u => selectedUserIds.has(u.id)).map(u => (
                <p key={u.id} className="text-muted-foreground text-xs">{u.email || u.full_name || "Unknown"}</p>
              ))}
            </div>

            <Button onClick={addSelectedToCampaign} className="w-full" disabled={addingToCampaign || !selectedCampaignId}>
              {addingToCampaign ? "Adding..." : `Add ${selectedUserIds.size} User(s)`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Create an account and optionally send a welcome email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Jane Smith"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="jane@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Password <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                placeholder="Min 6 characters — or leave blank for email setup"
              />
              {newUserPassword.length > 0 && newUserPassword.length < 6 && (
                <p className="text-xs text-destructive">Password must be at least 6 characters</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select value={newUserPlan} onValueChange={setNewUserPlan}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial (14-day free trial)</SelectItem>
                  <SelectItem value="starter">Starter ($29/mo)</SelectItem>
                  <SelectItem value="pro">Pro ($59/mo)</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="send-email"
                checked={newUserSendEmail}
                onCheckedChange={(checked) => setNewUserSendEmail(!!checked)}
              />
              <Label htmlFor="send-email" className="cursor-pointer">Send invite / welcome email</Label>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Enable Integrations</Label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="snov-enabled"
                    checked={newUserSnovEnabled}
                    onCheckedChange={(checked) => setNewUserSnovEnabled(!!checked)}
                  />
                  <Label htmlFor="snov-enabled" className="cursor-pointer text-sm">Snov.io</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="lemlist-enabled"
                    checked={newUserLemlistEnabled}
                    onCheckedChange={(checked) => setNewUserLemlistEnabled(!!checked)}
                  />
                  <Label htmlFor="lemlist-enabled" className="cursor-pointer text-sm">LemList</Label>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Selected integrations will be visible to this user in their dashboard.</p>
            </div>
            <div className="bg-muted rounded-lg p-3 text-sm">
              <p className="font-medium text-foreground mb-1">What happens:</p>
              <ul className="text-muted-foreground space-y-1 text-xs list-disc list-inside">
                <li>Account created with the selected plan</li>
                {newUserPassword.length >= 6
                  ? <li>User can log in immediately with the password you set</li>
                  : newUserSendEmail
                    ? <li>Welcome email sent with a link to set password</li>
                    : <li>No password set — you'll need to share credentials separately</li>
                }
                {newUserSendEmail && <li>Invite email sent to the user</li>}
                {newUserPlan === "trial" && <li>14-day trial starts immediately</li>}
                {newUserPlan !== "trial" && <li>Full {newUserPlan} plan access granted immediately</li>}
              </ul>
            </div>
            <Button
              onClick={handleCreateUser}
              className="w-full"
              disabled={creatingUser || (newUserPassword.length > 0 && newUserPassword.length < 6)}
            >
              {creatingUser ? "Creating..." : newUserSendEmail ? "Create User & Send Email" : "Create User"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
