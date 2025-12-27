import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Sparkles, Clapperboard, Brain, Music, BookOpen, TrendingUp, ArrowRight } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface Insight {
  id: string;
  project_id: string;
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

const colorMap: Record<string, string> = {
  script_analysis: "text-primary",
  directors_lens: "text-accent",
  dream_weaver: "text-info",
  emotional_arc: "text-success",
  film_historian: "text-warning",
  oracle_prediction: "text-primary",
};

export function RecentInsightsWidget() {
  const { user } = useAuth();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) fetchRecentInsights();
  }, [user]);

  const fetchRecentInsights = async () => {
    const { data } = await supabase
      .from("project_insights")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false })
      .limit(5);

    setInsights(data || []);
    setLoading(false);
  };

  const getPreviewText = (content: Json): string => {
    if (!content) return "";
    const data = content as Record<string, unknown>;
    if (data.rawAnalysis) return String(data.rawAnalysis).slice(0, 60) + "...";
    const firstValue = Object.values(data)[0];
    if (typeof firstValue === 'string') return firstValue.slice(0, 60) + "...";
    return "Click to view details";
  };

  if (loading || insights.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mb-8"
    >
      <h2 className="text-lg font-semibold mb-4">Recent AI Insights</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {insights.slice(0, 3).map((insight, i) => {
          const Icon = iconMap[insight.insight_type] || Sparkles;
          const color = colorMap[insight.insight_type] || "text-primary";
          
          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * i }}
              className="insight-card cursor-pointer group"
              onClick={() => navigate(`/project/${insight.project_id}`)}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{insight.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(insight.created_at).toLocaleDateString()}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {getPreviewText(insight.content)}
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
