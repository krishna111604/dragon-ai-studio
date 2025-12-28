import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Image, Loader2, Download, Trash2, Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SceneMedia {
  id: string;
  title: string;
  prompt: string;
  media_url: string;
  created_at: string;
}

interface Character {
  id: string;
  name: string;
  description: string;
  appearance_details: string | null;
}

interface SceneVisualizerEmbedProps {
  projectId: string;
  projectName?: string;
  genre?: string | null;
  onMediaSaved?: () => void;
}

export function SceneVisualizerEmbed({ projectId, projectName, genre, onMediaSaved }: SceneVisualizerEmbedProps) {
  const { user } = useAuth();
  const [savedImages, setSavedImages] = useState<SceneMedia[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<string>("");
  
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageTitle, setImageTitle] = useState("");
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [savingImage, setSavingImage] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchSavedImages();
    fetchCharacters();
  }, [projectId]);

  const fetchCharacters = async () => {
    const { data, error } = await supabase
      .from("project_characters")
      .select("id, name, description, appearance_details")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });
    
    if (!error && data) {
      setCharacters(data as Character[]);
    }
  };

  const fetchSavedImages = async () => {
    const { data, error } = await supabase
      .from("scene_media")
      .select("*")
      .eq("project_id", projectId)
      .eq("media_type", "image")
      .order("created_at", { ascending: false })
      .limit(6);
    
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
      // Build prompt with character consistency
      let fullPrompt = imagePrompt;
      if (selectedCharacter) {
        const character = characters.find(c => c.id === selectedCharacter);
        if (character) {
          fullPrompt = `${imagePrompt}. Include character: ${character.name} - ${character.description}`;
          if (character.appearance_details) {
            fullPrompt += `. Physical appearance: ${character.appearance_details}`;
          }
        }
      }

      const { data, error } = await supabase.functions.invoke("generate-scene-image", {
        body: {
          prompt: fullPrompt,
          projectName,
          genre,
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
    if (!generatedImage || !user || !projectId) return;
    
    setSavingImage(true);
    try {
      const { error } = await supabase.from("scene_media").insert({
        project_id: projectId,
        user_id: user.id,
        media_type: "image",
        title: imageTitle || "Scene Image",
        prompt: imagePrompt,
        media_url: generatedImage,
      });

      if (error) throw error;
      
      toast({ title: "Saved", description: "Image added to storyboard" });
      fetchSavedImages();
      onMediaSaved?.();
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
      onMediaSaved?.();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete image", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Generator Section */}
      <div>
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <Image className="w-5 h-5 text-primary" />
          Scene Visualizer
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Generate AI-powered visual concepts for your storyboard
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
              placeholder="Describe the scene in detail..."
              className="min-h-[100px] bg-muted/50 border-border"
            />
          </div>

          {characters.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Users className="w-4 h-4" />
                Include Character (for consistency)
              </label>
              <Select value={selectedCharacter} onValueChange={setSelectedCharacter}>
                <SelectTrigger className="bg-muted/50 border-border">
                  <SelectValue placeholder="Select a character (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {characters.map((char) => (
                    <SelectItem key={char.id} value={char.id}>
                      {char.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <Button 
            onClick={generateSceneImage} 
            disabled={generatingImage} 
            className="w-full bg-gradient-gold text-primary-foreground"
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
            className="mt-4"
          >
            <img 
              src={generatedImage} 
              alt="Generated scene" 
              className="w-full rounded-lg shadow-lg mb-3" 
            />
            <Button 
              onClick={saveGeneratedImage} 
              disabled={savingImage} 
              className="w-full" 
              variant="outline"
            >
              {savingImage ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
              Save to Storyboard
            </Button>
          </motion.div>
        )}
      </div>

      {/* Saved Images Grid */}
      {savedImages.length > 0 && (
        <div>
          <h4 className="font-medium text-sm mb-3">Recent Images</h4>
          <div className="grid grid-cols-2 gap-2">
            {savedImages.slice(0, 4).map((image) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="group relative rounded-lg overflow-hidden bg-muted/30 aspect-video"
              >
                <img 
                  src={image.media_url} 
                  alt={image.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <h3 className="font-semibold text-xs truncate">{image.title}</h3>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0"
                    onClick={() => deleteImage(image.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}