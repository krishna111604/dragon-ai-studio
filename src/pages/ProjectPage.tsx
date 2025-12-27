import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Film, ArrowLeft, Save, Sparkles, Clapperboard, Brain, 
  Music, BookOpen, TrendingUp, Loader2, Copy, Check
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SaveInsightButton } from "@/components/SaveInsightButton";
import { SavedInsightsList } from "@/components/SavedInsightsList";
import { DragonAnimation } from "@/components/DragonAnimation";

interface Project {
  id: string;
  name: string;
  genre: string | null;
  target_audience: string | null;
  script_content: string | null;
  scene_description: string | null;
}

const aiFeatures = [
  { id: "script_analysis", icon: Sparkles, name: "Script Analyzer", desc: "Analyze story structure and emotional arc" },
  { id: "directors_lens", icon: Clapperboard, name: "Director's Lens", desc: "Get cinematic suggestions" },
  { id: "dream_weaver", icon: Brain, name: "Dream Weaver", desc: "Creative brainstorming" },
  { id: "emotional_arc", icon: Music, name: "Emotional Arc", desc: "Music & sound suggestions" },
  { id: "film_historian", icon: BookOpen, name: "Film Historian", desc: "Find references & inspirations" },
  { id: "oracle_prediction", icon: TrendingUp, name: "The Oracle", desc: "Predictive analytics" },
];

export default function ProjectPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scriptContent, setScriptContent] = useState("");
  const [sceneDescription, setSceneDescription] = useState("");
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiResults, setAiResults] = useState<Record<string, any>>({});
  const [copied, setCopied] = useState(false);
  const [insightRefresh, setInsightRefresh] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) {
      toast({ title: "Error", description: "Failed to load project", variant: "destructive" });
    } else {
      setProject(data);
      setScriptContent(data.script_content || "");
      setSceneDescription(data.scene_description || "");
    }
    setLoading(false);
  };

  const saveProject = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("projects")
      .update({ script_content: scriptContent, scene_description: sceneDescription })
      .eq("id", id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to save", variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Project updated successfully" });
    }
    setSaving(false);
  };

  const runAiFeature = async (featureId: string) => {
    if (!scriptContent && !sceneDescription) {
      toast({ title: "Error", description: "Please add script content or scene description first", variant: "destructive" });
      return;
    }

    setAiLoading(featureId);
    try {
      const { data, error } = await supabase.functions.invoke("dragon-ai", {
        body: {
          feature: featureId,
          projectData: {
            name: project?.name || "",
            genre: project?.genre,
            targetAudience: project?.target_audience,
            scriptContent,
            sceneDescription,
          },
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setAiResults({ ...aiResults, [featureId]: data.analysis });
      toast({ title: "Analysis Complete", description: `${aiFeatures.find(f => f.id === featureId)?.name} finished` });
    } catch (error: any) {
      toast({ title: "AI Error", description: error.message || "Failed to run analysis", variant: "destructive" });
    }
    setAiLoading(null);
  };

  const copyResults = (featureId: string) => {
    navigator.clipboard.writeText(JSON.stringify(aiResults[featureId], null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied", description: "Results copied to clipboard" });
  };

  const renderAnalysis = (data: any) => {
    if (!data) return null;
    if (data.rawAnalysis) return <pre className="whitespace-pre-wrap text-sm">{data.rawAnalysis}</pre>;
    
    return Object.entries(data).map(([key, value]) => (
      <div key={key} className="mb-4">
        <h4 className="font-semibold text-primary capitalize mb-2">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
        <div className="text-sm text-muted-foreground">
          {Array.isArray(value) ? (
            <ul className="list-disc list-inside space-y-1">
              {value.map((item, i) => <li key={i}>{typeof item === 'object' ? JSON.stringify(item) : String(item)}</li>)}
            </ul>
          ) : typeof value === 'object' ? (
            <pre className="text-xs bg-muted/50 p-2 rounded">{JSON.stringify(value, null, 2)}</pre>
          ) : (
            <p>{String(value)}</p>
          )}
        </div>
      </div>
    ));
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!project) return <div className="min-h-screen bg-background flex items-center justify-center"><p>Project not found</p></div>;

  return (
    <div className="min-h-screen bg-background relative">
      <DragonAnimation />
      
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button></Link>
            <div className="flex items-center gap-2">
              <Film className="w-5 h-5 text-primary" />
              <span className="font-semibold">{project.name}</span>
            </div>
          </div>
          <Button onClick={saveProject} disabled={saving} className="bg-gradient-gold text-primary-foreground">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Script Input */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="card-cinematic rounded-xl p-6">
              <h3 className="font-semibold mb-4">Script Content</h3>
              <Textarea 
                value={scriptContent}
                onChange={(e) => setScriptContent(e.target.value)}
                placeholder="Paste your script here..."
                className="min-h-[300px] bg-muted/50 border-border"
              />
            </div>
            <div className="card-cinematic rounded-xl p-6">
              <h3 className="font-semibold mb-4">Scene Description</h3>
              <Textarea 
                value={sceneDescription}
                onChange={(e) => setSceneDescription(e.target.value)}
                placeholder="Describe the scene you want to analyze..."
                className="min-h-[150px] bg-muted/50 border-border"
              />
            </div>
            
            {/* Saved Insights */}
            {id && <SavedInsightsList projectId={id} refreshTrigger={insightRefresh} />}
          </motion.div>

          {/* AI Features */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Tabs defaultValue="script_analysis" className="space-y-4">
              <TabsList className="grid grid-cols-3 lg:grid-cols-6 bg-muted/50">
                {aiFeatures.map((f) => (
                  <TabsTrigger key={f.id} value={f.id} className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <f.icon className="w-4 h-4" />
                  </TabsTrigger>
                ))}
              </TabsList>

              {aiFeatures.map((feature) => (
                <TabsContent key={feature.id} value={feature.id}>
                  <div className="card-cinematic rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          <feature.icon className="w-5 h-5 text-primary" />
                          {feature.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{feature.desc}</p>
                      </div>
                      <div className="flex gap-2">
                        {aiResults[feature.id] && (
                          <>
                            <SaveInsightButton
                              projectId={id!}
                              featureId={feature.id}
                              featureName={feature.name}
                              analysisData={aiResults[feature.id]}
                              onSaved={() => setInsightRefresh(prev => prev + 1)}
                            />
                            <Button variant="outline" size="sm" onClick={() => copyResults(feature.id)}>
                              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </>
                        )}
                        <Button 
                          onClick={() => runAiFeature(feature.id)}
                          disabled={aiLoading === feature.id}
                          className="bg-gradient-gold text-primary-foreground"
                        >
                          {aiLoading === feature.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Analyze
                        </Button>
                      </div>
                    </div>
                    
                    <div className="min-h-[300px] bg-muted/30 rounded-lg p-4 overflow-auto">
                      {aiLoading === feature.id ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">AI is analyzing...</p>
                          </div>
                        </div>
                      ) : aiResults[feature.id] ? (
                        renderAnalysis(aiResults[feature.id])
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <p>Click Analyze to get AI insights</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
