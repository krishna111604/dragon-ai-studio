import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";

interface SaveInsightButtonProps {
  projectId: string;
  featureId: string;
  featureName: string;
  analysisData: any;
  onSaved?: () => void;
}

export function SaveInsightButton({ 
  projectId, 
  featureId, 
  featureName, 
  analysisData,
  onSaved 
}: SaveInsightButtonProps) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  const saveInsight = async () => {
    if (!user || !analysisData) return;

    setSaving(true);
    const { error } = await supabase.from("project_insights").insert({
      user_id: user.id,
      project_id: projectId,
      insight_type: featureId,
      title: featureName,
      content: analysisData,
      is_saved: true,
    });

    if (error) {
      toast({ title: "Error", description: "Failed to save insight", variant: "destructive" });
    } else {
      setSaved(true);
      toast({ title: "Saved!", description: `${featureName} insight saved to project` });
      onSaved?.();
    }
    setSaving(false);
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={saveInsight}
      disabled={saving || saved}
      className={saved ? "border-success text-success" : ""}
    >
      {saving ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : saved ? (
        <BookmarkCheck className="w-4 h-4" />
      ) : (
        <Bookmark className="w-4 h-4" />
      )}
    </Button>
  );
}
