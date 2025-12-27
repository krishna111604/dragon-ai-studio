import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Music, Loader2, Download, Film, Play, Pause, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { DragonAnimation } from "@/components/DragonAnimation";

interface Project {
  id: string;
  name: string;
  genre: string | null;
}

interface SceneMedia {
  id: string;
  title: string;
  prompt: string;
  media_url: string;
  mood: string | null;
  media_type: string;
  created_at: string;
}

export default function SceneMusicPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedMusic, setSavedMusic] = useState<SceneMedia[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Music generation state
  const [musicPrompt, setMusicPrompt] = useState("");
  const [musicMood, setMusicMood] = useState("");
  const [musicTitle, setMusicTitle] = useState("");
  const [generatingMusic, setGeneratingMusic] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [compositionGuide, setCompositionGuide] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [savingMusic, setSavingMusic] = useState(false);
  
  // Playback state for saved items
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [savedAudioElement, setSavedAudioElement] = useState<HTMLAudioElement | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchProject();
    fetchSavedMusic();
  }, [id]);

  const fetchProject = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("id, name, genre")
      .eq("id", id)
      .single();
    
    if (error) {
      toast({ title: "Error", description: "Failed to load project", variant: "destructive" });
    } else {
      setProject(data);
    }
    setLoading(false);
  };

  const fetchSavedMusic = async () => {
    const { data, error } = await supabase
      .from("scene_media")
      .select("*")
      .eq("project_id", id)
      .in("media_type", ["music", "composition"])
      .order("created_at", { ascending: false });
    
    if (!error && data) {
      setSavedMusic(data);
    }
  };

  const generateSceneMusic = async () => {
    if (!musicPrompt.trim()) {
      toast({ title: "Error", description: "Please describe the scene for music generation", variant: "destructive" });
      return;
    }

    setGeneratingMusic(true);
    setCompositionGuide(null);
    setGeneratedAudio(null);
    
    try {
      const { data, error } = await supabase.functions.invoke("generate-scene-music", {
        body: {
          prompt: musicPrompt,
          mood: musicMood,
          genre: project?.genre,
          duration: 30,
        },
      });

      if (error) throw error;
      if (data.error) {
        if (data.needsApiKey) {
          toast({ title: "API Key Required", description: "Please configure your API keys", variant: "destructive" });
        } else {
          throw new Error(data.error);
        }
        return;
      }

      if (data.audioContent) {
        const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
        setGeneratedAudio(audioUrl);
        toast({ title: "Music Generated", description: "Your scene music is ready to play!" });
      } else if (data.compositionGuide) {
        setCompositionGuide(data.compositionGuide);
        toast({ title: "Composition Guide Created", description: "AI has created a detailed music composition guide for your scene." });
      }
    } catch (error: any) {
      toast({ title: "Generation Error", description: error.message || "Failed to generate music", variant: "destructive" });
    }
    setGeneratingMusic(false);
  };

  const saveGeneratedMusic = async () => {
    if ((!generatedAudio && !compositionGuide) || !user || !id) return;
    
    setSavingMusic(true);
    try {
      const mediaUrl = generatedAudio || `composition:${compositionGuide}`;
      const { error } = await supabase.from("scene_media").insert({
        project_id: id,
        user_id: user.id,
        media_type: generatedAudio ? "music" : "composition",
        title: musicTitle || (generatedAudio ? "Scene Music" : "Music Composition Guide"),
        prompt: musicPrompt,
        media_url: mediaUrl,
        mood: musicMood,
      });

      if (error) throw error;
      
      toast({ title: "Saved", description: generatedAudio ? "Music saved to project" : "Composition guide saved" });
      fetchSavedMusic();
      setGeneratedAudio(null);
      setCompositionGuide(null);
      setMusicPrompt("");
      setMusicMood("");
      setMusicTitle("");
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to save", variant: "destructive" });
    }
    setSavingMusic(false);
  };

  const togglePlayMusic = () => {
    if (!generatedAudio) return;
    
    if (isPlaying && audioElement) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      const audio = new Audio(generatedAudio);
      audio.onended = () => setIsPlaying(false);
      audio.play();
      setAudioElement(audio);
      setIsPlaying(true);
    }
  };

  const togglePlaySaved = (item: SceneMedia) => {
    if (item.media_type !== "music") return;
    
    if (playingId === item.id && savedAudioElement) {
      savedAudioElement.pause();
      setPlayingId(null);
    } else {
      if (savedAudioElement) savedAudioElement.pause();
      const audio = new Audio(item.media_url);
      audio.onended = () => setPlayingId(null);
      audio.play();
      setSavedAudioElement(audio);
      setPlayingId(item.id);
    }
  };

  const deleteMusic = async (musicId: string) => {
    try {
      const { error } = await supabase
        .from("scene_media")
        .delete()
        .eq("id", musicId);
      
      if (error) throw error;
      
      toast({ title: "Deleted", description: "Music removed" });
      fetchSavedMusic();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const isComposition = (item: SceneMedia) => item.media_type === "composition" || item.media_url.startsWith("composition:");

  const getCompositionContent = (item: SceneMedia) => {
    if (item.media_url.startsWith("composition:")) {
      return item.media_url.replace("composition:", "");
    }
    return item.media_url;
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (!project) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p>Project not found</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background relative">
      <DragonAnimation />
      
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={`/project/${id}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Project
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-primary" />
              <span className="font-semibold">Scene Music Generator</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Film className="w-4 h-4" />
            {project.name}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Generator */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="card-cinematic rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <Music className="w-6 h-6 text-primary" />
                Generate Scene Music
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Describe your scene and let AI create music or a detailed composition guide
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Music Title</label>
                  <Input 
                    value={musicTitle}
                    onChange={(e) => setMusicTitle(e.target.value)}
                    placeholder="e.g., Chase Theme, Love Theme..."
                    className="bg-muted/50 border-border"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Scene Description</label>
                  <Textarea 
                    value={musicPrompt}
                    onChange={(e) => setMusicPrompt(e.target.value)}
                    placeholder="Describe the scene mood and action... (e.g., 'Tense chase sequence through rain-soaked city streets at night')"
                    className="min-h-[100px] bg-muted/50 border-border"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Mood</label>
                  <Input
                    value={musicMood}
                    onChange={(e) => setMusicMood(e.target.value)}
                    placeholder="e.g., suspenseful, romantic, epic, melancholic"
                    className="bg-muted/50 border-border"
                  />
                </div>
                
                <Button 
                  onClick={generateSceneMusic} 
                  disabled={generatingMusic} 
                  className="w-full bg-gradient-gold text-primary-foreground"
                  size="lg"
                >
                  {generatingMusic ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...</>
                  ) : (
                    <><Music className="w-4 h-4 mr-2" /> Generate Music</>
                  )}
                </Button>
              </div>
              
              {generatedAudio && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-6 space-y-3"
                >
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                    <Button onClick={togglePlayMusic} variant="outline" size="sm">
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <span className="text-sm">Scene music ready</span>
                  </div>
                  <Button 
                    onClick={saveGeneratedMusic} 
                    disabled={savingMusic} 
                    className="w-full" 
                    variant="outline"
                  >
                    {savingMusic ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                    Save Music
                  </Button>
                </motion.div>
              )}
              
              {compositionGuide && !generatedAudio && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-6 space-y-3"
                >
                  <div className="p-4 bg-muted/30 rounded-lg max-h-[300px] overflow-auto">
                    <h4 className="font-semibold text-sm mb-2 text-primary">AI Composition Guide</h4>
                    <div className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                      {compositionGuide}
                    </div>
                  </div>
                  <Button 
                    onClick={saveGeneratedMusic} 
                    disabled={savingMusic} 
                    className="w-full" 
                    variant="outline"
                  >
                    {savingMusic ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                    Save Composition Guide
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Right Column - Saved Music */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="card-cinematic rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Saved Music & Guides</h2>
              
              {savedMusic.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No saved music yet</p>
                  <p className="text-sm">Generate and save music to see it here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedMusic.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {isComposition(item) ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                            >
                              {expandedId === item.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => togglePlaySaved(item)}
                            >
                              {playingId === item.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </Button>
                          )}
                          <div>
                            <h3 className="font-medium text-sm">{item.title}</h3>
                            <p className="text-xs text-muted-foreground">
                              {isComposition(item) ? "Composition Guide" : "Audio"} • {item.mood || "No mood set"}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMusic(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {isComposition(item) && expandedId === item.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-3 p-3 bg-background/50 rounded text-sm whitespace-pre-wrap max-h-[300px] overflow-auto"
                        >
                          {getCompositionContent(item)}
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
