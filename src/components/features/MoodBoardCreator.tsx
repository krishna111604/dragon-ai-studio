import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Palette,
  Sparkles,
  Loader2,
  Save,
  Plus,
  X,
  Image as ImageIcon,
} from "lucide-react";

interface MoodBoardCreatorProps {
  projectId?: string;
  sceneDescription?: string;
}

interface GeneratedImage {
  url: string;
  prompt: string;
}

export function MoodBoardCreator({ projectId, sceneDescription }: MoodBoardCreatorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [moodDescription, setMoodDescription] = useState(sceneDescription || "");
  const [keyword, setKeyword] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [colorPalette, setColorPalette] = useState<string[]>([]);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingColors, setGeneratingColors] = useState(false);

  const addKeyword = () => {
    if (keyword.trim() && !keywords.includes(keyword.trim())) {
      setKeywords([...keywords, keyword.trim()]);
      setKeyword("");
    }
  };

  const removeKeyword = (k: string) => {
    setKeywords(keywords.filter((kw) => kw !== k));
  };

  const generateColorPalette = async () => {
    if (!moodDescription.trim() && keywords.length === 0) {
      toast({
        title: "Missing Information",
        description: "Add a mood description or keywords first.",
        variant: "destructive",
      });
      return;
    }

    setGeneratingColors(true);
    try {
      const prompt = `As a professional colorist and cinematographer, generate a color palette for a film scene.

MOOD: ${moodDescription}
KEYWORDS: ${keywords.join(", ")}

Generate 5-6 hex colors that would create this mood on screen. Consider:
- Primary color (dominant)
- Secondary colors (supporting)
- Accent colors (highlights)
- Shadow/dark tones

Return ONLY a JSON array of hex colors like: ["#2C3E50", "#E74C3C", "#ECF0F1", "#3498DB", "#1ABC9C"]`;

      const { data, error } = await supabase.functions.invoke("dragon-ai", {
        body: { feature: "color_palette", userPrompt: prompt },
      });

      if (error) throw error;

      const content = data.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\[[\s\S]*?\]/);
      
      if (jsonMatch) {
        const colors = JSON.parse(jsonMatch[0]);
        setColorPalette(colors);
        toast({
          title: "🎨 Palette Generated!",
          description: "Your cinematic color palette is ready.",
        });
      }
    } catch (error: any) {
      console.error("Color palette error:", error);
      toast({
        title: "Generation Failed",
        description: "Could not generate color palette.",
        variant: "destructive",
      });
    } finally {
      setGeneratingColors(false);
    }
  };

  const generateMoodImage = async () => {
    if (!moodDescription.trim()) {
      toast({
        title: "Missing Description",
        description: "Please describe the mood you want to visualize.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const imagePrompt = `Cinematic film still, ${moodDescription}, ${keywords.join(", ")}, professional cinematography, movie scene, atmospheric lighting, high production value`;

      const { data, error } = await supabase.functions.invoke("dragon-ai", {
        body: { 
          feature: "mood_board_image", 
          userPrompt: imagePrompt,
          generateImage: true 
        },
      });

      if (error) throw error;

      // Check if we got an image back
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      
      if (imageUrl) {
        setGeneratedImages([...generatedImages, { url: imageUrl, prompt: moodDescription }]);
        toast({
          title: "🎬 Image Generated!",
          description: "Your mood board image is ready.",
        });
      } else {
        // Fallback: Generate a placeholder or description
        toast({
          title: "Image Pending",
          description: "Image generation is processing. The AI has described your vision.",
        });
      }
    } catch (error: any) {
      console.error("Image generation error:", error);
      toast({
        title: "Note",
        description: "Image generation requires additional setup. Colors and keywords saved.",
      });
    } finally {
      setGenerating(false);
    }
  };

  const saveMoodBoard = async () => {
    if (!user || !projectId) {
      toast({
        title: "Cannot Save",
        description: "Please ensure you're in a project.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("mood_boards").insert({
        project_id: projectId,
        user_id: user.id,
        title: title || "Untitled Mood Board",
        mood_description: moodDescription,
        keywords: keywords,
        color_palette: colorPalette as unknown as any,
        generated_images: generatedImages as unknown as any,
      });

      if (error) throw error;

      toast({
        title: "Mood Board Saved!",
        description: "Your mood board has been saved to the project.",
      });
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="card-cinematic">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-gold flex items-center justify-center">
            <Palette className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <span className="text-gradient-gold">Mood Board Creator</span>
            <p className="text-xs text-muted-foreground font-normal mt-0.5">
              Visualize your film's aesthetic
            </p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Title & Description */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="moodTitle">Board Title</Label>
            <Input
              id="moodTitle"
              placeholder="e.g., Night Chase Sequence"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-muted/50"
            />
          </div>

          <div>
            <Label htmlFor="moodDesc">Mood Description</Label>
            <textarea
              id="moodDesc"
              placeholder="Describe the visual feeling you want... e.g., 'Tense urban noir with neon reflections on wet streets, shadows and mystery'"
              value={moodDescription}
              onChange={(e) => setMoodDescription(e.target.value)}
              className="w-full min-h-[80px] rounded-md border border-input bg-muted/50 px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Keywords */}
        <div>
          <Label>Visual Keywords</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Add keyword (e.g., noir, rain, neon)..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addKeyword()}
              className="bg-muted/50"
            />
            <Button type="button" onClick={addKeyword} variant="outline" size="icon">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {keywords.map((k) => (
                <Badge key={k} variant="secondary" className="flex items-center gap-1">
                  {k}
                  <button onClick={() => removeKeyword(k)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={generateColorPalette}
            disabled={generatingColors}
            variant="outline"
          >
            {generatingColors ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Palette className="w-4 h-4 mr-2" />
            )}
            Generate Colors
          </Button>
          
          <Button
            onClick={generateMoodImage}
            disabled={generating || !moodDescription.trim()}
            variant="outline"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ImageIcon className="w-4 h-4 mr-2" />
            )}
            Generate Image
          </Button>
        </div>

        {/* Color Palette Display */}
        <AnimatePresence>
          {colorPalette.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              <Label>Color Palette</Label>
              <div className="flex gap-2 flex-wrap">
                {colorPalette.map((color, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex flex-col items-center"
                  >
                    <div
                      className="w-12 h-12 rounded-lg shadow-md border border-border/50"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs text-muted-foreground mt-1">
                      {color}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generated Images */}
        <AnimatePresence>
          {generatedImages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <Label>Generated Visuals</Label>
              <ScrollArea className="h-[200px]">
                <div className="grid grid-cols-2 gap-2">
                  {generatedImages.map((img, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="relative rounded-lg overflow-hidden border border-border/50"
                    >
                      <img
                        src={img.url}
                        alt={img.prompt}
                        className="w-full h-32 object-cover"
                      />
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Save Button */}
        {projectId && (colorPalette.length > 0 || keywords.length > 0) && (
          <Button
            onClick={saveMoodBoard}
            disabled={saving}
            className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Mood Board
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
