import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, ChevronDown, ChevronUp, Sparkles, Clapperboard, Brain, Music, BookOpen, TrendingUp, FileText, Image } from "lucide-react";
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
  audio_analyzer: Music,
};

const typeLabels: Record<string, string> = {
  script_analysis: "Script Analysis",
  directors_lens: "Director's Lens",
  dream_weaver: "Dream Weaver",
  emotional_arc: "Emotional Arc",
  film_historian: "Film Historian",
  oracle_prediction: "The Oracle",
  audio_analyzer: "Audio Analyzer",
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

  const renderFullContent = (content: Json, insightType: string) => {
    if (!content) return null;
    
    const data = content as Record<string, unknown>;
    
    // Display the raw analysis content in full
    if (data.rawAnalysis) {
      return (
        <div className="space-y-4">
          <div className="bg-background/50 rounded-lg p-4 border border-border/30">
            <h5 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              {typeLabels[insightType] || "Analysis"} Results
            </h5>
            <pre className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
              {String(data.rawAnalysis)}
            </pre>
          </div>
          {renderSavedContext(data.savedContext as Record<string, unknown> | undefined)}
        </div>
      );
    }
    
    // For structured data, render each section fully
    return (
      <div className="space-y-4">
        {Object.entries(data).filter(([key]) => key !== 'savedContext').map(([key, value]) => (
          <div key={key} className="bg-background/50 rounded-lg p-4 border border-border/30">
            <h5 className="text-sm font-semibold text-primary mb-2 capitalize">
              {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
            </h5>
            <div className="text-sm text-foreground">
              {renderValue(value)}
            </div>
          </div>
        ))}
        {renderSavedContext(data.savedContext as Record<string, unknown> | undefined)}
      </div>
    );
  };

  const renderValue = (value: unknown): React.ReactNode => {
    if (value === null || value === undefined) return <span className="text-muted-foreground">N/A</span>;
    
    if (Array.isArray(value)) {
      return (
        <ul className="list-disc list-inside space-y-1">
          {value.map((item, i) => (
            <li key={i} className="text-sm">{typeof item === 'object' ? JSON.stringify(item, null, 2) : String(item)}</li>
          ))}
        </ul>
      );
    }
    
    if (typeof value === 'object') {
      return (
        <pre className="whitespace-pre-wrap text-sm bg-muted/30 p-2 rounded">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }
    
    return <p className="whitespace-pre-wrap">{String(value)}</p>;
  };

  const renderSavedContext = (savedContext: Record<string, unknown> | undefined) => {
    if (!savedContext) return null;
    
    return (
      <div className="mt-4 pt-4 border-t border-border/50">
        <h5 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <FileText className="w-3 h-3" />
          Context When Saved
        </h5>
        <div className="space-y-3">
          {savedContext.scriptContent && (
            <div className="bg-muted/20 rounded p-3">
              <span className="text-xs font-medium text-muted-foreground block mb-1">Script Content:</span>
              <p className="text-xs text-foreground/80 whitespace-pre-wrap line-clamp-4">
                {String(savedContext.scriptContent)}
              </p>
            </div>
          )}
          {savedContext.sceneDescription && (
            <div className="bg-muted/20 rounded p-3">
              <span className="text-xs font-medium text-muted-foreground block mb-1">Scene Description:</span>
              <p className="text-xs text-foreground/80 whitespace-pre-wrap">
                {String(savedContext.sceneDescription)}
              </p>
            </div>
          )}
          {savedContext.savedAt && (
            <p className="text-xs text-muted-foreground">
              Saved: {new Date(String(savedContext.savedAt)).toLocaleString()}
            </p>
          )}
        </div>
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
      <ScrollArea className="max-h-[500px]">
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
                    <div className="flex-1">
                      <span className="text-sm font-medium">{insight.title}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({typeLabels[insight.insight_type] || insight.insight_type})
                      </span>
                    </div>
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
                      {renderFullContent(insight.content, insight.insight_type)}
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
