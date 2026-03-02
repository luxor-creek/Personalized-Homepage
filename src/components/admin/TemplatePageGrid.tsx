import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TemplateMiniPreview from "@/components/admin/TemplateMiniPreview";
import {
  Search,
  Pencil,
  Eye,
  Copy,
  Trash2,
  LayoutGrid,
  List,
  MoreHorizontal,
  Plus,
  ArrowUpDown,
  Filter,
} from "lucide-react";

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
  updated_at?: string;
  created_at?: string;
}

interface TemplatePageGridProps {
  templates: LandingPageTemplate[];
  userId: string | undefined;
  isAdmin: boolean;
  liveTemplateIds: Set<string>;
  liveTemplateCampaigns: Record<string, string[]>;
  duplicating: string | null;
  editingTemplateName: string | null;
  templateNameDraft: string;
  onSetEditingTemplateName: (id: string | null) => void;
  onSetTemplateNameDraft: (name: string) => void;
  onSaveTemplateName: (id: string) => void;
  onPreview: (slug: string, isBuilder: boolean) => void;
  onEdit: (template: LandingPageTemplate) => void;
  onLiveWarning: (name: string, campaigns: string[]) => void;
  onLiveWarningEdit: (name: string, campaigns: string[], slug: string, isBuilder: boolean) => void;
  onDuplicate: (slug: string) => void;
  onForceDuplicate: (slug: string) => void;
  onDelete: (slug: string, name: string) => void;
}

type ViewMode = "grid" | "list";
type FilterMode = "all" | "live" | "draft";
type SortMode = "updated" | "name" | "created";

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function TemplatePageGrid({
  templates,
  userId,
  isAdmin,
  liveTemplateIds,
  liveTemplateCampaigns,
  duplicating,
  editingTemplateName,
  templateNameDraft,
  onSetEditingTemplateName,
  onSetTemplateNameDraft,
  onSaveTemplateName,
  onPreview,
  onLiveWarning,
  onLiveWarningEdit,
  onDuplicate,
  onForceDuplicate,
  onDelete,
}: TemplatePageGridProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [sort, setSort] = useState<SortMode>("updated");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const myTemplates = useMemo(() => {
    let list = templates.filter((t) => t.user_id === userId);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q));
    }
    if (filter === "live") list = list.filter((t) => liveTemplateIds.has(t.id));
    if (filter === "draft") list = list.filter((t) => !liveTemplateIds.has(t.id));
    list = [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "created") return (b.created_at || "").localeCompare(a.created_at || "");
      return (b.updated_at || "").localeCompare(a.updated_at || "");
    });
    return list;
  }, [templates, userId, search, filter, sort, liveTemplateIds]);

  const libraryTemplates = useMemo(() => {
    let list = templates.filter((t) => !t.user_id);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q));
    }
    return list;
  }, [templates, search]);

  const liveCount = templates.filter((t) => t.user_id === userId && liveTemplateIds.has(t.id)).length;
  const draftCount = templates.filter((t) => t.user_id === userId && !liveTemplateIds.has(t.id)).length;

  return (
    <div className="space-y-8">
      {/* My Templates */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">My Templates</h2>
            <p className="text-slate-500 text-sm mt-0.5">
              {myTemplates.length} template{myTemplates.length !== 1 ? "s" : ""}
              {liveCount > 0 && <span className="text-slate-400"> · {liveCount} live</span>}
              {draftCount > 0 && <span className="text-slate-400"> · {draftCount} draft</span>}
            </p>
          </div>
          <Link to="/builder">
            <Button size="sm" className="bg-primary hover:bg-primary/90 gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              New Page
            </Button>
          </Link>
        </div>

        {/* Utility Bar */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-lg border border-slate-200 mb-5">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm bg-white border-slate-200 focus:bg-white"
            />
          </div>
          <div className="h-5 w-px bg-slate-200" />
          <Select value={filter} onValueChange={(v) => setFilter(v as FilterMode)}>
            <SelectTrigger className="w-auto h-8 text-xs bg-white border-slate-200 gap-1 px-2.5">
              <Filter className="w-3 h-3 text-slate-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as SortMode)}>
            <SelectTrigger className="w-auto h-8 text-xs bg-white border-slate-200 gap-1 px-2.5">
              <ArrowUpDown className="w-3 h-3 text-slate-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated">Last Updated</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="created">Created</SelectItem>
            </SelectContent>
          </Select>
          <div className="ml-auto flex bg-white border border-slate-200 rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 transition-colors ${viewMode === "grid" ? "bg-slate-100 text-slate-700" : "text-slate-400 hover:text-slate-600"}`}
              title="Grid view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 transition-colors ${viewMode === "list" ? "bg-slate-100 text-slate-700" : "text-slate-400 hover:text-slate-600"}`}
              title="List view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {viewMode === "grid" ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Build from scratch */}
            <Link to="/builder" className="group rounded-xl border-2 border-dashed border-slate-200 hover:border-primary/40 overflow-hidden transition-all hover:shadow-sm">
              <div className="aspect-[16/9] flex items-center justify-center bg-slate-50/50 group-hover:bg-primary/[0.02] transition-colors">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center mx-auto mb-3 transition-colors">
                    <Plus className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-sm font-medium text-slate-500 group-hover:text-slate-700 transition-colors">Build from Scratch</p>
                  <p className="text-xs text-slate-400 mt-0.5">Visual page builder</p>
                </div>
              </div>
            </Link>

            {myTemplates.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                isLive={liveTemplateIds.has(t.id)}
                liveCampaigns={liveTemplateCampaigns[t.id] || []}
                duplicating={duplicating}
                editingTemplateName={editingTemplateName}
                templateNameDraft={templateNameDraft}
                isAdmin={isAdmin}
                onSetEditingTemplateName={onSetEditingTemplateName}
                onSetTemplateNameDraft={onSetTemplateNameDraft}
                onSaveTemplateName={onSaveTemplateName}
                onPreview={onPreview}
                onLiveWarning={onLiveWarning}
                onLiveWarningEdit={onLiveWarningEdit}
                onDuplicate={onForceDuplicate}
                onDelete={onDelete}
              />
            ))}

            {myTemplates.length === 0 && !search && (
              <div className="rounded-xl border border-dashed border-slate-200 overflow-hidden">
                <div className="aspect-[16/9] flex items-center justify-center bg-slate-50/30">
                  <div className="text-center px-6">
                    <Copy className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-400">No templates yet</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {isAdmin ? "Browse the library below to get started" : "Create a new page from scratch"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-[1fr_100px_80px_80px_40px] gap-4 px-4 py-2.5 border-b border-slate-100 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              <span>Name</span>
              <span>Updated</span>
              <span>Status</span>
              <span>Type</span>
              <span />
            </div>
            {myTemplates.map((t) => (
              <TemplateListRow
                key={t.id}
                template={t}
                isLive={liveTemplateIds.has(t.id)}
                liveCampaigns={liveTemplateCampaigns[t.id] || []}
                duplicating={duplicating}
                isAdmin={isAdmin}
                onPreview={onPreview}
                onLiveWarning={onLiveWarning}
                onLiveWarningEdit={onLiveWarningEdit}
                onDuplicate={onForceDuplicate}
                onDelete={onDelete}
              />
            ))}
            {myTemplates.length === 0 && (
              <div className="p-8 text-center">
                <Copy className="w-6 h-6 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">{search ? "No matching templates." : "No templates yet."}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Template Library */}
      {isAdmin && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">Template Library</h2>
              <p className="text-slate-500 text-sm mt-0.5">Pre-built templates ready to customize</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            {libraryTemplates.map((t) => (
              <div key={t.id} className="group rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
                <div className="aspect-[16/9] bg-slate-50 relative overflow-hidden">
                  {t.thumbnail_url ? (
                    <img src={t.thumbnail_url} alt={t.name} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                  ) : (
                    <TemplateMiniPreview slug={t.slug} isBuilderTemplate={!!t.is_builder_template} thumbnailUrl={t.thumbnail_url} />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-medium text-slate-900 mb-3 truncate">{t.name}</h3>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 h-8 text-xs bg-primary hover:bg-primary/90" onClick={() => onDuplicate(t.slug)} disabled={duplicating === t.slug}>
                      <Copy className="w-3 h-3 mr-1.5" />
                      {duplicating === t.slug ? "Cloning…" : "Use Template"}
                    </Button>
                    {isAdmin && (
                      <Link to={`/template-editor/${t.slug}`}>
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-400 hover:text-slate-600" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {libraryTemplates.length === 0 && (
              <p className="text-slate-400 col-span-full text-sm">No library templates available.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Grid Card ─── */

function TemplateCard({
  template: t, isLive, liveCampaigns, duplicating, editingTemplateName, templateNameDraft, isAdmin,
  onSetEditingTemplateName, onSetTemplateNameDraft, onSaveTemplateName, onPreview, onLiveWarning, onLiveWarningEdit, onDuplicate, onDelete,
}: {
  template: LandingPageTemplate; isLive: boolean; liveCampaigns: string[]; duplicating: string | null;
  editingTemplateName: string | null; templateNameDraft: string; isAdmin: boolean;
  onSetEditingTemplateName: (id: string | null) => void; onSetTemplateNameDraft: (name: string) => void;
  onSaveTemplateName: (id: string) => void; onPreview: (slug: string, isBuilder: boolean) => void;
  onLiveWarning: (name: string, campaigns: string[]) => void;
  onLiveWarningEdit: (name: string, campaigns: string[], slug: string, isBuilder: boolean) => void;
  onDuplicate: (slug: string) => void; onDelete: (slug: string, name: string) => void;
}) {
  const handleEdit = () => {
    if (isLive) onLiveWarningEdit(t.name, liveCampaigns, t.slug, !!t.is_builder_template);
  };

  return (
    <div className="group rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
      <div className="aspect-[16/9] bg-slate-50 relative overflow-hidden">
        {t.thumbnail_url ? (
          <img src={t.thumbnail_url} alt={t.name} className="w-full h-full object-cover" />
        ) : (
          <TemplateMiniPreview slug={t.slug} isBuilderTemplate={!!t.is_builder_template} thumbnailUrl={t.thumbnail_url} />
        )}
        {/* Status */}
        <div className="absolute top-2.5 left-2.5">
          {isLive ? (
            <button onClick={(e) => { e.preventDefault(); onLiveWarning(t.name, liveCampaigns); }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/90 backdrop-blur-sm text-[11px] font-medium text-slate-700 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Live
            </button>
          ) : (
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/90 backdrop-blur-sm text-[11px] font-medium text-slate-400 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />Draft
            </span>
          )}
        </div>
        {/* Hover overlay with actions */}
        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          {isLive ? (
            <Button size="sm" className="h-8 text-xs shadow-lg bg-white text-slate-900 hover:bg-slate-100" onClick={handleEdit}>
              <Pencil className="w-3 h-3 mr-1.5" />Edit
            </Button>
          ) : (
            <Link to={t.is_builder_template ? `/builder/${t.slug}` : `/template-editor/${t.slug}`}>
              <Button size="sm" className="h-8 text-xs shadow-lg bg-white text-slate-900 hover:bg-slate-100">
                <Pencil className="w-3 h-3 mr-1.5" />Edit
              </Button>
            </Link>
          )}
          <Button size="sm" variant="ghost" className="h-8 text-xs shadow-lg bg-white/90 text-slate-700 hover:bg-white"
            onClick={() => onPreview(t.slug, !!t.is_builder_template)}>
            <Eye className="w-3 h-3 mr-1.5" />View
          </Button>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {editingTemplateName === t.id ? (
              <Input autoFocus value={templateNameDraft}
                onChange={(e) => onSetTemplateNameDraft(e.target.value)}
                onBlur={() => onSaveTemplateName(t.id)}
                onKeyDown={(e) => { if (e.key === "Enter") onSaveTemplateName(t.id); if (e.key === "Escape") onSetEditingTemplateName(null); }}
                className="h-7 text-sm font-medium" />
            ) : (
              <h3 className="text-sm font-medium text-slate-900 truncate cursor-pointer hover:text-primary transition-colors"
                onClick={() => { onSetEditingTemplateName(t.id); onSetTemplateNameDraft(t.name); }} title="Click to rename">
                {t.name}
              </h3>
            )}
            <p className="text-[11px] text-slate-400 mt-0.5">{timeAgo(t.updated_at || t.created_at)}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-300 hover:text-slate-600 -mr-1">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => { onSetEditingTemplateName(t.id); onSetTemplateNameDraft(t.name); }}>
                <Pencil className="w-3.5 h-3.5 mr-2" />Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(t.slug)} disabled={duplicating === t.slug}>
                <Copy className="w-3.5 h-3.5 mr-2" />Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(t.slug, t.name)} className="text-red-600 focus:text-red-600">
                <Trash2 className="w-3.5 h-3.5 mr-2" />Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

/* ─── List Row ─── */

function TemplateListRow({
  template: t, isLive, liveCampaigns, duplicating, isAdmin, onPreview, onLiveWarning, onLiveWarningEdit, onDuplicate, onDelete,
}: {
  template: LandingPageTemplate; isLive: boolean; liveCampaigns: string[]; duplicating: string | null; isAdmin: boolean;
  onPreview: (slug: string, isBuilder: boolean) => void;
  onLiveWarning: (name: string, campaigns: string[]) => void;
  onLiveWarningEdit: (name: string, campaigns: string[], slug: string, isBuilder: boolean) => void;
  onDuplicate: (slug: string) => void; onDelete: (slug: string, name: string) => void;
}) {
  return (
    <div className="group grid grid-cols-[1fr_100px_80px_80px_40px] gap-4 items-center px-4 py-3 hover:bg-slate-50/80 transition-colors border-b border-slate-50 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">{t.name}</p>
        <p className="text-[11px] text-slate-400 font-mono truncate">{t.slug}</p>
      </div>
      <span className="text-xs text-slate-400">{timeAgo(t.updated_at || t.created_at)}</span>
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-emerald-500" : "bg-slate-300"}`} />
        <span className={`text-xs ${isLive ? "text-slate-700" : "text-slate-400"}`}>{isLive ? "Live" : "Draft"}</span>
      </div>
      <span className="text-xs text-slate-400">{t.is_builder_template ? "Builder" : "Classic"}</span>
      <div className="flex items-center justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-300 group-hover:text-slate-500 transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {isLive ? (
              <DropdownMenuItem onClick={() => onLiveWarningEdit(t.name, liveCampaigns, t.slug, !!t.is_builder_template)}>
                <Pencil className="w-3.5 h-3.5 mr-2" />Edit
              </DropdownMenuItem>
            ) : (
              <Link to={t.is_builder_template ? `/builder/${t.slug}` : `/template-editor/${t.slug}`}>
                <DropdownMenuItem><Pencil className="w-3.5 h-3.5 mr-2" />Edit</DropdownMenuItem>
              </Link>
            )}
            <DropdownMenuItem onClick={() => onPreview(t.slug, !!t.is_builder_template)}>
              <Eye className="w-3.5 h-3.5 mr-2" />Preview
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(t.slug)} disabled={duplicating === t.slug}>
              <Copy className="w-3.5 h-3.5 mr-2" />Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(t.slug, t.name)} className="text-red-600 focus:text-red-600">
              <Trash2 className="w-3.5 h-3.5 mr-2" />Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
