import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, ExternalLink, ArrowLeft, ArrowRight, Check, Loader2, AlertCircle, FileSpreadsheet, ChevronLeft, ChevronRight, Eye, AlertTriangle, CheckCircle2, Download, RotateCcw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface MappedRow {
  first_name: string;
  last_name?: string | null;
  email?: string | null;
  company?: string | null;
  custom_message?: string | null;
}

interface GeneratedPage {
  id: string;
  token: string;
  first_name: string;
  last_name?: string | null;
  email?: string | null;
  company?: string | null;
}

interface ManualImportFlowProps {
  campaignId: string;
  templateId: string | null;
  templateSlug?: string | null;
  isBuilderTemplate?: boolean;
  customDomain?: string;
  onGenerationComplete?: () => void;
}

const TARGET_FIELDS = [
  { key: "email", label: "Email", required: true },
  { key: "first_name", label: "First Name", required: false },
  { key: "last_name", label: "Last Name", required: false },
  { key: "company", label: "Company", required: false },
  { key: "custom_message", label: "Custom Message", required: false },
];

type Source = null | "csv" | "gsheet";
type Step = "choose" | "upload" | "gsheet-url" | "mapping" | "preview" | "confirm" | "generating" | "complete";

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

const ManualImportFlow = ({ campaignId, templateId, templateSlug, isBuilderTemplate, customDomain, onGenerationComplete }: ManualImportFlowProps) => {
  const { toast } = useToast();
  const [source, setSource] = useState<Source>(null);
  const [step, setStep] = useState<Step>("choose");

  // CSV state
  const [file, setFile] = useState<File | null>(null);

  // Google Sheets state
  const [gsheetUrl, setGsheetUrl] = useState("");
  const [fetchingSheet, setFetchingSheet] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);

  // Shared parsing state
  const [headers, setHeaders] = useState<string[]>([]);
  const [allRows, setAllRows] = useState<string[][]>([]);
  const [sampleRows, setSampleRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});

  // Preview state
  const [previewIndex, setPreviewIndex] = useState(0);

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [generatedPages, setGeneratedPages] = useState<GeneratedPage[]>([]);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [failedCount, setFailedCount] = useState(0);
  const [generationRunId, setGenerationRunId] = useState<string | null>(null);

  const resetAll = () => {
    setSource(null);
    setStep("choose");
    setFile(null);
    setGsheetUrl("");
    setSheetError(null);
    setHeaders([]);
    setAllRows([]);
    setSampleRows([]);
    setMapping({});
    setPreviewIndex(0);
    setGenerating(false);
    setGeneratedPages([]);
    setGenerationError(null);
    setFailedCount(0);
    setGenerationRunId(null);
  };

  const processLines = (lines: string[]) => {
    if (lines.length < 2) {
      toast({ title: "Invalid data", description: "Need a header row and at least one data row", variant: "destructive" });
      return false;
    }
    const hdrs = parseCsvLine(lines[0]);
    setHeaders(hdrs);
    const rows = lines.slice(1).map(parseCsvLine);
    setAllRows(rows);
    setSampleRows(rows.slice(0, 5));

    // Auto-map by matching header names
    const autoMap: Record<string, string> = {};
    for (const field of TARGET_FIELDS) {
      const match = hdrs.find((h) => {
        const lower = h.toLowerCase().replace(/[_\s-]/g, "");
        if (field.key === "email") return lower === "email" || lower === "emailaddress";
        if (field.key === "first_name") return lower === "firstname" || lower === "first" || lower === "name";
        if (field.key === "last_name") return lower === "lastname" || lower === "last" || lower === "surname";
        if (field.key === "company") return lower === "company" || lower === "organization" || lower === "org";
        if (field.key === "custom_message") return lower === "custommessage" || lower === "message" || lower === "note";
        return false;
      });
      if (match) autoMap[field.key] = match;
    }
    setMapping(autoMap);
    return true;
  };

  // Build mapped rows from raw data
  const buildMappedRows = useCallback((): MappedRow[] => {
    const getIdx = (field: string) => {
      const col = mapping[field];
      if (!col) return -1;
      return headers.indexOf(col);
    };

    const emailIdx = getIdx("email");
    const firstNameIdx = getIdx("first_name");
    const lastNameIdx = getIdx("last_name");
    const companyIdx = getIdx("company");
    const messageIdx = getIdx("custom_message");

    return allRows
      .map((values) => {
        const email = emailIdx >= 0 ? values[emailIdx]?.trim() : null;
        if (!email) return null;

        let firstName = firstNameIdx >= 0 ? values[firstNameIdx]?.trim() || null : null;
        const lastName = lastNameIdx >= 0 ? values[lastNameIdx]?.trim() || null : null;

        if (!firstName && email) {
          firstName = email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        }

        return {
          first_name: firstName || "Contact",
          last_name: lastName,
          email,
          company: companyIdx >= 0 ? values[companyIdx]?.trim() || null : null,
          custom_message: messageIdx >= 0 ? values[messageIdx]?.trim() || null : null,
        };
      })
      .filter(Boolean) as MappedRow[];
  }, [allRows, headers, mapping]);

  const mappedRows = useMemo(() => {
    if (["preview", "mapping", "confirm"].includes(step)) return buildMappedRows();
    return [];
  }, [step, buildMappedRows]);

  // Find the first valid contact index (has email)
  const firstValidIndex = useMemo(() => {
    const idx = mappedRows.findIndex(r => r.email);
    return idx >= 0 ? idx : 0;
  }, [mappedRows]);

  // Warnings for missing fields
  const missingFieldWarnings = useMemo(() => {
    if (mappedRows.length === 0) return [];
    const warnings: { field: string; count: number }[] = [];
    const fields = [
      { key: "first_name", label: "first_name" },
      { key: "company", label: "company" },
      { key: "custom_message", label: "custom_message" },
    ];
    for (const f of fields) {
      if (mapping[f.key]) {
        const missing = mappedRows.filter(r => !(r as any)[f.key]?.trim()).length;
        if (missing > 0 && missing < mappedRows.length) {
          warnings.push({ field: f.label, count: missing });
        }
      }
    }
    return warnings;
  }, [mappedRows, mapping]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "CSV must be under 5MB", variant: "destructive" });
      return;
    }
    setFile(f);
    try {
      const text = await f.text();
      const lines = text.split("\n").filter((l) => l.trim());
      if (processLines(lines)) {
        setStep("mapping");
      }
    } catch (err: any) {
      toast({ title: "Error reading file", description: err.message, variant: "destructive" });
    }
  }, [toast]);

  const handleFetchSheet = async () => {
    if (!gsheetUrl.trim()) return;
    setFetchingSheet(true);
    setSheetError(null);
    try {
      const match = gsheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) throw new Error("Invalid Google Sheets URL. Please paste a full Google Sheets link.");
      const sheetId = match[1];
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      const res = await fetch(csvUrl);
      if (!res.ok) throw new Error("We can't access this sheet. Please update sharing settings or use CSV.");
      const text = await res.text();
      const lines = text.split("\n").filter((l) => l.trim());
      if (processLines(lines)) {
        setStep("mapping");
      }
    } catch (err: any) {
      setSheetError(err.message);
    } finally {
      setFetchingSheet(false);
    }
  };

  const goToPreview = () => {
    if (!mapping.email) {
      toast({ title: "Email mapping required", description: "Please map the Email column to continue.", variant: "destructive" });
      return;
    }
    const rows = buildMappedRows();
    if (rows.length === 0) {
      toast({ title: "No valid rows", description: "No rows with a valid email were found.", variant: "destructive" });
      return;
    }
    setPreviewIndex(firstValidIndex);
    setStep("preview");
  };

  // Bulk generation with duplicate protection
  const handleGenerate = async () => {
    const rows = buildMappedRows();
    if (rows.length === 0) return;

    // Generate a run ID for duplicate protection
    const runId = crypto.randomUUID();
    if (generationRunId === runId) return; // prevent double-click
    setGenerationRunId(runId);
    setGenerating(true);
    setStep("generating");
    setGenerationError(null);
    setFailedCount(0);
    setGeneratedPages([]);

    // Check for existing pages with same emails to prevent duplicates
    const emails = rows.map(r => r.email).filter(Boolean) as string[];
    let existingEmails = new Set<string>();
    if (emails.length > 0) {
      const { data: existing } = await supabase
        .from("personalized_pages")
        .select("email")
        .eq("campaign_id", campaignId)
        .in("email", emails);
      if (existing) {
        existingEmails = new Set(existing.map(e => e.email).filter(Boolean) as string[]);
      }
    }

    const newRows = rows.filter(r => !r.email || !existingEmails.has(r.email));
    if (newRows.length === 0) {
      setGenerating(false);
      setStep("confirm");
      toast({ title: "All contacts already exist", description: "These contacts already have personalized pages in this campaign.", variant: "destructive" });
      setGenerationRunId(null);
      return;
    }

    // Insert in batches of 50
    const batchSize = 50;
    const allGenerated: GeneratedPage[] = [];
    let totalFailed = 0;

    for (let i = 0; i < newRows.length; i += batchSize) {
      const batch = newRows.slice(i, i + batchSize).map(r => ({
        campaign_id: campaignId,
        template_id: templateId,
        first_name: r.first_name,
        last_name: r.last_name || null,
        email: r.email || null,
        company: r.company || null,
        custom_message: r.custom_message || null,
      }));

      const { data, error } = await supabase
        .from("personalized_pages")
        .insert(batch)
        .select("id, token, first_name, last_name, email, company");

      if (error) {
        totalFailed += batch.length;
        console.error("Batch insert error:", error);
      } else if (data) {
        allGenerated.push(...data);
      }
    }

    setGeneratedPages(allGenerated);
    setFailedCount(totalFailed);
    setGenerating(false);

    if (allGenerated.length > 0) {
      setStep("complete");
      onGenerationComplete?.();
    } else {
      setGenerationError("Generation failed. No pages were created.");
      setStep("confirm");
    }
    setGenerationRunId(null);
  };

  // CSV download of enriched data
  const downloadEnrichedCsv = () => {
    if (generatedPages.length === 0) return;
    const baseUrl = customDomain ? `https://${customDomain}` : window.location.origin;
    const csvHeaders = ["first_name", "last_name", "email", "company", "personalized_link"];
    const csvRows = generatedPages.map(p => [
      p.first_name || "",
      p.last_name || "",
      p.email || "",
      p.company || "",
      `${baseUrl}/p/${p.token}`,
    ]);
    const csvContent = [csvHeaders.join(","), ...csvRows.map(r => r.map(v => `"${(v || "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `personalized-links-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Step: Choose source
  if (step === "choose") {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => { setSource("csv"); setStep("upload"); }}
            className="flex items-center gap-4 p-5 rounded-xl border-2 border-border bg-card hover:border-primary/40 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Upload CSV</p>
              <p className="text-sm text-muted-foreground">Upload a .csv file with your contacts</p>
            </div>
          </button>
          <button
            onClick={() => { setSource("gsheet"); setStep("gsheet-url"); }}
            className="flex items-center gap-4 p-5 rounded-xl border-2 border-border bg-card hover:border-primary/40 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Import from Google Sheets</p>
              <p className="text-sm text-muted-foreground">Paste a public Google Sheets URL</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Step: Upload CSV file
  if (step === "upload") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={resetAll}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h4 className="font-semibold text-foreground">Upload your contact list</h4>
        </div>
        <p className="text-sm text-muted-foreground">
          Select a .csv file. We'll detect your columns automatically.
        </p>
        <Input type="file" accept=".csv" onChange={handleFileSelect} />
      </div>
    );
  }

  // Step: Google Sheet URL
  if (step === "gsheet-url") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={resetAll}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h4 className="font-semibold text-foreground">Import from Google Sheets</h4>
        </div>
        <p className="text-sm text-muted-foreground">
          Make sure link sharing is set to "Anyone with the link can view."
        </p>
        <Input
          placeholder="https://docs.google.com/spreadsheets/d/..."
          value={gsheetUrl}
          onChange={(e) => { setGsheetUrl(e.target.value); setSheetError(null); }}
        />
        {sheetError && (
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{sheetError}</span>
          </div>
        )}
        <Button onClick={handleFetchSheet} disabled={!gsheetUrl.trim() || fetchingSheet}>
          {fetchingSheet ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Fetching...</>
          ) : (
            <><ExternalLink className="w-4 h-4 mr-2" /> Fetch Sheet</>
          )}
        </Button>
      </div>
    );
  }

  // Step: Mapping
  if (step === "mapping") {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => {
            if (source === "csv") { setStep("upload"); setFile(null); }
            else { setStep("gsheet-url"); }
            setHeaders([]); setAllRows([]); setSampleRows([]); setMapping({});
          }}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h4 className="font-semibold text-foreground">Map your columns</h4>
          <span className="text-sm text-muted-foreground ml-auto">
            {allRows.length} rows detected
          </span>
        </div>

        <div className="space-y-3">
          {TARGET_FIELDS.map(({ key, label, required }) => (
            <div key={key} className="flex items-center gap-3">
              <Label className="text-sm w-32 shrink-0">
                {label} {required && <span className="text-destructive">*</span>}
              </Label>
              <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
              <Select
                value={mapping[key] || "__none__"}
                onValueChange={(v) => setMapping((prev) => {
                  if (v === "__none__") {
                    const { [key]: _, ...rest } = prev;
                    return rest;
                  }
                  return { ...prev, [key]: v };
                })}
              >
                <SelectTrigger className="text-sm h-9">
                  <SelectValue placeholder="Select column..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Skip —</SelectItem>
                  {headers.map((h) => (
                    <SelectItem key={h} value={h}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {mapping[key] && <Check className="w-4 h-4 text-green-500 shrink-0" />}
            </div>
          ))}
        </div>

        {sampleRows.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Preview</p>
            <div className="border rounded-lg overflow-auto max-h-40">
              <table className="text-xs w-full">
                <thead>
                  <tr className="bg-muted">
                    {headers.map((h) => (
                      <th key={h} className="px-2 py-1.5 text-left font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sampleRows.map((row, i) => (
                    <tr key={i} className="border-t">
                      {row.map((v, j) => (
                        <td key={j} className="px-2 py-1 whitespace-nowrap max-w-[200px] truncate">{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            onClick={goToPreview}
            disabled={!mapping.email}
            className="flex-1 gap-2"
          >
            <Eye className="w-4 h-4" />
            Preview Personalized Page
          </Button>
        </div>
      </div>
    );
  }

  // Step: Preview
  if (step === "preview") {
    const currentContact = mappedRows[previewIndex] || mappedRows[0];
    const previewContacts = mappedRows.slice(0, 10);
    const sourceLabel = source === "csv" ? `CSV row ${previewIndex + 2}` : `Sheet row ${previewIndex + 2}`;

    // Build preview URL with personalization query params
    const previewUrl = templateSlug
      ? (() => {
          const base = `/builder-preview/${templateSlug}`;
          const sep = base.includes("?") ? "&" : "?";
          const params = new URLSearchParams();
          if (currentContact.first_name) params.set("p_first_name", currentContact.first_name);
          if (currentContact.last_name) params.set("p_last_name", currentContact.last_name);
          if (currentContact.company) params.set("p_company", currentContact.company);
          return `${base}${sep}${params.toString()}`;
        })()
      : null;

    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setStep("mapping")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h4 className="font-semibold text-foreground">Preview a Personalized Version</h4>
            <p className="text-sm text-muted-foreground">
              Here's how your page will look for one contact from your list.
            </p>
          </div>
        </div>

        {/* Contact Switcher */}
        <div className="flex items-center gap-2">
          <Label className="text-sm shrink-0">Preview as:</Label>
          <Select
            value={previewIndex.toString()}
            onValueChange={(v) => setPreviewIndex(parseInt(v, 10))}
          >
            <SelectTrigger className="text-sm h-9 max-w-[280px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {previewContacts.map((contact, i) => (
                <SelectItem key={i} value={i.toString()}>
                  {contact.first_name}{contact.last_name ? ` ${contact.last_name}` : ""} {contact.email ? `(${contact.email})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              disabled={previewIndex === 0}
              onClick={() => setPreviewIndex(i => Math.max(0, i - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              disabled={previewIndex >= previewContacts.length - 1}
              onClick={() => setPreviewIndex(i => Math.min(previewContacts.length - 1, i + 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Two-pane layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
          {/* Left: Page Preview */}
          <div className="border rounded-lg overflow-hidden bg-muted/30">
            {previewUrl ? (
              <iframe
                key={previewIndex}
                src={previewUrl}
                className="w-full border-0 pointer-events-none"
                style={{ height: '500px', transform: 'scale(0.6)', transformOrigin: 'top left', width: '166.67%' }}
                title="Personalized page preview"
                sandbox="allow-same-origin allow-scripts"
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                No template linked to this campaign
              </div>
            )}
          </div>

          {/* Right: Contact Details */}
          <div className="space-y-4">
            <div className="bg-card rounded-lg border p-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Contact Details</p>
              <div className="space-y-2 text-sm">
                {currentContact.first_name && (
                  <div>
                    <span className="text-muted-foreground">First Name:</span>{" "}
                    <span className="text-foreground font-medium">{currentContact.first_name}</span>
                  </div>
                )}
                {currentContact.last_name && (
                  <div>
                    <span className="text-muted-foreground">Last Name:</span>{" "}
                    <span className="text-foreground font-medium">{currentContact.last_name}</span>
                  </div>
                )}
                {currentContact.email && (
                  <div>
                    <span className="text-muted-foreground">Email:</span>{" "}
                    <span className="text-foreground font-medium">{currentContact.email}</span>
                  </div>
                )}
                {currentContact.company && (
                  <div>
                    <span className="text-muted-foreground">Company:</span>{" "}
                    <span className="text-foreground font-medium">{currentContact.company}</span>
                  </div>
                )}
                {currentContact.custom_message && (
                  <div>
                    <span className="text-muted-foreground">Custom Message:</span>{" "}
                    <span className="text-foreground font-medium">{currentContact.custom_message}</span>
                  </div>
                )}
              </div>

              {/* Fallback visibility */}
              <div className="pt-2 border-t space-y-1">
                {TARGET_FIELDS.filter(f => f.key !== "email").map(f => {
                  const val = (currentContact as any)[f.key];
                  const hasValue = val && val.trim();
                  return (
                    <div key={f.key} className="text-xs">
                      <span className="text-muted-foreground">{f.key}:</span>{" "}
                      {hasValue ? (
                        <span className="text-foreground">"{val}"</span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400">(empty) — Fallback will apply</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t">
                <span className="text-xs text-muted-foreground">{sourceLabel}</span>
              </div>
            </div>

            {missingFieldWarnings.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-sm font-medium text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  Missing Data
                </div>
                {missingFieldWarnings.map((w) => (
                  <p key={w.field} className="text-xs text-amber-600 dark:text-amber-500">
                    {w.count} contacts are missing: <strong>{w.field}</strong>. Fallbacks will be used where available.
                  </p>
                ))}
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              {mappedRows.length} valid contacts total
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={() => setStep("mapping")}>
            Back to Mapping
          </Button>
          <Button
            onClick={() => setStep("confirm")}
            className="flex-1 gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            Continue to Generate
          </Button>
        </div>
      </div>
    );
  }

  // Step: Confirm
  if (step === "confirm") {
    const hasFallbacks = missingFieldWarnings.length > 0;

    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setStep("preview")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h4 className="font-semibold text-foreground">Generate Personalized Links</h4>
            <p className="text-sm text-muted-foreground">
              You're about to create a unique landing page for each contact.
            </p>
          </div>
        </div>

        {/* Summary block */}
        <div className="bg-card rounded-xl border p-5 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Summary</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Contacts staged</span>
              <p className="text-foreground font-semibold text-lg">{mappedRows.length}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Pages to create</span>
              <p className="text-foreground font-semibold text-lg">{mappedRows.length}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Export method</span>
              <p className="text-foreground font-medium">{source === "gsheet" ? "Google Sheets" : "CSV"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Fallbacks active</span>
              <p className="text-foreground font-medium">{hasFallbacks ? "Yes" : "No"}</p>
            </div>
          </div>
        </div>

        {/* Fallback details */}
        {hasFallbacks && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-sm font-medium text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              Fallback Notice
            </div>
            {missingFieldWarnings.map((w) => (
              <p key={w.field} className="text-xs text-amber-600 dark:text-amber-500">
                {w.count} contacts are missing: <strong>{w.field}</strong>. Template defaults will be used.
              </p>
            ))}
          </div>
        )}

        {/* Generation error from a previous attempt */}
        {generationError && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-sm font-medium text-destructive">
              <AlertCircle className="w-4 h-4" />
              {generationError}
            </div>
            {failedCount > 0 && (
              <p className="text-xs text-destructive/80 mt-1">
                {failedCount} pages failed to generate. You can retry.
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={() => setStep("preview")}>
            Back to Preview
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="flex-1 gap-2"
          >
            {generating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
            ) : (
              <><CheckCircle2 className="w-4 h-4" /> Generate {mappedRows.length} Personalized Links</>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Step: Generating (progress)
  if (step === "generating") {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <div className="text-center">
          <h4 className="font-semibold text-foreground">Generating personalized pages...</h4>
          <p className="text-sm text-muted-foreground mt-1">
            Creating unique landing pages for your contacts. This may take a moment.
          </p>
        </div>
      </div>
    );
  }

  // Step: Complete
  if (step === "complete") {
    return (
      <div className="space-y-5">
        <div className="flex flex-col items-center text-center py-6 space-y-3">
          <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-950/50 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground text-lg">Generation Complete</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Your personalized pages are ready.
            </p>
          </div>
        </div>

        <div className="bg-card rounded-xl border p-5 space-y-2">
          <div className="flex items-center gap-2 text-sm text-foreground">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span><strong>{generatedPages.length}</strong> personalized pages created</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span><strong>{generatedPages.length}</strong> unique links generated</span>
          </div>
          {failedCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <AlertTriangle className="w-4 h-4" />
              <span><strong>{failedCount}</strong> contacts failed — you can retry these later</span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          {source === "gsheet" ? (
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => {
                if (gsheetUrl) window.open(gsheetUrl, "_blank");
              }}
            >
              <ExternalLink className="w-4 h-4" />
              Open Sheet
            </Button>
          ) : (
            <Button
              onClick={downloadEnrichedCsv}
              className="flex-1 gap-2"
            >
              <Download className="w-4 h-4" />
              Download Enriched CSV
            </Button>
          )}
          <Button variant="outline" onClick={resetAll} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Import More
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default ManualImportFlow;
