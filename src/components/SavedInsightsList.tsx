import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, ChevronDown, ChevronUp, Sparkles, Clapperboard, Brain, Music, BookOpen, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Json } from "@/integrations/supabase/types";

interface Insight {
  id: string;
  insight_type: string;
  title: string;
  content: Json;
  created_at: string;
}

const iconMap: Record<string, any> = {
  script_analysis: Sparkles,
  directors_lens: Clapperboard,
  dream_weaver: Brain,
  emotional_arc: Music,
  film_historian: BookOpen,
  oracle_prediction: TrendingUp,
};

interface SavedInsightsListProps {
  projectId: string;
  refreshTrigger?: number;
}

export function SavedInsightsList({ projectId, refreshTrigger }: SavedInsightsListProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchInsights();
  }, [projectId, refreshTrigger]);

  const fetchInsights = async () => {
    const { data, error } = await supabase
      .from("project_insights")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Failed to load insights", variant: "destructive" });
    } else {
      setInsights(data || []);
    }
    setLoading(false);
  };

  const deleteInsight = async (id: string) => {
    const { error } = await supabase.from("project_insights").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    } else {
      setInsights(insights.filter(i => i.id !== id));
      toast({ title: "Deleted", description: "Insight removed" });
    }
  };

  const renderContent = (content: Json) => {
    if (!content) return null;
    
    const data = content as Record<string, unknown>;
    
    if (data.rawAnalysis) {
      return <pre className="whitespace-pre-wrap text-xs text-muted-foreground">{String(data.rawAnalysis)}</pre>;
    }
    
    return (
      <div className="space-y-2">
        {Object.entries(data).map(([key, value]) => (
          <div key={key}>
            <span className="text-xs font-medium text-primary capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}: </span>
            <span className="text-xs text-muted-foreground">
              {Array.isArray(value) 
                ? value.slice(0, 3).join(", ") + (value.length > 3 ? "..." : "")
                : typeof value === 'object' 
                  ? JSON.stringify(value).slice(0, 100) + "..."
                  : String(value).slice(0, 100)
              }
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) return <div className="text-sm text-muted-foreground">Loading insights...</div>;
  if (insights.length === 0) return null;

  return (
    <div className="card-cinematic rounded-xl p-4">
      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        Saved Insights ({insights.length})
      </h4>
      <ScrollArea className="max-h-[300px]">
        <div className="space-y-2">
          {insights.map((insight) => {
            const Icon = iconMap[insight.insight_type] || Sparkles;
            const isExpanded = expandedId === insight.id;
            
            return (
              <motion.div 
                key={insight.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-muted/30 rounded-lg p-3 border border-border/50"
              >
                <div className="flex items-center justify-between">
                  <div 
                    className="flex items-center gap-2 cursor-pointer flex-1"
                    onClick={() => setExpandedId(isExpanded ? null : insight.id)}
                  >
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{insight.title}</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(insight.created_at).toLocaleDateString()}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => deleteInsight(insight.id)}
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 pt-3 border-t border-border/50 overflow-hidden"
                    >
                      {renderContent(insight.content)}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
