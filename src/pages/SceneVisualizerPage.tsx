import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Image, Loader2, Download, Film, Trash2 } from "lucide-react";
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
  created_at: string;
}

export default function SceneVisualizerPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedImages, setSavedImages] = useState<SceneMedia[]>([]);
  
  // Image generation state
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageTitle, setImageTitle] = useState("");
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [savingImage, setSavingImage] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchProject();
    fetchSavedImages();
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

  const fetchSavedImages = async () => {
    const { data, error } = await supabase
      .from("scene_media")
      .select("*")
      .eq("project_id", id)
      .eq("media_type", "image")
      .order("created_at", { ascending: false });
    
    if (!error && data) {
      setSavedImages(data);
    }
  };

  const generateSceneImage = async () => {
    if (!imagePrompt.trim()) {
      toast({ title: "Error", description: "Please describe the scene you want to visualize", variant: "destructive" });
      return;
    }

    setGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-scene-image", {
        body: {
          prompt: imagePrompt,
          projectName: project?.name,
          genre: project?.genre,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setGeneratedImage(data.imageUrl);
      toast({ title: "Image Generated", description: "Your scene visualization is ready!" });
    } catch (error: any) {
      toast({ title: "Generation Error", description: error.message || "Failed to generate image", variant: "destructive" });
    }
    setGeneratingImage(false);
  };

  const saveGeneratedImage = async () => {
    if (!generatedImage || !user || !id) return;
    
    setSavingImage(true);
    try {
      const { error } = await supabase.from("scene_media").insert({
        project_id: id,
        user_id: user.id,
        media_type: "image",
        title: imageTitle || "Scene Image",
        prompt: imagePrompt,
        media_url: generatedImage,
      });

      if (error) throw error;
      
      toast({ title: "Saved", description: "Image added to storyboard" });
      fetchSavedImages();
      setGeneratedImage(null);
      setImagePrompt("");
      setImageTitle("");
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to save image", variant: "destructive" });
    }
    setSavingImage(false);
  };

  const deleteImage = async (imageId: string) => {
    try {
      const { error } = await supabase
        .from("scene_media")
        .delete()
        .eq("id", imageId);
      
      if (error) throw error;
      
      toast({ title: "Deleted", description: "Image removed" });
      fetchSavedImages();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete image", variant: "destructive" });
    }
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
              <Image className="w-5 h-5 text-primary" />
              <span className="font-semibold">Scene Visualizer</span>
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
                <Image className="w-6 h-6 text-primary" />
                Generate Scene Image
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Describe your scene and let AI create a visual concept for your storyboard
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Scene Title</label>
                  <Input 
                    value={imageTitle}
                    onChange={(e) => setImageTitle(e.target.value)}
                    placeholder="e.g., Opening Shot, Chase Sequence..."
                    className="bg-muted/50 border-border"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Scene Description</label>
                  <Textarea 
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="Describe the scene in detail... (e.g., 'A dimly lit detective's office at night, noir style, rain streaming down the window, silhouette of a figure by the desk')"
                    className="min-h-[120px] bg-muted/50 border-border"
                  />
                </div>
                
                <Button 
                  onClick={generateSceneImage} 
                  disabled={generatingImage} 
                  className="w-full bg-gradient-gold text-primary-foreground"
                  size="lg"
                >
                  {generatingImage ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...</>
                  ) : (
                    <><Image className="w-4 h-4 mr-2" /> Generate Scene Image</>
                  )}
                </Button>
              </div>
              
              {generatedImage && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-6"
                >
                  <img 
                    src={generatedImage} 
                    alt="Generated scene" 
                    className="w-full rounded-lg shadow-lg mb-4" 
                  />
                  <Button 
                    onClick={saveGeneratedImage} 
                    disabled={savingImage} 
                    className="w-full" 
                    variant="outline"
                  >
                    {savingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Save to Storyboard
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Right Column - Saved Images */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="card-cinematic rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Saved Scene Images</h2>
              
              {savedImages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Image className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No saved images yet</p>
                  <p className="text-sm">Generate and save images to see them here</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {savedImages.map((image) => (
                    <motion.div
                      key={image.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group relative rounded-lg overflow-hidden bg-muted/30"
                    >
                      <img 
                        src={image.media_url} 
                        alt={image.title} 
                        className="w-full aspect-video object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="font-semibold text-sm mb-1">{image.title}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2">{image.prompt}</p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => deleteImage(image.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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
