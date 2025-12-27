import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sparkles, Clapperboard, Brain, Music, BookOpen, TrendingUp, 
  Search, Trash2, ArrowRight, Filter, Loader2
} from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import type { Json } from "@/integrations/supabase/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const typeLabels: Record<string, string> = {
  script_analysis: "Script Analysis",
  directors_lens: "Director's Lens",
  dream_weaver: "Dream Weaver",
  emotional_arc: "Emotional Arc",
  film_historian: "Film Historian",
  oracle_prediction: "The Oracle",
};

export default function InsightsPage() {
  const { user } = useAuth();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) fetchAllInsights();
  }, [user]);

  const fetchAllInsights = async () => {
    const { data, error } = await supabase
      .from("project_insights")
      .select("*")
      .eq("user_id", user?.id)
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

  const getPreviewText = (content: Json): string => {
    if (!content) return "";
    const data = content as Record<string, unknown>;
    if (data.rawAnalysis) return String(data.rawAnalysis).slice(0, 120) + "...";
    const firstValue = Object.values(data)[0];
    if (typeof firstValue === 'string') return firstValue.slice(0, 120) + "...";
    return "Click to view full analysis";
  };

  const filteredInsights = insights.filter(insight => {
    const matchesSearch = insight.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || insight.insight_type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-background flex">
      <AppSidebar />
      
      <main className="flex-1 p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-display text-gradient-gold mb-2">All Insights</h1>
              <p className="text-muted-foreground">Browse and manage your saved AI analyses</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search insights..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-muted/50"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48 bg-muted/50">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(typeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Insights Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredInsights.length === 0 ? (
            <div className="card-cinematic rounded-xl p-12 text-center">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No insights yet</h3>
              <p className="text-muted-foreground mb-4">
                Run AI analyses on your projects and save the results here
              </p>
              <Button onClick={() => navigate("/dashboard")} className="bg-gradient-gold text-primary-foreground">
                Go to Projects
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInsights.map((insight, i) => {
                const Icon = iconMap[insight.insight_type] || Sparkles;
                
                return (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 * i }}
                    className="card-cinematic rounded-xl p-5 group hover-lift cursor-pointer"
                    onClick={() => navigate(`/project/${insight.project_id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{insight.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(insight.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteInsight(insight.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                      {getPreviewText(insight.content)}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                        {typeLabels[insight.insight_type] || insight.insight_type}
                      </span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
