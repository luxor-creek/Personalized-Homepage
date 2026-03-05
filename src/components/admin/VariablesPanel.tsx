import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Globe, Braces, MoreVertical, Pencil, Trash2, Copy, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCustomVariables, SYSTEM_VARIABLES } from "@/hooks/useCustomVariables";

export default function VariablesPanel() {
  const { toast } = useToast();
  const { variables, loading, createVariable, updateVariable, deleteVariable } = useCustomVariables();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formToken, setFormToken] = useState("");
  const [formFallback, setFormFallback] = useState("");

  const allRows = [
    ...SYSTEM_VARIABLES.map((v) => ({ id: v.token, name: v.name, token: v.token, type: "System", fallback: "-", isSystem: true, snovToken: v.snovToken || "-", mailchimpToken: v.mailchimpToken || "-" })),
    ...variables.map((v) => ({ id: v.id, name: v.name, token: v.token, type: "Custom", fallback: v.fallback_value || "-", isSystem: false, snovToken: "-", mailchimpToken: "-" })),
  ];

  const resetForm = () => { setFormName(""); setFormToken(""); setFormFallback(""); };

  const handleCreate = async () => {
    if (!formName.trim() || !formToken.trim()) {
      toast({ title: "Name and token are required", variant: "destructive" });
      return;
    }
    try {
      await createVariable(formName.trim(), formToken.trim(), formFallback.trim());
      toast({ title: "Variable created" });
      setCreateOpen(false);
      resetForm();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleEdit = async () => {
    if (!selectedId || !formName.trim() || !formToken.trim()) return;
    try {
      await updateVariable(selectedId, { name: formName.trim(), token: formToken.trim(), fallback_value: formFallback.trim() });
      toast({ title: "Variable updated" });
      setEditOpen(false);
      resetForm();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    try {
      await deleteVariable(selectedId);
      toast({ title: "Variable deleted" });
      setDeleteOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const openEdit = (row: typeof allRows[0]) => {
    setSelectedId(row.id);
    setFormName(row.name);
    setFormToken(row.token.replace(/^\{\{|\}\}$/g, ""));
    setFormFallback(row.fallback === "-" ? "" : row.fallback);
    setEditOpen(true);
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast({ title: "Copied!", description: token });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Variables ({allRows.length})</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Personalization tokens you can insert into any text field in the Page Builder.
          </p>
        </div>
        <Button onClick={() => { resetForm(); setCreateOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />Create Variable
        </Button>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="bg-muted/30 px-4 py-3 border-b border-border text-sm text-muted-foreground">
          Click any token to copy it. Use <strong className="text-foreground">Page Builder</strong> tokens in your landing page templates, <strong className="text-orange-700">Snov.io</strong> tokens in your Snov.io email templates, and <strong className="text-yellow-700">Mailchimp</strong> tokens in your Mailchimp campaigns.
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Variable Name</TableHead>
              <TableHead>Page Builder</TableHead>
              <TableHead>Snov.io Email</TableHead>
              <TableHead>Mailchimp Email</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="w-12">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>
            ) : allRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {row.isSystem ? <Globe className="w-4 h-4 text-muted-foreground" /> : <Braces className="w-4 h-4 text-primary" />}
                    <span className="text-primary">{row.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono cursor-pointer hover:bg-primary/10 transition-colors" onClick={() => copyToken(row.token)}>{row.token}</code>
                </TableCell>
                <TableCell>
                  {row.snovToken !== "-" ? (
                    <code className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded font-mono cursor-pointer hover:bg-orange-100 transition-colors" onClick={() => copyToken(row.snovToken)}>{row.snovToken}</code>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {row.mailchimpToken !== "-" ? (
                    <code className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded font-mono cursor-pointer hover:bg-yellow-100 transition-colors" onClick={() => copyToken(row.mailchimpToken)}>{row.mailchimpToken}</code>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={row.isSystem ? "secondary" : "outline"}>
                    {row.isSystem && <Lock className="w-3 h-3 mr-1" />}
                    {row.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => copyToken(row.token)}>
                        <Copy className="w-3.5 h-3.5 mr-2" />Copy Token
                      </DropdownMenuItem>
                      {!row.isSystem && (
                        <>
                          <DropdownMenuItem onClick={() => openEdit(row)}>
                            <Pencil className="w-3.5 h-3.5 mr-2" />Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => { setSelectedId(row.id); setDeleteOpen(true); }}>
                            <Trash2 className="w-3.5 h-3.5 mr-2" />Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Variable</DialogTitle>
            <DialogDescription>Add a custom personalization token for your landing pages.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Variable Name *</Label>
              <Input placeholder="e.g. Job Title" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Token *</Label>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground font-mono text-sm">{"{{"}</span>
                <Input placeholder="e.g. job_title" value={formToken} onChange={(e) => setFormToken(e.target.value.replace(/[^a-z0-9_]/gi, "_").toLowerCase())} className="font-mono" />
                <span className="text-muted-foreground font-mono text-sm">{"}}"}</span>
              </div>
              <p className="text-xs text-muted-foreground">Lowercase, underscores only. Will be wrapped in {"{{ }}"} automatically.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Fallback Value</Label>
              <Input placeholder="Shown when no value is provided" value={formFallback} onChange={(e) => setFormFallback(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Variable</DialogTitle>
            <DialogDescription>Update the variable name, token, or fallback value.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Variable Name *</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Token *</Label>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground font-mono text-sm">{"{{"}</span>
                <Input value={formToken} onChange={(e) => setFormToken(e.target.value.replace(/[^a-z0-9_]/gi, "_").toLowerCase())} className="font-mono" />
                <span className="text-muted-foreground font-mono text-sm">{"}}"}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Fallback Value</Label>
              <Input value={formFallback} onChange={(e) => setFormFallback(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button onClick={handleEdit}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Variable?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the variable. Any pages using this token will show the raw token text instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
