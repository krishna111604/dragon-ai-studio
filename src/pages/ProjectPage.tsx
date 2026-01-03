import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Film, ArrowLeft, Save, Sparkles, Clapperboard, Brain, 
  Music, BookOpen, TrendingUp, Loader2, Copy, Check, Share2
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SaveInsightButton } from "@/components/SaveInsightButton";
import { SavedInsightsList } from "@/components/SavedInsightsList";
import { DragonAnimation } from "@/components/DragonAnimation";
import { StoryboardView } from "@/components/StoryboardView";
import { SavedMediaList } from "@/components/SavedMediaList";
import { SceneVisualizerEmbed } from "@/components/SceneVisualizerEmbed";
import { AudioAnalyzerEmbed } from "@/components/AudioAnalyzerEmbed";
import { CollaborationPresence } from "@/components/CollaborationPresence";
import { CollaboratorCursors } from "@/components/CollaboratorCursors";
import { ExportPDF } from "@/components/ExportPDF";
import { VoiceToScript } from "@/components/VoiceToScript";
import { VersionHistory } from "@/components/VersionHistory";
import { CharacterManager } from "@/components/CharacterManager";
import { useRealtimeScript } from "@/hooks/useRealtimeScript";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Project {
  id: string;
  name: string;
  genre: string | null;
  target_audience: string | null;
  script_content: string | null;
  scene_description: string | null;
  project_code?: string;
  user_id: string;
}

const aiFeatures = [
  { id: "script_analysis", icon: Sparkles, name: "Script Analyzer", desc: "Analyze story structure and emotional arc" },
  { id: "directors_lens", icon: Clapperboard, name: "Director's Lens", desc: "Scene visualization & cinematic suggestions" },
  { id: "dream_weaver", icon: Brain, name: "Dream Weaver", desc: "Creative brainstorming" },
  { id: "audio_analyzer", icon: Music, name: "Audio Analyzer", desc: "Scene music generation & audio suggestions" },
  { id: "film_historian", icon: BookOpen, name: "Film Historian", desc: "Find references & inspirations" },
  { id: "oracle_prediction", icon: TrendingUp, name: "The Oracle", desc: "Predictive analytics & saved media" },
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
  const [codeCopied, setCodeCopied] = useState(false);
  const [insightRefresh, setInsightRefresh] = useState(0);
  const [mediaRefresh, setMediaRefresh] = useState(0);
  
  const scriptTextareaRef = useRef<HTMLTextAreaElement>(null);
  const sceneTextareaRef = useRef<HTMLTextAreaElement>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout>();
  
  const { toast } = useToast();

  // Real-time script syncing
  const handleRemoteScriptChange = useCallback((content: string) => {
    setScriptContent(content);
  }, []);
  
  const handleRemoteSceneChange = useCallback((description: string) => {
    setSceneDescription(description);
  }, []);

  const { updateScript, updateScene } = useRealtimeScript({
    projectId: id || '',
    onScriptChange: handleRemoteScriptChange,
    onSceneChange: handleRemoteSceneChange,
  });

  // Debounced sync for local changes
  const handleScriptChange = useCallback((value: string) => {
    setScriptContent(value);
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      updateScript(value);
    }, 500);
  }, [updateScript]);

  const handleSceneChange = useCallback((value: string) => {
    setSceneDescription(value);
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      updateScene(value);
    }, 500);
  }, [updateScene]);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    const { data, error } = await (supabase
      .from("projects")
      .select("*") as any)
      .eq("id", id)
      .single();
    
    if (error) {
      toast({ title: "Error", description: "Failed to load project", variant: "destructive" });
    } else {
      setProject(data as Project);
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
    const content = aiResults[featureId]?.content || JSON.stringify(aiResults[featureId], null, 2);
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied", description: "Results copied to clipboard" });
  };

  const renderAnalysis = (data: any) => {
    if (!data) return null;
    
    if (data.content) {
      return (
        <div className="prose prose-sm prose-invert max-w-none">
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {data.content}
          </div>
        </div>
      );
    }
    
    if (data.rawAnalysis) {
      return <pre className="whitespace-pre-wrap text-sm">{data.rawAnalysis}</pre>;
    }
    
    return Object.entries(data).map(([key, value]) => (
      <div key={key} className="mb-4">
        <h4 className="font-semibold text-primary capitalize mb-2">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
        <div className="text-sm text-muted-foreground">
          {typeof value === 'string' ? (
            <p className="whitespace-pre-wrap">{value}</p>
          ) : Array.isArray(value) ? (
            <ul className="list-disc list-inside space-y-1">
              {value.map((item, i) => <li key={i}>{typeof item === 'object' ? JSON.stringify(item) : String(item)}</li>)}
            </ul>
          ) : (
            <p>{String(value)}</p>
          )}
        </div>
      </div>
    ));
  };

  const renderOracleContent = () => (
    <div className="space-y-6">
      {/* AI Analysis Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Predictive Analytics
            </h3>
            <p className="text-sm text-muted-foreground">Get AI predictions and insights</p>
          </div>
          <div className="flex gap-2">
            {aiResults["oracle_prediction"] && (
              <>
                <SaveInsightButton
                  projectId={id!}
                  featureId="oracle_prediction"
                  featureName="The Oracle"
                  analysisData={aiResults["oracle_prediction"]}
                  scriptContent={scriptContent}
                  sceneDescription={sceneDescription}
                  onSaved={() => setInsightRefresh(prev => prev + 1)}
                />
                <Button variant="outline" size="sm" onClick={() => copyResults("oracle_prediction")}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </>
            )}
            <Button 
              onClick={() => runAiFeature("oracle_prediction")}
              disabled={aiLoading === "oracle_prediction"}
              className="bg-gradient-gold text-primary-foreground"
            >
              {aiLoading === "oracle_prediction" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Analyze
            </Button>
          </div>
        </div>
        
        <div className="min-h-[150px] max-h-[300px] bg-muted/30 rounded-lg p-4 overflow-auto mb-6">
          {aiLoading === "oracle_prediction" ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">AI is analyzing...</p>
              </div>
            </div>
          ) : aiResults["oracle_prediction"] ? (
            renderAnalysis(aiResults["oracle_prediction"])
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Click Analyze to get AI predictions</p>
            </div>
          )}
        </div>
      </div>

      {/* Saved Media */}
      <div className="card-cinematic rounded-xl p-5">
        <h3 className="font-semibold mb-3">Saved Media</h3>
        <SavedMediaList projectId={id!} refreshTrigger={mediaRefresh} />
      </div>
    </div>
  );

  const renderDirectorsLensContent = () => (
    <div className="space-y-6">
      {/* AI Analysis Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <Clapperboard className="w-5 h-5 text-primary" />
              Cinematic Analysis
            </h3>
            <p className="text-sm text-muted-foreground">Get cinematic suggestions for your scenes</p>
          </div>
          <div className="flex gap-2">
            {aiResults["directors_lens"] && (
              <>
                <SaveInsightButton
                  projectId={id!}
                  featureId="directors_lens"
                  featureName="Director's Lens"
                  analysisData={aiResults["directors_lens"]}
                  scriptContent={scriptContent}
                  sceneDescription={sceneDescription}
                  onSaved={() => setInsightRefresh(prev => prev + 1)}
                />
                <Button variant="outline" size="sm" onClick={() => copyResults("directors_lens")}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </>
            )}
            <Button 
              onClick={() => runAiFeature("directors_lens")}
              disabled={aiLoading === "directors_lens"}
              className="bg-gradient-gold text-primary-foreground"
            >
              {aiLoading === "directors_lens" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Analyze
            </Button>
          </div>
        </div>
        
        <div className="min-h-[120px] max-h-[200px] bg-muted/30 rounded-lg p-4 overflow-auto mb-6">
          {aiLoading === "directors_lens" ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">AI is analyzing...</p>
              </div>
            </div>
          ) : aiResults["directors_lens"] ? (
            renderAnalysis(aiResults["directors_lens"])
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Click Analyze to get cinematic insights</p>
            </div>
          )}
        </div>
      </div>

      {/* Scene Visualizer */}
      <div className="card-cinematic rounded-xl p-5">
        <SceneVisualizerEmbed 
          projectId={id!} 
          projectName={project?.name}
          genre={project?.genre}
          onMediaSaved={() => setMediaRefresh(prev => prev + 1)}
        />
      </div>
    </div>
  );

  const renderAudioAnalyzerContent = () => (
    <div className="space-y-6">
      {/* AI Analysis Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <Music className="w-5 h-5 text-primary" />
              Audio Analysis
            </h3>
            <p className="text-sm text-muted-foreground">Get music & sound suggestions</p>
          </div>
          <div className="flex gap-2">
            {aiResults["audio_analyzer"] && (
              <>
                <SaveInsightButton
                  projectId={id!}
                  featureId="audio_analyzer"
                  featureName="Audio Analyzer"
                  analysisData={aiResults["audio_analyzer"]}
                  scriptContent={scriptContent}
                  sceneDescription={sceneDescription}
                  onSaved={() => setInsightRefresh(prev => prev + 1)}
                />
                <Button variant="outline" size="sm" onClick={() => copyResults("audio_analyzer")}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </>
            )}
            <Button 
              onClick={() => runAiFeature("audio_analyzer")}
              disabled={aiLoading === "audio_analyzer"}
              className="bg-gradient-gold text-primary-foreground"
            >
              {aiLoading === "audio_analyzer" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Analyze
            </Button>
          </div>
        </div>
        
        <div className="min-h-[120px] max-h-[200px] bg-muted/30 rounded-lg p-4 overflow-auto mb-6">
          {aiLoading === "audio_analyzer" ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">AI is analyzing...</p>
              </div>
            </div>
          ) : aiResults["audio_analyzer"] ? (
            renderAnalysis(aiResults["audio_analyzer"])
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Click Analyze to get audio insights</p>
            </div>
          )}
        </div>
      </div>

      {/* Scene Music Generator */}
      <div className="card-cinematic rounded-xl p-5">
        <AudioAnalyzerEmbed 
          projectId={id!} 
          genre={project?.genre}
          onMediaSaved={() => setMediaRefresh(prev => prev + 1)}
        />
      </div>
    </div>
  );

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
            <CollaborationPresence projectId={id!} />
          </div>
          <div className="flex items-center gap-2">
            {/* Share Project Code */}
            {project.user_id === user?.id && project.project_code && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Project Code</p>
                    <p className="text-xs text-muted-foreground">Share this code with teammates to let them request access.</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-muted px-3 py-2 rounded-md text-lg font-mono tracking-widest text-center">
                        {project.project_code}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(project.project_code || '');
                          setCodeCopied(true);
                          setTimeout(() => setCodeCopied(false), 2000);
                          toast({ title: "Copied!", description: "Project code copied to clipboard" });
                        }}
                      >
                        {codeCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
            <CharacterManager projectId={id!} />
            <VersionHistory 
              projectId={id!}
              currentScriptContent={scriptContent}
              currentSceneDescription={sceneDescription}
              onRestore={(script, scene) => {
                setScriptContent(script);
                setSceneDescription(scene);
              }}
            />
            <ExportPDF projectId={id!} projectName={project.name} />
            <Button onClick={saveProject} disabled={saving} className="bg-gradient-gold text-primary-foreground">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10">
        {/* Storyboard Section */}
        <div className="mb-6">
          <StoryboardView projectId={id!} refreshTrigger={mediaRefresh} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Script Input */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="card-cinematic rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Script Content</h3>
                <VoiceToScript 
                  onTranscript={(text) => handleScriptChange(scriptContent + (scriptContent ? ' ' : '') + text)}
                />
              </div>
              <div className="relative">
                <Textarea 
                  ref={scriptTextareaRef}
                  value={scriptContent}
                  onChange={(e) => handleScriptChange(e.target.value)}
                  placeholder="Paste your script here or use voice input..."
                  className="min-h-[200px] bg-muted/50 border-border"
                />
                <CollaboratorCursors projectId={id!} textareaRef={scriptTextareaRef} />
              </div>
            </div>
            <div className="card-cinematic rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Scene Description</h3>
                <VoiceToScript 
                  onTranscript={(text) => handleSceneChange(sceneDescription + (sceneDescription ? ' ' : '') + text)}
                />
              </div>
              <div className="relative">
                <Textarea 
                  ref={sceneTextareaRef}
                  value={sceneDescription}
                  onChange={(e) => handleSceneChange(e.target.value)}
                  placeholder="Describe the scene or use voice input..."
                  className="min-h-[120px] bg-muted/50 border-border"
                />
              </div>
            </div>
            
            {id && <SavedInsightsList projectId={id} refreshTrigger={insightRefresh} />}
          </motion.div>

          {/* Right Column - AI Features */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Tabs defaultValue="script_analysis" className="space-y-4">
              <TabsList className="grid grid-cols-3 lg:grid-cols-6 bg-muted/50">
                {aiFeatures.map((f) => (
                  <TabsTrigger key={f.id} value={f.id} className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <f.icon className="w-4 h-4" />
                  </TabsTrigger>
                ))}
              </TabsList>

              {aiFeatures.filter(f => !["oracle_prediction", "directors_lens", "audio_analyzer"].includes(f.id)).map((feature) => (
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
                              scriptContent={scriptContent}
                              sceneDescription={sceneDescription}
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
                    
                    <div className="min-h-[300px] max-h-[500px] bg-muted/30 rounded-lg p-4 overflow-auto">
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

              {/* Director's Lens Tab with Visualizer */}
              <TabsContent value="directors_lens">
                <div className="card-cinematic rounded-xl p-6 max-h-[80vh] overflow-auto">
                  {renderDirectorsLensContent()}
                </div>
              </TabsContent>

              {/* Audio Analyzer Tab with Music Generator */}
              <TabsContent value="audio_analyzer">
                <div className="card-cinematic rounded-xl p-6 max-h-[80vh] overflow-auto">
                  {renderAudioAnalyzerContent()}
                </div>
              </TabsContent>

              {/* The Oracle Tab */}
              <TabsContent value="oracle_prediction">
                <div className="card-cinematic rounded-xl p-6 max-h-[80vh] overflow-auto">
                  {renderOracleContent()}
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
