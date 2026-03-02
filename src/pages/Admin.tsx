import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import BrandLogo from "@/components/BrandLogo";
import { Plus, Upload, ExternalLink, Trash2, BarChart3, LogOut, Eye, Layout, Pencil, Shield, Send, Mail, Download, HelpCircle, Copy, Hammer, TrendingUp, ChevronDown, ChevronUp, CheckCircle2, ArrowRight, Radio, AlertTriangle, FileText, CreditCard, Bell, BellRing, ArrowLeft, X, Search, Pause, Play, Braces, Settings, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import heroThumbnail from "@/assets/hero-thumbnail.jpg";
import FormSubmissionsPanel from "@/components/admin/FormSubmissionsPanel";
import VariablesPanel from "@/components/admin/VariablesPanel";
import TemplateMiniPreview from "@/components/admin/TemplateMiniPreview";
import TemplatePageGrid from "@/components/admin/TemplatePageGrid";
import LifetimeLinksMetric from "@/components/admin/LifetimeLinksMetric";
import DashboardOnboarding from "@/components/admin/DashboardOnboarding";
import CampaignAnalyticsPanel from "@/components/admin/CampaignAnalyticsPanel";
import LinkedInEnrichDialog from "@/components/admin/LinkedInEnrichDialog";
import AICsvMapper from "@/components/admin/AICsvMapper";
import ManualImportFlow from "@/components/admin/ManualImportFlow";
import SnovOnboardingDialog from "@/components/admin/SnovOnboardingDialog";
import MailchimpOnboardingDialog from "@/components/admin/MailchimpOnboardingDialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { User, Session } from "@supabase/supabase-js";
import { useUsageLimits } from "@/hooks/useUsageLimits";
import UsageLimitBanner from "@/components/UsageLimitBanner";
import UpgradeDialog from "@/components/UpgradeDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Campaign {
  id: string;
  name: string;
  template_id: string | null;
  created_at: string;
  page_count?: number;
  view_count?: number;
  alert_on_view?: boolean;
}

interface LandingPageTemplate {
  id: string;
  name: string;
  slug: string;
  thumbnail_url?: string | null;
  user_id?: string | null;
  is_builder_template?: boolean;
  hero_headline?: string | null;
  hero_badge?: string | null;
  hero_subheadline?: string | null;
  logo_url?: string | null;
  hero_video_thumbnail_url?: string | null;
}

interface PersonalizedPage {
  id: string;
  token: string;
  first_name: string;
  last_name: string | null;
  company: string | null;
  custom_message: string | null;
  created_at: string;
  view_count?: number;
  is_paused?: boolean;
  photo_url?: string | null;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Authentication state
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [pages, setPages] = useState<PersonalizedPage[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Create campaign dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [templates, setTemplates] = useState<LandingPageTemplate[]>([]);
  
  // CSV upload dialog
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Add person dialog
  const [addPersonDialogOpen, setAddPersonDialogOpen] = useState(false);
  const [newPerson, setNewPerson] = useState({
    first_name: "",
    last_name: "",
    email: "",
    company: "",
    custom_message: "",
  });
  const [addingPerson, setAddingPerson] = useState(false);

  // Edit contact dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<PersonalizedPage | null>(null);
  const [editForm, setEditForm] = useState({ first_name: "", last_name: "", company: "", email: "" });
  const [savingEdit, setSavingEdit] = useState(false);

  // Test email dialog
  const [testEmailDialogOpen, setTestEmailDialogOpen] = useState(false);

  // Beta Questions state
  const [infoRequests, setInfoRequests] = useState<Array<{ id: string; first_name: string; email: string; created_at: string }>>([]);
  const [infoRequestCount, setInfoRequestCount] = useState(0);
  const [sendingBetaEmail, setSendingBetaEmail] = useState(false);
  const [betaEmailDialogOpen, setBetaEmailDialogOpen] = useState(false);
  const [betaEmailTarget, setBetaEmailTarget] = useState<{ id: string; first_name: string; email: string } | null>(null);
  const [betaEmailSubject, setBetaEmailSubject] = useState("");
  const [betaEmailBody, setBetaEmailBody] = useState("");

  // View details modal state
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [viewDetailsLoading, setViewDetailsLoading] = useState(false);
  const [viewDetailsData, setViewDetailsData] = useState<Array<{ id: string; viewed_at: string; user_agent: string | null }>>([]);
  const [viewDetailsContact, setViewDetailsContact] = useState<{ name: string; view_count: number } | null>(null);

  // Snov.io integration state
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [workflowCardsExpanded, setWorkflowCardsExpanded] = useState(true);
  const [snovGuideOpen, setSnovGuideOpen] = useState(false);
  const [usedSnovWorkflow, setUsedSnovWorkflow] = useState(false);

  const [snovDialogOpen, setSnovDialogOpen] = useState(false);
  const [snovOnboardingOpen, setSnovOnboardingOpen] = useState(false);
  const [snovConnected, setSnovConnected] = useState(false);
  const [snovLists, setSnovLists] = useState<Array<{ id: number; name: string; contacts: number }>>([]);
  const [loadingSnovLists, setLoadingSnovLists] = useState(false);
  const [selectedSnovList, setSelectedSnovList] = useState<number | null>(null);
  const [selectedSnovCampaignList, setSelectedSnovCampaignList] = useState<number | null>(null);

  // Mailchimp integration state
  const [mailchimpOnboardingOpen, setMailchimpOnboardingOpen] = useState(false);
  const [mailchimpConnected, setMailchimpConnected] = useState(false);
  const [mailchimpDialogOpen, setMailchimpDialogOpen] = useState(false);
  const [mailchimpLists, setMailchimpLists] = useState<Array<{ id: string; name: string; memberCount: number }>>([]);
  const [loadingMailchimpLists, setLoadingMailchimpLists] = useState(false);
  const [selectedMailchimpList, setSelectedMailchimpList] = useState<string | null>(null);
  const [sendingMailchimp, setSendingMailchimp] = useState(false);
  const [snovEmailConfig, setSnovEmailConfig] = useState({
    subject: "{{first_name}}, check out your personalized video",
    body: "Hi {{first_name}},\n\nI created a personalized video just for you. Check it out here:\n\n{{country}}\n\nLet me know what you think!\n\nBest regards",
    fromEmail: "",
    fromName: "",
  });
  const [sendingSnov, setSendingSnov] = useState(false);

  // Google Sheet import state
  const [gsheetDialogOpen, setGsheetDialogOpen] = useState(false);
  const [gsheetUrl, setGsheetUrl] = useState("");
  const [importingGsheet, setImportingGsheet] = useState(false);

  // Inline template name editing
  const [editingTemplateName, setEditingTemplateName] = useState<string | null>(null);
  const [templateNameDraft, setTemplateNameDraft] = useState("");

  // Snov.io stats state
  const [snovStatsDialogOpen, setSnovStatsDialogOpen] = useState(false);
  const [snovCampaigns, setSnovCampaigns] = useState<Array<{ id: number; name: string; listId: number; status: string; createdAt: string | null; startedAt: string | null }>>([]);
  const [loadingSnovCampaigns, setLoadingSnovCampaigns] = useState(false);
  const [selectedSnovCampaignForStats, setSelectedSnovCampaignForStats] = useState<number | null>(null);
  const [snovStats, setSnovStats] = useState<{ analytics: any; replies: any; opens: any; clicks: any } | null>(null);
  const [loadingSnovStats, setLoadingSnovStats] = useState(false);

  // Live campaign tracking per template
  const [liveTemplateIds, setLiveTemplateIds] = useState<Set<string>>(new Set());
  const [liveTemplateCampaigns, setLiveTemplateCampaigns] = useState<Record<string, string[]>>({});
  const [liveWarningDialogOpen, setLiveWarningDialogOpen] = useState(false);
  const [liveWarningTemplateName, setLiveWarningTemplateName] = useState("");
  const [liveWarningCampaignNames, setLiveWarningCampaignNames] = useState<string[]>([]);
  const [previewTemplateSlug, setPreviewTemplateSlug] = useState<string | null>(null);
  const [previewIsBuilder, setPreviewIsBuilder] = useState(false);
  const [showCampaignAnalytics, setShowCampaignAnalytics] = useState(false);
  const [liveWarningEditSlug, setLiveWarningEditSlug] = useState<string | null>(null);
  const [liveWarningIsBuilder, setLiveWarningIsBuilder] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [showContactMethods, setShowContactMethods] = useState(false);
  const [addContactsSheetOpen, setAddContactsSheetOpen] = useState(false);

  // Custom domain
  const [customDomain, setCustomDomain] = useState("");
  const [customDomainDraft, setCustomDomainDraft] = useState("");
  const [savingDomain, setSavingDomain] = useState(false);

  // Delete campaign confirmation
  const [deleteCampaignDialogOpen, setDeleteCampaignDialogOpen] = useState(false);
  const [deleteCampaignId, setDeleteCampaignId] = useState<string | null>(null);

  // Usage limits & upgrade dialog
  const usageLimits = useUsageLimits(user?.id);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [upgradeResourceType, setUpgradeResourceType] = useState<"page" | "campaign">("campaign");
  const [manageSubOpen, setManageSubOpen] = useState(false);

  // Email alert toggle
  const [alertConfirmDialogOpen, setAlertConfirmDialogOpen] = useState(false);
  const [alertConfirmCampaign, setAlertConfirmCampaign] = useState<Campaign | null>(null);
  const [ownerEmail, setOwnerEmail] = useState<string>("");
  const [_pagesReadyDismissed] = useState<Set<string>>(new Set()); // kept for type compat
  const [activeTab, setActiveTab] = useState(new URLSearchParams(window.location.search).get("tab") || "landing-pages");

  // Check authentication and admin role
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          setCheckingAuth(false);
          navigate("/auth");
          return;
        }
        
        // Check admin role using setTimeout to avoid deadlock
        setTimeout(() => {
          checkAdminRole(session.user.id);
        }, 0);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        setCheckingAuth(false);
        navigate("/auth");
        return;
      }
      
      checkAdminRole(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();

      if (error) {
        // If no role found, user is not admin
        setIsAdmin(false);
      } else {
        setIsAdmin(data?.role === "admin");
      }
    } catch {
      setIsAdmin(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCampaigns();
      fetchTemplates();
      fetchCustomDomain();
      checkSnovConnection();
      checkMailchimpConnection();
      if (isAdmin) {
        fetchInfoRequests();
        fetchLiveTemplateIds();
      }
    }
  }, [user, isAdmin]);

  const checkSnovConnection = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("integration_credentials" as any)
      .select("id")
      .eq("user_id", user.id)
      .eq("provider", "snov")
      .maybeSingle();
    setSnovConnected(!!(data as any)?.id);
  };

  const checkMailchimpConnection = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("integration_credentials" as any)
      .select("id")
      .eq("user_id", user.id)
      .eq("provider", "mailchimp")
      .maybeSingle();
    setMailchimpConnected(!!(data as any)?.id);
  };

  const fetchCustomDomain = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("custom_domain")
      .eq("user_id", user.id)
      .single();
    if (data?.custom_domain) {
      setCustomDomain(data.custom_domain);
      setCustomDomainDraft(data.custom_domain);
    }
  };

  const saveCustomDomain = async () => {
    if (!user) return;
    setSavingDomain(true);
    try {
      const domain = customDomainDraft.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
      const { error } = await supabase
        .from("profiles")
        .update({ custom_domain: domain || null })
        .eq("user_id", user.id);
      if (error) throw error;
      setCustomDomain(domain);
      toast({ title: domain ? "Custom domain saved" : "Custom domain removed" });
    } catch (err: any) {
      toast({ title: "Error saving domain", description: err.message, variant: "destructive" });
    } finally {
      setSavingDomain(false);
    }
  };

  // Determine which templates are actively used by campaigns with contacts
  const fetchLiveTemplateIds = async () => {
    try {
      const { data: allCampaigns } = await supabase
        .from("campaigns")
        .select("id, name, template_id");
      if (!allCampaigns || allCampaigns.length === 0) { setLiveTemplateIds(new Set()); setLiveTemplateCampaigns({}); return; }

      const liveIds = new Set<string>();
      const campaignMap: Record<string, string[]> = {};
      for (const campaign of allCampaigns) {
        if (!campaign.template_id) continue;
        const { count } = await supabase
          .from("personalized_pages")
          .select("*", { count: "exact", head: true })
          .eq("campaign_id", campaign.id);
        if (count && count > 0) {
          liveIds.add(campaign.template_id);
          if (!campaignMap[campaign.template_id]) campaignMap[campaign.template_id] = [];
          campaignMap[campaign.template_id].push(campaign.name);
        }
      }
      setLiveTemplateIds(liveIds);
      setLiveTemplateCampaigns(campaignMap);
    } catch (err) {
      console.error("Error fetching live template IDs:", err);
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

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("landing_page_templates")
        .select("id, name, slug, thumbnail_url, user_id, is_builder_template, hero_headline, hero_badge, hero_subheadline, logo_url, hero_video_thumbnail_url")
        .order("name");

      if (error) throw error;
      setTemplates((data as LandingPageTemplate[]) || []);
      
      // Set default template if none selected
      if (!selectedTemplateId && data && data.length > 0) {
        setSelectedTemplateId(data[0].id);
      }
    } catch (error: any) {
      console.error("Error fetching templates:", error.message);
    }
  };

  useEffect(() => {
    if (selectedCampaign) {
      fetchPages(selectedCampaign.id);
      setWorkflowCardsExpanded(true);
      setShowCampaignAnalytics(false);
      setShowContactMethods(false);
    }
  }, [selectedCampaign]);

  // Pages-ready popup removed per user request

  // Realtime browser notifications for page views
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('page-view-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'page_views' },
        async (payload) => {
          if (Notification.permission !== 'granted') return;
          const pageId = payload.new.personalized_page_id;
          // Look up the prospect info
          const { data: page } = await supabase
            .from('personalized_pages')
            .select('first_name, last_name, company, campaign_id')
            .eq('id', pageId)
            .single();
          if (!page) return;
          // Check if this campaign belongs to current user
          const { data: campaign } = await supabase
            .from('campaigns')
            .select('user_id, name')
            .eq('id', page.campaign_id)
            .single();
          if (!campaign || campaign.user_id !== user.id) return;
          const name = `${page.first_name} ${page.last_name || ''}`.trim();
          new Notification(`👀 ${name} viewed their page`, {
            body: `${page.company || 'Unknown company'} • ${campaign.name}`,
            icon: '/favicon.png',
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get page counts and view counts for each campaign
      const campaignsWithStats = await Promise.all(
        (data || []).map(async (campaign) => {
          const { count: pageCount } = await supabase
            .from("personalized_pages")
            .select("*", { count: "exact", head: true })
            .eq("campaign_id", campaign.id);

          const { data: viewData } = await supabase
            .from("page_views")
            .select("personalized_pages!inner(campaign_id)")
            .eq("personalized_pages.campaign_id", campaign.id);

          return {
            ...campaign,
            page_count: pageCount || 0,
            view_count: viewData?.length || 0,
          };
        })
      );

      setCampaigns(campaignsWithStats);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPages = async (campaignId: string) => {
    try {
      const { data, error } = await supabase
        .from("personalized_pages")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get view counts for each page
      const pagesWithViews = await Promise.all(
        (data || []).map(async (page) => {
          const { count } = await supabase
            .from("page_views")
            .select("*", { count: "exact", head: true })
            .eq("personalized_page_id", page.id);

          return {
            ...page,
            view_count: count || 0,
          };
        })
      );

      setPages(pagesWithViews);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchViewDetails = async (page: PersonalizedPage) => {
    setViewDetailsContact({ name: `${page.first_name} ${page.last_name || ""}`.trim(), view_count: page.view_count || 0 });
    setViewDetailsOpen(true);
    setViewDetailsLoading(true);
    try {
      const { data, error } = await supabase
        .from("page_views")
        .select("id, viewed_at, user_agent")
        .eq("personalized_page_id", page.id)
        .order("viewed_at", { ascending: false });

      if (error) throw error;
      setViewDetailsData(data || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setViewDetailsLoading(false);
    }
  };

  const createCampaign = async () => {
    if (!newCampaignName.trim() || !user || !selectedTemplateId) return;

    // Client-side limit check
    if (!usageLimits.canCreateCampaign) {
      setUpgradeResourceType("campaign");
      setUpgradeDialogOpen(true);
      return;
    }
    try {
      // If the selected template is a library template (user_id IS NULL),
      // check if the user has a personal clone and use that instead.
      let resolvedTemplateId = selectedTemplateId;
      const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
      if (selectedTemplate && !selectedTemplate.user_id) {
        const userClone = templates.find(
          t => t.user_id === user.id && t.slug?.startsWith(selectedTemplate.slug)
        );
        if (userClone) {
          resolvedTemplateId = userClone.id;
        }
      }

      const { error } = await supabase.from("campaigns").insert({
        name: newCampaignName.trim(),
        user_id: user.id,
        template_id: resolvedTemplateId,
      });

      if (error) throw error;

      toast({ title: "Campaign created!" });
      setNewCampaignName("");
      setCreateDialogOpen(false);
      fetchCampaigns();
      usageLimits.refetchLimits();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const confirmDeleteCampaign = (campaignId: string) => {
    setDeleteCampaignId(campaignId);
    setDeleteCampaignDialogOpen(true);
  };

  const deleteCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from("campaigns")
        .delete()
        .eq("id", campaignId);

      if (error) throw error;

      toast({ title: "Campaign deleted" });
      if (selectedCampaign?.id === campaignId) {
        setSelectedCampaign(null);
        setPages([]);
      }
      fetchCampaigns();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Sanitize CSV values to prevent formula injection (CSV injection attack)
  const sanitizeCsvValue = (value: string | undefined | null): string | null => {
    if (!value) return null;
    const trimmed = value.trim().replace(/^"|"$/g, "");
    if (!trimmed) return null;
    
    // Prefix formula characters with single quote to prevent execution in spreadsheets
    const formulaChars = ["=", "+", "-", "@", "\t", "\r"];
    if (formulaChars.some(char => trimmed.startsWith(char))) {
      return "'" + trimmed;
    }
    return trimmed;
  };

  // Enforce field length limits for CSV uploads
  const MAX_CSV_LENGTHS = {
    first_name: 100,
    last_name: 100,
    company: 100,
    custom_message: 500,
  };

  const truncateField = (value: string | null, maxLength: number): string | null => {
    if (!value) return null;
    return value.slice(0, maxLength);
  };

  // Maximum CSV file size (5MB)
  const MAX_CSV_SIZE = 5 * 1024 * 1024;

  const handleCsvUpload = async () => {
    if (!csvFile || !selectedCampaign) return;

    if (!usageLimits.canCreatePage) {
      setUpgradeResourceType("page");
      setUpgradeDialogOpen(true);
      return;
    }

    // Validate file size
    if (csvFile.size > MAX_CSV_SIZE) {
      toast({
        title: "File too large",
        description: "CSV file must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const text = await csvFile.text();
      const lines = text.split("\n").filter((line) => line.trim());
      
      if (lines.length < 2) {
        throw new Error("CSV must have a header row and at least one data row");
      }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      
      // Validate required headers
      const firstNameIndex = headers.findIndex((h) => 
        h === "first_name" || h === "firstname" || h === "first name"
      );
      
      if (firstNameIndex === -1) {
        throw new Error("CSV must have a 'first_name' column");
      }

      const lastNameIndex = headers.findIndex((h) => 
        h === "last_name" || h === "lastname" || h === "last name"
      );
      const companyIndex = headers.findIndex((h) => 
        h === "company" || h === "organization"
      );
      const messageIndex = headers.findIndex((h) => 
        h === "custom_message" || h === "message" || h === "custom message"
      );
      const emailIndex = headers.findIndex((h) => 
        h === "email" || h === "email_address" || h === "email address"
      );

      const pagesToCreate = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => sanitizeCsvValue(v));
        
        const firstName = truncateField(values[firstNameIndex], MAX_CSV_LENGTHS.first_name);
        if (!firstName) continue;

        pagesToCreate.push({
          campaign_id: selectedCampaign.id,
          template_id: selectedCampaign.template_id,
          first_name: firstName,
          last_name: truncateField(lastNameIndex >= 0 ? values[lastNameIndex] : null, MAX_CSV_LENGTHS.last_name),
          company: truncateField(companyIndex >= 0 ? values[companyIndex] : null, MAX_CSV_LENGTHS.company),
          custom_message: truncateField(messageIndex >= 0 ? values[messageIndex] : null, MAX_CSV_LENGTHS.custom_message),
          email: truncateField(emailIndex >= 0 ? values[emailIndex] : null, 255),
        });
      }

      if (pagesToCreate.length === 0) {
        throw new Error("No valid rows found in CSV");
      }

      const { error } = await supabase
        .from("personalized_pages")
        .insert(pagesToCreate);

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Created ${pagesToCreate.length} personalized pages`,
      });
      
      setCsvFile(null);
      setUploadDialogOpen(false);
      fetchPages(selectedCampaign.id);
      fetchCampaigns();
      usageLimits.refetchLimits();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleGsheetImport = async () => {
    if (!gsheetUrl.trim() || !selectedCampaign) return;
    if (!usageLimits.canCreatePage) {
      setUpgradeResourceType("page");
      setUpgradeDialogOpen(true);
      return;
    }
    setImportingGsheet(true);
    try {
      // Extract Google Sheet ID from various URL formats
      const match = gsheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) throw new Error("Invalid Google Sheet URL. Please paste a full Google Sheets link.");
      const sheetId = match[1];

      // Fetch as CSV via public export URL
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      const res = await fetch(csvUrl);
      if (!res.ok) throw new Error("Could not fetch the sheet. Make sure it's shared as 'Anyone with the link can view'.");
      const text = await res.text();

      const lines = text.split("\n").filter((line) => line.trim());
      if (lines.length < 2) throw new Error("Sheet must have a header row and at least one data row");

      // Parse CSV properly (handle quoted values with commas)
      const parseCsvLine = (line: string): string[] => {
        const result: string[] = [];
        let current = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/^"|"$/g, ""));
      const firstNameIndex = headers.findIndex((h) => h === "first_name" || h === "firstname" || h === "first name");
      if (firstNameIndex === -1) throw new Error("Sheet must have a 'first_name' column");

      const lastNameIndex = headers.findIndex((h) => h === "last_name" || h === "lastname" || h === "last name");
      const companyIndex = headers.findIndex((h) => h === "company" || h === "organization");
      const emailIndex = headers.findIndex((h) => h === "email" || h === "email_address" || h === "email address");
      const messageIndex = headers.findIndex((h) => h === "custom_message" || h === "message" || h === "custom message");

      const pagesToCreate = [];
      for (let i = 1; i < lines.length; i++) {
        const values = parseCsvLine(lines[i]).map((v) => sanitizeCsvValue(v));
        const firstName = truncateField(values[firstNameIndex], MAX_CSV_LENGTHS.first_name);
        if (!firstName) continue;
        pagesToCreate.push({
          campaign_id: selectedCampaign.id,
          template_id: selectedCampaign.template_id,
          first_name: firstName,
          last_name: truncateField(lastNameIndex >= 0 ? values[lastNameIndex] : null, MAX_CSV_LENGTHS.last_name),
          company: truncateField(companyIndex >= 0 ? values[companyIndex] : null, MAX_CSV_LENGTHS.company),
          custom_message: truncateField(messageIndex >= 0 ? values[messageIndex] : null, MAX_CSV_LENGTHS.custom_message),
          email: truncateField(emailIndex >= 0 ? values[emailIndex] : null, 255),
        });
      }

      if (pagesToCreate.length === 0) throw new Error("No valid rows found in sheet");

      const { error } = await supabase.from("personalized_pages").insert(pagesToCreate);
      if (error) throw error;

      toast({ title: "Success!", description: `Imported ${pagesToCreate.length} contacts from Google Sheet` });
      setGsheetUrl("");
      setGsheetDialogOpen(false);
      fetchPages(selectedCampaign.id);
      fetchCampaigns();
      usageLimits.refetchLimits();
    } catch (error: any) {
      toast({ title: "Import failed", description: error.message, variant: "destructive" });
    } finally {
      setImportingGsheet(false);
    }
  };

  const addSinglePerson = async () => {
    if (!newPerson.first_name.trim() || !selectedCampaign) return;

    setAddingPerson(true);
    try {
      const { data, error } = await supabase
        .from("personalized_pages")
        .insert({
          campaign_id: selectedCampaign.id,
          template_id: selectedCampaign.template_id,
          first_name: newPerson.first_name.trim(),
          last_name: newPerson.last_name.trim() || null,
          email: newPerson.email.trim() || null,
          company: newPerson.company.trim() || null,
          custom_message: newPerson.custom_message.trim() || null,
        })
        .select("token")
        .single();

      if (error) throw error;

      const pageUrl = `${window.location.origin}/view/${data.token}`;
      
      toast({
        title: "Page created!",
        description: "Link copied to clipboard",
      });
      
      navigator.clipboard.writeText(pageUrl);
      
      setNewPerson({ first_name: "", last_name: "", email: "", company: "", custom_message: "" });
      setAddPersonDialogOpen(false);
      fetchPages(selectedCampaign.id);
      fetchCampaigns();
      usageLimits.refetchLimits();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAddingPerson(false);
    }
  };

  const deletePage = async (pageId: string) => {
    try {
      const { error } = await supabase
        .from("personalized_pages")
        .delete()
        .eq("id", pageId);

      if (error) throw error;

      toast({ title: "Page deleted" });
      if (selectedCampaign) {
        fetchPages(selectedCampaign.id);
        fetchCampaigns();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const togglePagePause = async (pageId: string, currentlyPaused: boolean) => {
    try {
      const { error } = await supabase
        .from("personalized_pages")
        .update({ is_paused: !currentlyPaused })
        .eq("id", pageId);
      if (error) throw error;
      toast({ title: !currentlyPaused ? "Link paused" : "Link resumed" });
      if (selectedCampaign) fetchPages(selectedCampaign.id);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getPageUrl = (token: string) => {
    return `${window.location.origin}/view/${token}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard!" });
  };

  const openEditDialog = (page: PersonalizedPage) => {
    setEditingPage(page);
    setEditForm({
      first_name: page.first_name,
      last_name: page.last_name || "",
      company: page.company || "",
      email: (page as any).email || "",
    });
    setEditDialogOpen(true);
  };

  const saveEditContact = async () => {
    if (!editingPage || !editForm.first_name.trim()) return;
    setSavingEdit(true);
    try {
      const { error } = await supabase
        .from("personalized_pages")
        .update({
          first_name: editForm.first_name.trim(),
          last_name: editForm.last_name.trim() || null,
          company: editForm.company.trim() || null,
          email: editForm.email.trim() || null,
        })
        .eq("id", editingPage.id);
      if (error) throw error;
      toast({ title: "Contact updated!" });
      setEditDialogOpen(false);
      setEditingPage(null);
      if (selectedCampaign) fetchPages(selectedCampaign.id);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleAlertToggle = (campaign: Campaign) => {
    if (campaign.alert_on_view) {
      // Turning off — no confirmation needed
      toggleAlertOnView(campaign, false);
    } else {
      // Turning on — show confirmation dialog
      setAlertConfirmCampaign(campaign);
      setOwnerEmail(user?.email || "");
      setAlertConfirmDialogOpen(true);
    }
  };

  const toggleAlertOnView = async (campaign: Campaign, newValue: boolean) => {
    try {
      const { error } = await supabase
        .from("campaigns")
        .update({ alert_on_view: newValue })
        .eq("id", campaign.id);
      if (error) throw error;

      // Update local state
      setCampaigns(prev => prev.map(c => c.id === campaign.id ? { ...c, alert_on_view: newValue } : c));
      if (selectedCampaign?.id === campaign.id) {
        setSelectedCampaign(prev => prev ? { ...prev, alert_on_view: newValue } : prev);
      }
      toast({ title: newValue ? "Email alerts enabled" : "Email alerts disabled" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const openTestEmail = () => {
    setTestEmailDialogOpen(true);
  };

  const handleSendTestEmail = () => {
    if (pages.length === 0 || !user) return;
    const firstContact = pages[0];
    const pageLink = getPageUrl(firstContact.token);
    const subject = encodeURIComponent(`Test: Personalized page for ${firstContact.first_name}${firstContact.company ? ` at ${firstContact.company}` : ""}`);
    const body = encodeURIComponent(
      `Hi ${firstContact.first_name},\n\nI created a personalized video just for you. Check it out here:\n\n${pageLink}\n\nLet me know what you think!\n\nBest regards`
    );
    const mailto = `mailto:${user.email}?subject=${subject}&body=${body}`;
    window.open(mailto, "_blank");
    setTestEmailDialogOpen(false);
  };

  const handleDownloadCsv = () => {
    if (!selectedCampaign || pages.length === 0) return;
    
    // CSV header
    const headers = ["First Name", "Last Name", "Company", "Email", "Personalized Page"];
    
    // Build CSV rows
    const rows = pages.map((page) => {
      const escapeCsvValue = (value: string | null | undefined): string => {
        if (!value) return "";
        // Escape double quotes by doubling them, wrap in quotes if contains comma, newline, or quote
        const escaped = value.replace(/"/g, '""');
        if (escaped.includes(",") || escaped.includes("\n") || escaped.includes('"')) {
          return `"${escaped}"`;
        }
        return escaped;
      };
      
      return [
        escapeCsvValue(page.first_name),
        escapeCsvValue(page.last_name),
        escapeCsvValue(page.company),
        escapeCsvValue((page as any).email),
        getPageUrl(page.token),
      ].join(",");
    });
    
    const csvContent = [headers.join(","), ...rows].join("\n");
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${selectedCampaign.name.replace(/[^a-z0-9]/gi, "_")}_contacts.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({ title: "CSV downloaded!" });
  };

  // Snov.io functions
  const fetchSnovLists = async () => {
    setLoadingSnovLists(true);
    try {
      const { data, error } = await supabase.functions.invoke("snov-get-lists");
      
      if (error) throw error;
      
      if (data.success && data.lists) {
        setSnovLists(data.lists);
      } else {
        throw new Error(data.error || "Failed to fetch Snov.io lists");
      }
    } catch (error: any) {
      toast({
        title: "Error fetching Snov.io lists",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingSnovLists(false);
    }
  };

  const sendSnovCampaign = async () => {
    if (!selectedSnovList || !selectedSnovCampaignList || !selectedCampaign) {
      toast({
        title: "Missing selection",
        description: "Please select both source list and target campaign list",
        variant: "destructive",
      });
      return;
    }

    setSendingSnov(true);
    try {
      const { data, error } = await supabase.functions.invoke("snov-send-campaign", {
        body: {
          listId: selectedSnovList,
          campaignId: selectedCampaign.id,
          snovCampaignListId: selectedSnovCampaignList,
          templateId: selectedCampaign.template_id,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Campaign sent!",
          description: `Added ${data.added} prospects to Snov.io campaign. ${data.errors > 0 ? `${data.errors} errors.` : ""}`,
        });
        setSnovDialogOpen(false);
        setUsedSnovWorkflow(true);
        fetchCampaigns();
        if (selectedCampaign) {
          fetchPages(selectedCampaign.id);
        }
      } else {
        throw new Error(data.error || "Failed to send campaign");
      }
    } catch (error: any) {
      toast({
        title: "Error sending campaign",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSendingSnov(false);
    }
  };

  const openSnovDialog = () => {
    setSnovDialogOpen(true);
    fetchSnovLists();
    setWorkflowCardsExpanded(false);
  };

  const fetchSnovCampaigns = async () => {
    setLoadingSnovCampaigns(true);
    try {
      const { data, error } = await supabase.functions.invoke("snov-get-campaigns");
      if (error) throw error;
      if (data.success && data.campaigns) {
        setSnovCampaigns(data.campaigns);
      } else {
        throw new Error(data.error || "Failed to fetch campaigns");
      }
    } catch (error: any) {
      toast({ title: "Error fetching Snov.io campaigns", description: error.message, variant: "destructive" });
    } finally {
      setLoadingSnovCampaigns(false);
    }
  };

  const fetchSnovCampaignStats = async (snovCampaignId: number) => {
    setLoadingSnovStats(true);
    setSnovStats(null);
    setSelectedSnovCampaignForStats(snovCampaignId);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/snov-get-campaign-stats?snovCampaignId=${snovCampaignId}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${session?.access_token}`,
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to fetch stats");
      }
      setSnovStats({
        analytics: result.analytics,
        replies: result.replies,
        opens: result.opens,
        clicks: result.clicks,
      });
    } catch (error: any) {
      toast({ title: "Error fetching stats", description: error.message, variant: "destructive" });
    } finally {
      setLoadingSnovStats(false);
    }
  };

  const openSnovStatsDialog = () => {
    setSnovStatsDialogOpen(true);
    setSnovStats(null);
    setSelectedSnovCampaignForStats(null);
    fetchSnovCampaigns();
  };

  // Mailchimp functions
  const openMailchimpDialog = async () => {
    setMailchimpDialogOpen(true);
    setSelectedMailchimpList(null);
    setLoadingMailchimpLists(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mailchimp-get-lists`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      const data = await res.json();
      if (data.success) {
        setMailchimpLists(data.lists || []);
      } else {
        throw new Error(data.error || "Failed to fetch audiences");
      }
    } catch (error: any) {
      toast({ title: "Error fetching Mailchimp audiences", description: error.message, variant: "destructive" });
    } finally {
      setLoadingMailchimpLists(false);
    }
  };

  const sendMailchimpCampaign = async () => {
    if (!selectedMailchimpList || !selectedCampaign) {
      toast({ title: "Select an audience", description: "Please select a Mailchimp audience to import.", variant: "destructive" });
      return;
    }
    setSendingMailchimp(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mailchimp-send-campaign`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            listId: selectedMailchimpList,
            campaignId: selectedCampaign.id,
            templateId: selectedCampaign.template_id,
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Success!",
          description: `Enriched ${data.added} contacts. Use *|PPAGE|* in your Mailchimp email template for the personalized link.`,
        });
        setMailchimpDialogOpen(false);
        setAddContactsSheetOpen(false);
        fetchPages(selectedCampaign.id);
        fetchCampaigns();
        usageLimits.refetchLimits();
      } else {
        throw new Error(data.error || "Failed to enrich contacts");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSendingMailchimp(false);
    }
  };

  const duplicateTemplate = async (templateSlug: string) => {
    if (!user) return;
    setDuplicating(templateSlug);
    try {
      // Check if user already has a clone of this template (by matching slug prefix)
      const existingClone = templates.find(
        (t) => t.user_id === user.id && t.slug.startsWith(`${templateSlug}-copy-`)
      );
      if (existingClone) {
        // Navigate to existing clone instead of creating another
        navigate(existingClone.is_builder_template ? `/builder/${existingClone.slug}` : `/template-editor/${existingClone.slug}`);
        return;
      }

      const { data: source, error: fetchErr } = await supabase
        .from("landing_page_templates")
        .select("*")
        .eq("slug", templateSlug)
        .single();
      if (fetchErr || !source) throw fetchErr || new Error("Template not found");

      const timestamp = Date.now().toString(36);
      const newSlug = `${source.slug}-copy-${timestamp}`;
      const newName = `${source.name} (Copy)`;

      const { id, slug, name, created_at, updated_at, user_id: _uid, ...rest } = source;

      // Replace company branding in cloned content
      const replaceKicker = (val: string | null) => val ? val.replace(/Kicker Video/gi, 'My Company').replace(/Kicker/gi, 'My Company') : val;
      const cloneData = {
        ...rest,
        slug: newSlug,
        name: newName,
        user_id: user.id,
        hero_headline: replaceKicker(rest.hero_headline),
        hero_subheadline: replaceKicker(rest.hero_subheadline),
        hero_badge: replaceKicker(rest.hero_badge),
        about_content: replaceKicker(rest.about_content),
        features_title: replaceKicker(rest.features_title),
        features_subtitle: replaceKicker(rest.features_subtitle),
        contact_title: replaceKicker(rest.contact_title),
        contact_subtitle: replaceKicker(rest.contact_subtitle),
        comparison_problem_title: replaceKicker(rest.comparison_problem_title),
        comparison_solution_title: replaceKicker(rest.comparison_solution_title),
        comparison_solution_description: replaceKicker(rest.comparison_solution_description),
        cta_banner_title: replaceKicker(rest.cta_banner_title),
        cta_banner_subtitle: replaceKicker(rest.cta_banner_subtitle),
        testimonials_title: replaceKicker(rest.testimonials_title),
        testimonials_subtitle: replaceKicker(rest.testimonials_subtitle),
        pricing_title: replaceKicker(rest.pricing_title),
        pricing_subtitle: replaceKicker(rest.pricing_subtitle),
        form_section_title: replaceKicker(rest.form_section_title),
        form_section_subtitle: replaceKicker(rest.form_section_subtitle),
      };

      const { error: insertErr } = await supabase
        .from("landing_page_templates")
        .insert(cloneData as any);
      if (insertErr) throw insertErr;

      toast({ title: "Template cloned!", description: `"${newName}" added to My Templates.` });
      fetchTemplates();
    } catch (err: any) {
      toast({ title: "Error duplicating", description: err.message, variant: "destructive" });
    } finally {
      setDuplicating(null);
    }
  };

  // Force-create a duplicate (used by the explicit Duplicate button on My Templates)
  const forceDuplicateTemplate = async (templateSlug: string) => {
    if (!user) return;
    setDuplicating(templateSlug);
    try {
      const { data: source, error: fetchErr } = await supabase
        .from("landing_page_templates")
        .select("*")
        .eq("slug", templateSlug)
        .single();
      if (fetchErr || !source) throw fetchErr || new Error("Template not found");

      const timestamp = Date.now().toString(36);
      const newSlug = `${source.slug}-copy-${timestamp}`;
      const newName = `${source.name} (Copy)`;
      const { id, slug, name, created_at, updated_at, user_id: _uid, ...rest } = source;
      const cloneData = { ...rest, slug: newSlug, name: newName, user_id: user.id };

      const { error: insertErr } = await supabase
        .from("landing_page_templates")
        .insert(cloneData as any);
      if (insertErr) throw insertErr;

      toast({ title: "Template duplicated!", description: `"${newName}" added to My Templates.` });
      fetchTemplates();
    } catch (err: any) {
      toast({ title: "Error duplicating", description: err.message, variant: "destructive" });
    } finally {
      setDuplicating(null);
    }
  };

  const saveTemplateName = async (templateId: string) => {
    const trimmed = templateNameDraft.trim();
    if (!trimmed) { setEditingTemplateName(null); return; }
    try {
      const { error } = await supabase
        .from("landing_page_templates")
        .update({ name: trimmed })
        .eq("id", templateId);
      if (error) throw error;
      toast({ title: "Template renamed" });
      fetchTemplates();
    } catch (err: any) {
      toast({ title: "Error renaming", description: err.message, variant: "destructive" });
    } finally {
      setEditingTemplateName(null);
    }
  };

  const deleteTemplate = async (templateSlug: string, templateName: string) => {
    if (!confirm(`Delete "${templateName}"? This cannot be undone. Any campaigns using this template will be unlinked.`)) return;
    try {
      // First, get the template id
      const { data: tmpl } = await supabase
        .from("landing_page_templates")
        .select("id")
        .eq("slug", templateSlug)
        .maybeSingle();
      if (tmpl) {
        // Unlink any personalized pages referencing this template
        await supabase
          .from("personalized_pages")
          .update({ template_id: null })
          .eq("template_id", tmpl.id);
        // Unlink any campaigns referencing this template
        await supabase
          .from("campaigns")
          .update({ template_id: null })
          .eq("template_id", tmpl.id);
      }
      const { error } = await supabase
        .from("landing_page_templates")
        .delete()
        .eq("slug", templateSlug);
      if (error) throw error;
      toast({ title: "Template deleted" });
      fetchTemplates();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // Loading state
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Non-admin users get the same dashboard but without admin-only features
  // RLS ensures they only see their own data

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <BrandLogo className="h-8" />
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => {
              setActiveTab("settings");
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => navigate("/admin-dashboard")}>
                <Shield className="w-4 h-4 mr-2" />
                Admin Dashboard
              </Button>
            )}
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Usage limit banner */}
        <UsageLimitBanner {...usageLimits} />

        <DashboardOnboarding
          templateCount={templates.filter(t => t.user_id === user?.id).length}
          liveTemplateIds={liveTemplateIds}
          activeCampaignCount={campaigns.filter(c => (c.page_count || 0) > 0).length}
          totalLinks={campaigns.reduce((sum, c) => sum + (c.page_count || 0), 0)}
          onGoToCampaigns={() => {
            setActiveTab("campaigns");
          }}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between gap-4">
          <TabsList>

            <TabsTrigger value="landing-pages" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Layout className="w-4 h-4 mr-2" />
              Landing Pages
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Campaigns</TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="beta-questions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <HelpCircle className="w-4 h-4 mr-2" />
                Beta Questions {infoRequestCount > 0 && <span className="ml-1.5 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-primary/20 text-primary">{infoRequestCount}</span>}
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="form-submissions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <FileText className="w-4 h-4 mr-2" />
                Form Submissions
              </TabsTrigger>
            )}
            <TabsTrigger value="variables" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Braces className="w-4 h-4 mr-2" />
              Variables
            </TabsTrigger>
          </TabsList>
          <LifetimeLinksMetric userId={user?.id} />
          </div>

          {/* Landing Pages Tab */}
          <TabsContent value="landing-pages" className="space-y-6">
            <TemplatePageGrid
              templates={templates}
              userId={user?.id}
              isAdmin={isAdmin}
              liveTemplateIds={liveTemplateIds}
              liveTemplateCampaigns={liveTemplateCampaigns}
              duplicating={duplicating}
              editingTemplateName={editingTemplateName}
              templateNameDraft={templateNameDraft}
              onSetEditingTemplateName={setEditingTemplateName}
              onSetTemplateNameDraft={setTemplateNameDraft}
              onSaveTemplateName={saveTemplateName}
              onPreview={(slug, isBuilder) => { setPreviewTemplateSlug(slug); setPreviewIsBuilder(isBuilder); }}
              onEdit={() => {}}
              onLiveWarning={(name, campaigns) => {
                setLiveWarningTemplateName(name);
                setLiveWarningCampaignNames(campaigns);
                setLiveWarningDialogOpen(true);
              }}
              onLiveWarningEdit={(name, campaigns, slug, isBuilder) => {
                setLiveWarningTemplateName(name);
                setLiveWarningCampaignNames(campaigns);
                setLiveWarningEditSlug(slug);
                setLiveWarningIsBuilder(isBuilder);
                setLiveWarningDialogOpen(true);
              }}
              onDuplicate={duplicateTemplate}
              onForceDuplicate={forceDuplicateTemplate}
              onDelete={deleteTemplate}
            />
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Campaigns</h2>
                <p className="text-muted-foreground">
                  Create personalized landing pages for your prospects
                </p>
              </div>

              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Campaign
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Campaign</DialogTitle>
                  </DialogHeader>
                  {templates.length === 0 ? (
                    <div className="text-center py-6 space-y-3">
                      <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto" />
                      <p className="text-sm text-muted-foreground">
                        You need at least one published landing page before creating a campaign.
                      </p>
                      <Button variant="outline" onClick={() => { setCreateDialogOpen(false); navigate("/builder"); }}>
                        <Layout className="w-4 h-4 mr-2" />
                        Create a Landing Page
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label htmlFor="campaign-name">Campaign Name</Label>
                        <Input
                          id="campaign-name"
                          value={newCampaignName}
                          onChange={(e) => setNewCampaignName(e.target.value)}
                          placeholder="e.g., Q1 Outreach"
                          autoFocus
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="template-select">Landing Page</Label>
                        <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                          <SelectTrigger id="template-select">
                            <SelectValue placeholder="Select a landing page" />
                          </SelectTrigger>
                          <SelectContent>
                            {templates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" className="flex-1" onClick={() => setCreateDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={createCampaign} className="flex-1" disabled={!selectedTemplateId || !newCampaignName.trim()}>
                          Continue
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-lg border border-border">
                <h3 className="text-lg font-medium text-foreground mb-2">No campaigns yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first campaign to start generating personalized pages.
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Campaign
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Campaign List - hidden when a campaign is selected */}
                {!selectedCampaign && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {campaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      onClick={() => setSelectedCampaign(campaign)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedCampaign?.id === campaign.id
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-foreground">{campaign.name}</h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                            <span>{campaign.page_count} pages</span>
                            <span className="flex items-center gap-1">
                              <BarChart3 className="w-3 h-3" />
                              {campaign.view_count} views
                            </span>
                            <span className="text-xs">
                              {new Date(campaign.created_at).toLocaleDateString(undefined, { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                            onClick={(e) => {
                            e.stopPropagation();
                            confirmDeleteCampaign(campaign.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                )}

                {/* Campaign Details - Full Width */}
                {selectedCampaign ? (
                  <div className="space-y-6">
                    {showCampaignAnalytics ? (
                      <CampaignAnalyticsPanel
                        campaignId={selectedCampaign.id}
                        campaignName={selectedCampaign.name}
                        onBack={() => setShowCampaignAnalytics(false)}
                      />
                    ) : (
                    <div className="space-y-4">
                    {/* Campaign Header - Compact */}
                    <div className="bg-card rounded-lg border border-border px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedCampaign(null)}>
                          <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <h3 className="text-lg font-semibold text-foreground">
                          {selectedCampaign.name}
                        </h3>
                        <span className="text-sm text-muted-foreground">{pages.length} contacts</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {pages.length > 0 && (
                          <>
                            <Button variant="outline" size="sm" className="h-8" onClick={() => setShowCampaignAnalytics(true)}>
                              <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                              Stats
                            </Button>
                            <Button variant="outline" size="sm" className="h-8" onClick={openTestEmail}>
                              <Mail className="w-3.5 h-3.5 mr-1.5" />
                              Test Email
                            </Button>
                            <Button variant="outline" size="sm" className="h-8" onClick={handleDownloadCsv}>
                              <Download className="w-3.5 h-3.5 mr-1.5" />
                              CSV
                            </Button>
                          </>
                        )}
                        {usedSnovWorkflow && (
                          <Button size="sm" variant="outline" className="h-8" onClick={openSnovStatsDialog}>
                            <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                            Snov Stats
                          </Button>
                        )}

                        {/* Settings dropdown - alerts & Google Sheets */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8">
                              <Settings className="w-3.5 h-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <div className="px-3 py-2 space-y-3">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm flex items-center gap-1.5 cursor-pointer">
                                  <Bell className="w-3.5 h-3.5" />
                                  Email Alerts
                                </Label>
                                <Switch
                                  checked={!!selectedCampaign.alert_on_view}
                                  onCheckedChange={() => handleAlertToggle(selectedCampaign)}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <Label className="text-sm flex items-center gap-1.5 cursor-pointer">
                                  <BellRing className="w-3.5 h-3.5" />
                                  Browser Alerts
                                </Label>
                                <Switch
                                  checked={Notification.permission === "granted"}
                                  onCheckedChange={async (checked) => {
                                    if (checked) {
                                      const permission = await Notification.requestPermission();
                                      if (permission === "granted") {
                                        toast({ title: "Browser notifications enabled" });
                                      } else {
                                        toast({ title: "Permission denied", description: "Please allow notifications in your browser settings.", variant: "destructive" });
                                      }
                                    }
                                  }}
                                />
                              </div>
                            </div>
                            <DropdownMenuItem onClick={() => setGsheetDialogOpen(true)}>
                              <ExternalLink className="w-3.5 h-3.5 mr-2" />
                              Import Google Sheet
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Add Contacts button - opens side drawer */}
                        <Sheet open={addContactsSheetOpen} onOpenChange={setAddContactsSheetOpen}>
                          <SheetTrigger asChild>
                            <Button size="sm" className="h-8">
                              <Plus className="w-3.5 h-3.5 mr-1.5" />
                              Add Contacts
                            </Button>
                          </SheetTrigger>
                          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                            <SheetHeader>
                              <SheetTitle>Add Contacts</SheetTitle>
                            </SheetHeader>
                            <div className="space-y-6 mt-6">
                              {/* Manual Import — Primary */}
                              <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Upload className="w-4 h-4 text-primary" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-foreground text-sm">Upload CSV</h4>
                                    <p className="text-xs text-muted-foreground">Upload contacts and download personalized links</p>
                                  </div>
                                </div>
                                <ManualImportFlow
                                  campaignId={selectedCampaign.id}
                                  templateId={selectedCampaign.template_id}
                                  templateSlug={(() => {
                                    const t = templates.find(t => t.id === selectedCampaign.template_id);
                                    return t?.slug || null;
                                  })()}
                                  isBuilderTemplate={(() => {
                                    const t = templates.find(t => t.id === selectedCampaign.template_id);
                                    return !!t?.is_builder_template;
                                  })()}
                                  customDomain={customDomain || undefined}
                                  onGenerationComplete={() => {
                                    if (selectedCampaign) {
                                      fetchPages(selectedCampaign.id);
                                      fetchCampaigns();
                                      usageLimits.refetchLimits();
                                    }
                                  }}
                                />

                                {/* Add single person */}
                                <div className="pt-2 border-t border-border">
                                  <Dialog open={addPersonDialogOpen} onOpenChange={(open) => { setAddPersonDialogOpen(open); }}>
                                    <DialogTrigger asChild>
                                      <Button variant="ghost" size="sm" className="text-muted-foreground">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Or add a single person manually
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Add Person</DialogTitle>
                                        <DialogDescription>
                                          Create a personalized page for a single person.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4 pt-4">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-2">
                                            <Label htmlFor="first-name">First Name *</Label>
                                            <Input
                                              id="first-name"
                                              value={newPerson.first_name}
                                              onChange={(e) => setNewPerson({ ...newPerson, first_name: e.target.value })}
                                              placeholder="John"
                                            />
                                          </div>
                                          <div className="space-y-2">
                                            <Label htmlFor="last-name">Last Name</Label>
                                            <Input
                                              id="last-name"
                                              value={newPerson.last_name}
                                              onChange={(e) => setNewPerson({ ...newPerson, last_name: e.target.value })}
                                              placeholder="Doe"
                                            />
                                          </div>
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor="email">Email</Label>
                                          <Input
                                            id="email"
                                            type="email"
                                            value={newPerson.email || ''}
                                            onChange={(e) => setNewPerson({ ...newPerson, email: e.target.value })}
                                            placeholder="john@example.com"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor="company">Company</Label>
                                          <Input
                                            id="company"
                                            value={newPerson.company}
                                            onChange={(e) => setNewPerson({ ...newPerson, company: e.target.value })}
                                            placeholder="Acme Inc."
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor="custom-message">Custom Message</Label>
                                          <Textarea
                                            id="custom-message"
                                            value={newPerson.custom_message}
                                            onChange={(e) => setNewPerson({ ...newPerson, custom_message: e.target.value })}
                                            placeholder="Optional personalized message..."
                                            rows={3}
                                          />
                                        </div>
                                        <Button onClick={addSinglePerson} className="w-full" disabled={addingPerson}>
                                          {addingPerson ? "Creating..." : "Create Page & Copy Link"}
                                        </Button>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              </div>

                              {/* Divider */}
                              <div className="flex items-center gap-3">
                                <div className="flex-1 h-px bg-border" />
                                <span className="text-xs text-muted-foreground">Integrations</span>
                                <div className="flex-1 h-px bg-border" />
                              </div>

                              {/* Snov.io + LinkedIn */}
                              <div className="space-y-3">
                                {snovConnected ? (
                                <Dialog open={snovDialogOpen} onOpenChange={setSnovDialogOpen}>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start" onClick={openSnovDialog}>
                                      <Send className="w-4 h-4 mr-2" />
                                      Import from Snov.io
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-lg">
                                    <DialogHeader>
                                      <DialogTitle>Send Campaign via Snov.io</DialogTitle>
                                      <DialogDescription>
                                        Import contacts from a Snov.io list and enrich with personalized links.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 pt-4">
                                      {loadingSnovLists ? (
                                        <div className="flex items-center justify-center py-4">
                                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                        </div>
                                      ) : snovLists.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No lists found. Create a list in Snov.io first.</p>
                                      ) : (
                                        <>
                                          <div className="space-y-2">
                                            <Label>Source List (get contacts from)</Label>
                                            <div className="grid gap-2 max-h-32 overflow-y-auto">
                                              {snovLists.map((list) => (
                                                <div
                                                  key={list.id}
                                                  onClick={() => setSelectedSnovList(list.id)}
                                                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                                    selectedSnovList === list.id
                                                      ? "border-primary bg-primary/10"
                                                      : "border-border hover:border-primary/50"
                                                  }`}
                                                >
                                                  <div className="flex justify-between items-center">
                                                    <span className="font-medium">{list.name}</span>
                                                    <span className="text-sm text-muted-foreground">{list.contacts} contacts</span>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>

                                          <div className="space-y-2">
                                            <Label>Target List (to enrich with personalized links)</Label>
                                            <p className="text-xs text-muted-foreground">
                                              This list should have a campaign configured in Snov.io. Use {"{{landing_page}}"} in your email template for the personalized page URL.
                                            </p>
                                            <div className="grid gap-2 max-h-32 overflow-y-auto">
                                              {snovLists.map((list) => (
                                                <div
                                                  key={list.id}
                                                  onClick={() => setSelectedSnovCampaignList(list.id)}
                                                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                                    selectedSnovCampaignList === list.id
                                                      ? "border-primary bg-primary/10"
                                                      : "border-border hover:border-primary/50"
                                                  }`}
                                                >
                                                  <div className="flex justify-between items-center">
                                                    <span className="font-medium">{list.name}</span>
                                                    <span className="text-sm text-muted-foreground">{list.contacts} contacts</span>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        </>
                                      )}

                                      <Button 
                                        onClick={sendSnovCampaign} 
                                        className="w-full" 
                                        disabled={!selectedSnovList || !selectedSnovCampaignList || sendingSnov}
                                      >
                                        {sendingSnov ? (
                                          <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                                            Sending...
                                          </>
                                        ) : (
                                          <>
                                            <Send className="w-4 h-4 mr-2" />
                                            Add to Snov.io Campaign
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                ) : (
                                  <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => {
                                      setAddContactsSheetOpen(false);
                                      setActiveTab("settings");
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                  >
                                    <Send className="w-4 h-4 mr-2" />
                                    Connect Snov.io
                                    <span className="ml-auto text-xs text-muted-foreground">Set up in Settings</span>
                                  </Button>
                                )}

                                {/* Mailchimp */}
                                {mailchimpConnected ? (
                                <Dialog open={mailchimpDialogOpen} onOpenChange={setMailchimpDialogOpen}>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start" onClick={openMailchimpDialog}>
                                      <Mail className="w-4 h-4 mr-2" />
                                      Import from Mailchimp
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-lg">
                                    <DialogHeader>
                                      <DialogTitle>Import from Mailchimp</DialogTitle>
                                      <DialogDescription>
                                        Select a Mailchimp audience. We'll create personalized pages and write the link back as a merge field.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 pt-4">
                                      {loadingMailchimpLists ? (
                                        <div className="flex items-center justify-center py-4">
                                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                        </div>
                                      ) : mailchimpLists.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No audiences found. Create an audience in Mailchimp first.</p>
                                      ) : (
                                        <div className="space-y-2">
                                          <Label>Select Audience</Label>
                                          <div className="grid gap-2 max-h-48 overflow-y-auto">
                                            {mailchimpLists.map((list) => (
                                              <div
                                                key={list.id}
                                                onClick={() => setSelectedMailchimpList(list.id)}
                                                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                                  selectedMailchimpList === list.id
                                                    ? "border-primary bg-primary/10"
                                                    : "border-border hover:border-primary/50"
                                                }`}
                                              >
                                                <div className="flex justify-between items-center">
                                                  <span className="font-medium">{list.name}</span>
                                                  <span className="text-sm text-muted-foreground">{list.memberCount} members</span>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                          <p className="text-xs text-muted-foreground">
                                            Each contact will get a personalized page. Use <code>*|PPAGE|*</code> in your Mailchimp email template for the link.
                                          </p>
                                        </div>
                                      )}

                                      <Button
                                        onClick={sendMailchimpCampaign}
                                        className="w-full"
                                        disabled={!selectedMailchimpList || sendingMailchimp}
                                      >
                                        {sendingMailchimp ? (
                                          <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                                            Enriching contacts...
                                          </>
                                        ) : (
                                          <>
                                            <Mail className="w-4 h-4 mr-2" />
                                            Import & Enrich
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                ) : (
                                  <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => {
                                      setAddContactsSheetOpen(false);
                                      setActiveTab("settings");
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                  >
                                    <Mail className="w-4 h-4 mr-2" />
                                    Connect Mailchimp
                                    <span className="ml-auto text-xs text-muted-foreground">Set up in Settings</span>
                                  </Button>
                                )}

                                <LinkedInEnrichDialog
                                  campaignId={selectedCampaign.id}
                                  templateId={selectedCampaign.template_id}
                                  onContactAdded={() => { fetchPages(selectedCampaign.id); fetchCampaigns(); usageLimits.refetchLimits(); }}
                                />
                              </div>
                            </div>
                          </SheetContent>
                        </Sheet>
                      </div>
                    </div>

                    {/* Snov.io Campaign Stats Dialog - kept as standalone dialog */}
                    <Dialog open={snovStatsDialogOpen} onOpenChange={setSnovStatsDialogOpen}>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Snov.io Campaign Stats</DialogTitle>
                          <DialogDescription>
                            View email engagement analytics from your Snov.io campaigns.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          {loadingSnovCampaigns ? (
                            <div className="flex items-center justify-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            </div>
                          ) : snovCampaigns.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No Snov.io campaigns found.</p>
                          ) : (
                            <>
                              <div className="space-y-2">
                                <Label>Select a Snov.io Campaign</Label>
                                <Select
                                  value={selectedSnovCampaignForStats?.toString() || ""}
                                  onValueChange={(val) => fetchSnovCampaignStats(parseInt(val, 10))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choose a campaign..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {snovCampaigns.map((c) => (
                                      <SelectItem key={c.id} value={c.id.toString()}>
                                        {c.name} ({c.status})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {loadingSnovStats && (
                                <div className="flex items-center justify-center py-8">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                </div>
                              )}

                              {snovStats && !loadingSnovStats && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {(() => {
                                      const a = snovStats.analytics;
                                      const stats = Array.isArray(a) ? a[0] : a;
                                      return (
                                        <>
                                          <div className="bg-muted rounded-lg p-3 text-center">
                                            <p className="text-2xl font-bold text-foreground">{stats?.sent || stats?.emails_sent || 0}</p>
                                            <p className="text-xs text-muted-foreground">Sent</p>
                                          </div>
                                          <div className="bg-muted rounded-lg p-3 text-center">
                                            <p className="text-2xl font-bold text-foreground">{stats?.opened || stats?.opens || 0}</p>
                                            <p className="text-xs text-muted-foreground">Opens</p>
                                          </div>
                                          <div className="bg-muted rounded-lg p-3 text-center">
                                            <p className="text-2xl font-bold text-foreground">{stats?.replied || stats?.replies || 0}</p>
                                            <p className="text-xs text-muted-foreground">Replies</p>
                                          </div>
                                          <div className="bg-muted rounded-lg p-3 text-center">
                                            <p className="text-2xl font-bold text-foreground">{stats?.clicked || stats?.clicks || 0}</p>
                                            <p className="text-xs text-muted-foreground">Clicks</p>
                                          </div>
                                        </>
                                      );
                                    })()}
                                  </div>

                                  {snovStats.replies && (
                                    <div>
                                      <h4 className="text-sm font-semibold text-foreground mb-2">Recent Replies</h4>
                                      {(() => {
                                        const replyList = snovStats.replies?.replies || snovStats.replies?.data || [];
                                        if (!Array.isArray(replyList) || replyList.length === 0) {
                                          return <p className="text-sm text-muted-foreground">No replies yet.</p>;
                                        }
                                        return (
                                          <div className="max-h-40 overflow-y-auto space-y-2">
                                            {replyList.slice(0, 10).map((r: any, i: number) => (
                                              <div key={i} className="bg-muted rounded-lg p-3 text-sm">
                                                <p className="font-medium text-foreground">{r.email || r.prospect_email || "Unknown"}</p>
                                                {r.replied_at && <p className="text-xs text-muted-foreground">{new Date(r.replied_at).toLocaleString()}</p>}
                                              </div>
                                            ))}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  )}

                                  {snovStats.opens && (
                                    <div>
                                      <h4 className="text-sm font-semibold text-foreground mb-2">Recent Opens</h4>
                                      {(() => {
                                        const openList = snovStats.opens?.recipients || snovStats.opens?.data || [];
                                        if (!Array.isArray(openList) || openList.length === 0) {
                                          return <p className="text-sm text-muted-foreground">No opens tracked.</p>;
                                        }
                                        return (
                                          <div className="max-h-40 overflow-y-auto space-y-1">
                                            {openList.slice(0, 10).map((o: any, i: number) => (
                                              <div key={i} className="flex justify-between items-center bg-muted rounded px-3 py-2 text-sm">
                                                <span className="text-foreground">{o.email || o.prospect_email || "Unknown"}</span>
                                                <span className="text-muted-foreground text-xs">{o.opens_count || o.count || 1}x</span>
                                              </div>
                                            ))}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Contacts Table - THE main content */}
                    {pages.length === 0 ? (
                      <div className="text-center py-16 bg-card rounded-lg border border-border space-y-4">
                        <h3 className="text-xl font-semibold text-foreground">
                          Generate Personalized Links
                        </h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                          Upload your contacts to generate unique landing pages for each person.
                        </p>
                        <Button onClick={() => setAddContactsSheetOpen(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Contacts
                        </Button>
                      </div>
                    ) : (
                      <div className="bg-card rounded-lg border border-border overflow-x-auto">
                        {/* Search bar */}
                        <div className="p-3 border-b border-border">
                          <div className="relative max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              placeholder="Search by name, company, or email..."
                              value={contactSearch}
                              onChange={(e) => setContactSearch(e.target.value)}
                              className="pl-9"
                            />
                          </div>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>First Name</TableHead>
                              <TableHead>Last Name</TableHead>
                              <TableHead>Company</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Landing Page</TableHead>
                              <TableHead>Views</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pages
                              .filter((page) => {
                                if (!contactSearch.trim()) return true;
                                const q = contactSearch.toLowerCase();
                                return (
                                  page.first_name?.toLowerCase().includes(q) ||
                                  page.last_name?.toLowerCase().includes(q) ||
                                  page.company?.toLowerCase().includes(q) ||
                                  (page as any).email?.toLowerCase().includes(q)
                                );
                              })
                              .map((page) => (
                              <TableRow key={page.id} className={`cursor-pointer hover:bg-muted/50 ${page.is_paused ? "opacity-60" : ""}`} onClick={() => openEditDialog(page)}>
                                <TableCell>{page.first_name}</TableCell>
                                <TableCell className="text-muted-foreground">
                                  {page.last_name || "-"}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {page.company || "-"}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {(page as any).email || "-"}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="p-0 h-auto text-primary"
                                    onClick={(e) => { e.stopPropagation(); copyToClipboard(getPageUrl(page.token)); }}
                                  >
                                    Copy Link
                                  </Button>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="p-0 h-auto gap-1 text-foreground hover:text-primary"
                                    onClick={(e) => { e.stopPropagation(); fetchViewDetails(page); }}
                                  >
                                    <Eye className="w-3 h-3" />
                                    {page.view_count}
                                  </Button>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`gap-1 text-xs ${page.is_paused ? "text-destructive" : "text-muted-foreground"}`}
                                    onClick={(e) => { e.stopPropagation(); togglePagePause(page.id, !!page.is_paused); }}
                                  >
                                    {page.is_paused ? <><Pause className="w-3 h-3" /> Paused</> : <><Play className="w-3 h-3" /> Live</>}
                                  </Button>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => { e.stopPropagation(); openEditDialog(page); }}
                                    >
                                      <Pencil className="w-4 h-4 text-muted-foreground hover:text-primary" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => { e.stopPropagation(); deletePage(page.id); }}
                                    >
                                      <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                    </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-card rounded-lg border border-border p-6 text-center text-muted-foreground">
                    <p>Select a campaign to view details</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Beta Questions Tab */}
          <TabsContent value="beta-questions" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Beta Questions</h2>
              <p className="text-muted-foreground">
                People who expressed interest via the beta signup form.
              </p>
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
                              setBetaEmailTarget({ id: req.id, first_name: req.first_name, email: req.email });
                              setBetaEmailSubject("Personalized page info");
                              setBetaEmailBody(`Hi ${req.first_name},\n\nThanks for signing up to learn more about Personalized Pages. The platform is currently in Beta but will be released soon at discounted pricing.\n\nHow it works\n\n1. Log in and select a landing page template\n2. Upload your email list\n3. We generate a personalized landing page for every contact\n4. Send your campaign using your existing sales or automation platform\n\nThat's it. No custom builds. No one-off pages. Just fast, scalable personalization.\n\nI will send you an email once the platform is publicly available soon.\n\nTake care,\nPaul\n\nPersonalized.Pages`);
                              setBetaEmailDialogOpen(true);
                            }}
                          >
                            <Mail className="w-3.5 h-3.5 mr-1.5" />
                            Send Email
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
              <p className="text-muted-foreground mb-6">
                View all form submissions from your landing pages in one place.
              </p>
            </div>
            <FormSubmissionsPanel />
          </TabsContent>

          {/* Variables Tab */}
          <TabsContent value="variables" className="space-y-6">
            <VariablesPanel />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="max-w-2xl space-y-8">
              {/* Plan & Billing */}
              <div>
                <h3 className="text-lg font-semibold text-foreground">Plan & Billing</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Your current plan and account details.
                </p>
              </div>

              <div className="bg-card rounded-xl border border-border p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">Plan</p>
                      <p className="font-semibold text-foreground capitalize">{usageLimits.plan || "trial"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">Account Email</p>
                      <p className="text-sm text-foreground">{user?.email}</p>
                    </div>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setManageSubOpen(true)}>
                      Manage Billing
                    </Button>
                    <Button size="sm" onClick={() => navigate("/pricing")}>
                      {usageLimits.plan === "trial" ? "Upgrade" : "Change Plan"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Usage */}
              <div>
                <h3 className="text-lg font-semibold text-foreground">Usage</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Your account activity to date.
                </p>
              </div>

              <div className="bg-card rounded-xl border border-border p-5 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Personalized Links Generated</span>
                  <span className="font-medium text-foreground">{usageLimits.pageCount}{!usageLimits.isUnlimited ? ` / ${usageLimits.maxPages}` : ""}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Campaigns Created</span>
                  <span className="font-medium text-foreground">{usageLimits.campaignCount}{!usageLimits.isUnlimited ? ` / ${usageLimits.maxCampaigns}` : ""}</span>
                </div>
                {!usageLimits.isUnlimited && (
                  <p className="text-xs text-muted-foreground pt-1">Limits are based on your current plan.</p>
                )}
              </div>

              {/* Custom Domain */}
              <div>
                <h3 className="text-lg font-semibold text-foreground">Custom Domain</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Use your own domain for personalized page links.
                </p>
              </div>

              <div className="bg-card rounded-xl border border-border p-5 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-domain" className="text-sm font-medium">Domain</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="custom-domain"
                        placeholder="pages.yourdomain.com"
                        value={customDomainDraft}
                        onChange={(e) => setCustomDomainDraft(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Button
                      onClick={saveCustomDomain}
                      disabled={savingDomain || customDomainDraft.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "") === customDomain}
                    >
                      {savingDomain ? "Saving..." : "Save"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter your domain without <code className="bg-muted px-1 rounded">http://</code> or trailing slashes. Example: <code className="bg-muted px-1 rounded">pages.yourcompany.com</code>
                  </p>
                </div>

                {customDomain && (
                  <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Current domain</p>
                    <p className="text-sm text-foreground font-medium">{customDomain}</p>
                    <p className="text-xs text-muted-foreground">
                      Your links will look like: <code className="bg-muted px-1 rounded">https://{customDomain}/p/abc123</code>
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">DNS Setup</p>
                  <p className="text-xs text-muted-foreground">
                    To activate your domain, add a CNAME record with your DNS provider:
                  </p>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-xs font-mono">
                    <p><span className="text-muted-foreground">Host:</span> <span className="text-foreground">{customDomainDraft || "pages.yourdomain.com"}</span></p>
                    <p><span className="text-muted-foreground">Points to:</span> <span className="text-foreground">personalized.page</span></p>
                  </div>
                  <p className="text-xs text-muted-foreground">DNS changes can take up to 24 hours to update.</p>
                </div>
              </div>

              {/* Integrations */}
              <div>
                <h3 className="text-lg font-semibold text-foreground">Integrations</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Connect your outreach tools to automate personalized campaigns.
                </p>
              </div>

              <div className="bg-card rounded-xl border border-border p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Send className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Snov.io</p>
                      <p className="text-sm text-muted-foreground">
                        {snovConnected ? "Connected — credentials saved" : "Not connected"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={snovConnected ? "outline" : "default"}
                    size="sm"
                    onClick={() => setSnovOnboardingOpen(true)}
                  >
                    {snovConnected ? "Edit Connection" : "Connect"}
                  </Button>
                </div>
              </div>

              <SnovOnboardingDialog
                open={snovOnboardingOpen}
                onOpenChange={setSnovOnboardingOpen}
                onConnected={() => checkSnovConnection()}
              />

              {/* Mailchimp */}
              <div className="bg-card rounded-xl border border-border p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Mailchimp</p>
                      <p className="text-sm text-muted-foreground">
                        {mailchimpConnected ? "Connected — API key saved" : "Not connected"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={mailchimpConnected ? "outline" : "default"}
                    size="sm"
                    onClick={() => setMailchimpOnboardingOpen(true)}
                  >
                    {mailchimpConnected ? "Edit Connection" : "Connect"}
                  </Button>
                </div>
              </div>

              <MailchimpOnboardingDialog
                open={mailchimpOnboardingOpen}
                onOpenChange={setMailchimpOnboardingOpen}
                onConnected={() => checkMailchimpConnection()}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      {/* Edit Contact Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>Update the contact details. Landing page link cannot be changed.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input value={editForm.first_name} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value={editForm.last_name} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input value={editForm.company} onChange={(e) => setEditForm({ ...editForm, company: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
            <Button onClick={saveEditContact} className="w-full" disabled={savingEdit || !editForm.first_name.trim()}>
              {savingEdit ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Test Email Dialog */}
      <Dialog open={testEmailDialogOpen} onOpenChange={setTestEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>Preview the email content for the first contact, sent to your account email.</DialogDescription>
          </DialogHeader>
          {pages.length > 0 && user && (
            <div className="space-y-4 pt-4">
              <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                <p><span className="font-medium text-foreground">To:</span> <span className="text-muted-foreground">{user.email}</span></p>
                <p><span className="font-medium text-foreground">Contact Name:</span> <span className="text-muted-foreground">{pages[0].first_name}{pages[0].last_name ? ` ${pages[0].last_name}` : ""}</span></p>
                <p><span className="font-medium text-foreground">Company:</span> <span className="text-muted-foreground">{pages[0].company || "-"}</span></p>
                <p><span className="font-medium text-foreground">Landing Page:</span> <span className="text-muted-foreground break-all">{getPageUrl(pages[0].token)}</span></p>
              </div>
              <Button onClick={handleSendTestEmail} className="w-full">
                Next — Open in Email Client
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Beta Email Preview Dialog */}
      <Dialog open={betaEmailDialogOpen} onOpenChange={setBetaEmailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Preview & Send Email</DialogTitle>
            <DialogDescription>
              {betaEmailTarget ? `Sending to ${betaEmailTarget.email}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input value={betaEmailSubject} onChange={(e) => setBetaEmailSubject(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Body</Label>
              <Textarea
                value={betaEmailBody}
                onChange={(e) => setBetaEmailBody(e.target.value)}
                rows={14}
                className="text-sm font-mono"
              />
            </div>
            <Button
              className="w-full"
              disabled={sendingBetaEmail || !betaEmailTarget}
              onClick={async () => {
                if (!betaEmailTarget) return;
                setSendingBetaEmail(true);
                try {
                  const { error } = await supabase.functions.invoke("send-beta-info-email", {
                    body: {
                      firstName: betaEmailTarget.first_name,
                      email: betaEmailTarget.email,
                      subject: betaEmailSubject,
                      bodyText: betaEmailBody,
                    },
                  });
                  if (error) throw error;
                  toast({ title: "Email sent!", description: `Sent to ${betaEmailTarget.email}` });
                  setBetaEmailDialogOpen(false);
                } catch (err: any) {
                  toast({ title: "Failed to send", description: err.message, variant: "destructive" });
                } finally {
                  setSendingBetaEmail(false);
                }
              }}
            >
              <Send className="w-4 h-4 mr-2" />
              {sendingBetaEmail ? "Sending..." : "Send Email"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Details Modal */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Page Views — {viewDetailsContact?.name}</DialogTitle>
            <DialogDescription>
              Total views: {viewDetailsContact?.view_count || 0}
            </DialogDescription>
          </DialogHeader>
          {viewDetailsLoading ? (
            <div className="py-8 text-center text-muted-foreground animate-pulse">Loading...</div>
          ) : viewDetailsData.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No views yet.</div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewDetailsData.map((view, i) => {
                    const d = new Date(view.viewed_at);
                    return (
                      <TableRow key={view.id}>
                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                        <TableCell>{d.toLocaleDateString()}</TableCell>
                        <TableCell>{d.toLocaleTimeString()}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Snov.io Setup Guide Dialog */}
      <Dialog open={snovGuideOpen} onOpenChange={setSnovGuideOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">How to Launch Your Campaign in Snov.io</DialogTitle>
            <DialogDescription>
              Your personalized landing pages are ready and synced. Follow these steps to create and launch your campaign in Snov.io.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            {/* What we've done */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">What's already done</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    We've generated a unique personalized landing page for each contact and added them to your Snov.io list with the URL stored in a custom field called <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">landing_page</code>.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</div>
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Go to Leads/Prospects and select your list</h4>
                <p className="text-sm text-muted-foreground">
                  In Snov.io, go to <strong>Leads → Prospects</strong>. Select the list of leads you already imported (the same contacts you added to Personalized Pages), or create a new list.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</div>
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Create the "landing_page" custom variable</h4>
                <p className="text-sm text-muted-foreground">
                  This is the critical step — you need to add a custom field so each contact can have their unique landing page URL.
                </p>
                <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1.5 ml-1">
                  <li>With your list open, find the <strong>three-dot menu (⋯)</strong> next to the "Send Campaign" button</li>
                  <li>Select <strong>"Manage Custom Fields"</strong></li>
                  <li>Click the <strong>"Add Field"</strong> button</li>
                  <li>Set the field name to exactly: <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">landing_page</code></li>
                  <li>Choose <strong>Text</strong> as the type, then click <strong>Save</strong></li>
                </ol>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-md p-3 mt-2">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    <strong>Important:</strong> The field name must be exactly <code className="bg-muted px-1 py-0.5 rounded font-mono">landing_page</code> (lowercase, with underscore). This creates the <code className="bg-muted px-1 py-0.5 rounded font-mono">{"{{landing_page}}"}</code> variable you can use in your email templates. You only need to do this once — it applies to all future campaigns.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</div>
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Create a new campaign in Snov.io</h4>
                <p className="text-sm text-muted-foreground">
                  Go to <strong>Campaigns</strong> in the left sidebar and click <strong>"New Campaign"</strong>. Give it a name that matches your campaign here. Select this list as your recipient source.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">4</div>
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Write your email and insert the personalized link</h4>
                <p className="text-sm text-muted-foreground">
                  In the email editor, write your message. Use the <code className="bg-muted px-1 py-0.5 rounded font-mono">{"{{landing_page}}"}</code> variable wherever you want the personalized link to appear:
                </p>
                <div className="bg-muted rounded-lg p-3 font-mono text-sm text-foreground flex items-center justify-between">
                  <span>{"{{landing_page}}"}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => {
                      navigator.clipboard.writeText("{{landing_page}}");
                      toast({ title: "Copied to clipboard!" });
                    }}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  For example, your email might look like:
                </p>
                <div className="bg-muted rounded-lg p-4 text-sm text-muted-foreground space-y-2 italic">
                  <p>Hi {"{{first_name}}"},</p>
                  <p>I put together a personalized offer for you. This page has the information we discussed. Check it out here:</p>
                  <p className="text-primary font-medium not-italic">{"{{landing_page}}"}</p>
                  <p>Let me know what you think!</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  <strong>Tip:</strong> You can also use other Snov.io variables like <code className="bg-muted px-1 py-0.5 rounded">{"{{first_name}}"}</code> and <code className="bg-muted px-1 py-0.5 rounded">{"{{company}}"}</code> to personalize further.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">5</div>
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Configure settings & launch</h4>
                <p className="text-sm text-muted-foreground">
                  Set your sending schedule, daily sending limits, and sender email address. When you're ready, click <strong>"Start"</strong> to launch the campaign. Snov.io will automatically send each contact their unique personalized link.
                </p>
              </div>
            </div>

            {/* Step 6 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-bold">6</div>
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Track results here</h4>
                <p className="text-sm text-muted-foreground">
                  Once your campaign is running, come back here and click <strong>"View Stats"</strong> to see opens, replies, and clicks pulled from Snov.io. You can also see how many times each contact viewed their personalized landing page in the contacts table.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="border-t border-border pt-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                <strong>Tip:</strong> Snov.io will open in a new tab so you can follow these steps side-by-side.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href="https://app.snov.io/prospects" target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button className="w-full">
                    Open Snov.io in New Tab
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </a>
                <Button variant="outline" onClick={() => setSnovGuideOpen(false)}>
                  Done
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Live Campaign Warning Dialog */}
      <Dialog open={liveWarningDialogOpen} onOpenChange={setLiveWarningDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Live Campaign Warning
            </DialogTitle>
            <DialogDescription className="text-left space-y-3 pt-2">
              <p>
                <strong>"{liveWarningTemplateName}"</strong> is currently being used by the campaign{liveWarningCampaignNames.length > 1 ? 's' : ''} <strong>{liveWarningCampaignNames.map((n, i) => <span key={i}>{i > 0 && ', '}"{n}"</span>)}</strong> with live personalized links.
              </p>
              <p>
                Any edits you make to this template could <strong>break the live Personalized Page links</strong> that have already been sent to your contacts.
              </p>
              <p className="text-amber-700 font-medium">
                To edit safely, clone this template first and edit the clone instead. Then use the clone for future campaigns.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setLiveWarningDialogOpen(false)}>
              Cancel
            </Button>
            {liveWarningEditSlug && (
              <Button
                variant="destructive"
                onClick={() => {
                  setLiveWarningDialogOpen(false);
                  navigate(liveWarningIsBuilder ? `/builder/${liveWarningEditSlug}` : `/template-editor/${liveWarningEditSlug}`);
                }}
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Edit Anyway
              </Button>
            )}
            </div>
        </DialogContent>
      </Dialog>

      {/* Template Preview Dialog (read-only) */}
      <Dialog open={!!previewTemplateSlug} onOpenChange={(open) => { if (!open) setPreviewTemplateSlug(null); }}>
        <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0 gap-0">
          <DialogHeader className="px-4 py-3 border-b flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              <DialogTitle>Template Preview (Read-Only)</DialogTitle>
            </div>
            <DialogDescription className="sr-only">Preview of the template in read-only mode</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto" style={{ height: 'calc(90vh - 60px)' }}>
            {previewTemplateSlug && (
              <iframe
                src={previewIsBuilder ? `/builder-preview/${previewTemplateSlug}` : `/template-editor/${previewTemplateSlug}?preview=true`}
                className="w-full border-0 pointer-events-none"
                style={{ height: '300vh' }}
                title="Template preview"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* Upgrade Dialog */}
      <UpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        resourceType={upgradeResourceType}
        currentPlan={usageLimits.plan}
        trialExpired={usageLimits.trialExpired}
      />
      {/* Delete Campaign Confirmation */}
      <AlertDialog open={deleteCampaignDialogOpen} onOpenChange={setDeleteCampaignDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              There is no recovery after you delete.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteCampaignDialogOpen(false)}>No</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteCampaignId) deleteCampaign(deleteCampaignId);
                setDeleteCampaignDialogOpen(false);
              }}
            >
              Delete Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Email Alert Confirmation Dialog */}
      <AlertDialog open={alertConfirmDialogOpen} onOpenChange={setAlertConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Enable Email Alerts
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p>
                You will receive an email when someone clicks on a link in{" "}
                <span className="font-semibold text-foreground">{alertConfirmCampaign?.name}</span>{" "}
                (with prospect name, company, email, and campaign name).
              </p>
              <p>
                Alerts will be sent to:{" "}
                <span className="font-semibold text-foreground">{ownerEmail}</span>
              </p>
              <p>Proceed?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (alertConfirmCampaign) toggleAlertOnView(alertConfirmCampaign, true);
                setAlertConfirmDialogOpen(false);
              }}
            >
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Manage Billing Dialog */}
      <Dialog open={manageSubOpen} onOpenChange={setManageSubOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Billing</DialogTitle>
            <DialogDescription>
              Your subscription details and account activity.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-muted rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Plan</span>
                <span className="font-semibold text-foreground capitalize">{usageLimits.plan || "trial"}</span>
              </div>
              {usageLimits.plan === "trial" && usageLimits.trialDaysLeft !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Trial ends in</span>
                  <span className={`font-semibold ${usageLimits.trialExpired ? "text-destructive" : "text-foreground"}`}>
                    {usageLimits.trialExpired ? "Expired" : `${usageLimits.trialDaysLeft} day${usageLimits.trialDaysLeft !== 1 ? "s" : ""}`}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Personalized Links Generated</span>
                <span className="font-medium text-foreground">{usageLimits.pageCount}{!usageLimits.isUnlimited ? ` / ${usageLimits.maxPages}` : ""}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Campaigns Created</span>
                <span className="font-medium text-foreground">{usageLimits.campaignCount}{!usageLimits.isUnlimited ? ` / ${usageLimits.maxCampaigns}` : ""}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Button className="w-full" onClick={() => { setManageSubOpen(false); navigate("/pricing"); }}>
                {usageLimits.plan === "trial" ? "Upgrade Plan" : "Change Plan"}
              </Button>
              {usageLimits.plan !== "trial" && (
                <>
                  <Button variant="outline" className="w-full" onClick={() => {
                    toast({ title: "Pause subscription", description: "Subscription pausing will be available once billing is fully integrated." });
                  }}>
                    Pause Subscription
                  </Button>
                  <Button variant="ghost" className="w-full text-destructive hover:text-destructive" onClick={() => {
                    toast({ title: "Cancel subscription", description: "Subscription cancellation will be available once billing is fully integrated." });
                  }}>
                    Cancel Subscription
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Admin;