import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { History, RotateCcw, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Version {
  id: string;
  version_number: number;
  script_content: string | null;
  scene_description: string | null;
  change_summary: string | null;
  created_at: string;
}

interface VersionHistoryProps {
  projectId: string;
  currentScriptContent: string;
  currentSceneDescription: string;
  onRestore: (script: string, scene: string) => void;
}

export function VersionHistory({ 
  projectId, 
  currentScriptContent, 
  currentSceneDescription,
  onRestore 
}: VersionHistoryProps) {
  const { user } = useAuth();
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const fetchVersions = async () => {
    if (!projectId) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from("project_versions")
      .select("*")
      .eq("project_id", projectId)
      .order("version_number", { ascending: false })
      .limit(20);
    
    if (!error && data) {
      setVersions(data as Version[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) {
      fetchVersions();
    }
  }, [open, projectId]);

  const saveCurrentVersion = async (summary?: string) => {
    if (!user || !projectId) return;

    const nextVersion = versions.length > 0 ? versions[0].version_number + 1 : 1;

    const { error } = await supabase.from("project_versions").insert({
      project_id: projectId,
      user_id: user.id,
      version_number: nextVersion,
      script_content: currentScriptContent,
      scene_description: currentSceneDescription,
      change_summary: summary || `Version ${nextVersion}`,
    });

    if (error) {
      toast({ title: "Error", description: "Failed to save version", variant: "destructive" });
    } else {
      toast({ title: "Saved", description: `Version ${nextVersion} saved` });
      fetchVersions();
    }
  };

  const restoreVersion = (version: Version) => {
    onRestore(version.script_content || "", version.scene_description || "");
    setOpen(false);
    toast({ 
      title: "Restored", 
      description: `Restored to version ${version.version_number}` 
    });
  };

  const deleteVersion = async (versionId: string) => {
    const { error } = await supabase
      .from("project_versions")
      .delete()
      .eq("id", versionId);

    if (!error) {
      toast({ title: "Deleted", description: "Version removed" });
      fetchVersions();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="w-4 h-4 mr-2" />
          History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Version History
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-end mb-4">
          <Button onClick={() => saveCurrentVersion()} size="sm" className="bg-gradient-gold text-primary-foreground">
            Save Current Version
          </Button>
        </div>

        <div className="flex-1 overflow-auto space-y-2">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No versions saved yet</p>
              <p className="text-sm">Click "Save Current Version" to create your first snapshot</p>
            </div>
          ) : (
            <AnimatePresence>
              {versions.map((version) => (
                <motion.div
                  key={version.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="border border-border rounded-lg overflow-hidden"
                >
                  <div 
                    className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer hover:bg-muted/50"
                    onClick={() => setExpandedId(expandedId === version.id ? null : version.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm bg-primary/20 px-2 py-1 rounded">
                        v{version.version_number}
                      </span>
                      <div>
                        <p className="font-medium text-sm">{version.change_summary}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(version.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          restoreVersion(version);
                        }}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteVersion(version.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      {expandedId === version.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedId === version.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border"
                      >
                        <div className="p-4 space-y-4 max-h-60 overflow-auto">
                          {version.script_content && (
                            <div>
                              <h4 className="text-xs font-semibold text-muted-foreground mb-1">Script Content</h4>
                              <p className="text-sm bg-muted/50 p-2 rounded whitespace-pre-wrap line-clamp-6">
                                {version.script_content}
                              </p>
                            </div>
                          )}
                          {version.scene_description && (
                            <div>
                              <h4 className="text-xs font-semibold text-muted-foreground mb-1">Scene Description</h4>
                              <p className="text-sm bg-muted/50 p-2 rounded whitespace-pre-wrap line-clamp-4">
                                {version.scene_description}
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}