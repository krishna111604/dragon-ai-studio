import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Clapperboard,
  Sparkles,
  Loader2,
  Camera,
  Palette,
  Music,
  Film,
  Quote,
} from "lucide-react";

interface DirectorAnalysis {
  director: string;
  overview: string;
  visualStyle: string;
  camerawork: string;
  lighting: string;
  pacing: string;
  soundtrack: string;
  keyTechniques: string[];
  iconicReference: string;
}

const directors = [
  { name: "Steven Spielberg", style: "Emotional blockbusters with masterful shot composition" },
  { name: "Stanley Kubrick", style: "Meticulous symmetry, one-point perspective, cold precision" },
  { name: "Christopher Nolan", style: "Non-linear narratives, IMAX grandeur, practical effects" },
  { name: "Quentin Tarantino", style: "Sharp dialogue, pop culture, stylized violence" },
  { name: "Wes Anderson", style: "Symmetrical compositions, pastel palettes, whimsy" },
  { name: "Denis Villeneuve", style: "Atmospheric scale, deliberate pacing, visual poetry" },
  { name: "Martin Scorsese", style: "Kinetic camera, long takes, character-driven drama" },
  { name: "David Fincher", style: "Dark palettes, precision editing, psychological depth" },
  { name: "Greta Gerwig", style: "Warm naturalism, literary adaptation, emotional authenticity" },
  { name: "Guillermo del Toro", style: "Gothic fantasy, practical creatures, visual metaphor" },
  { name: "Akira Kurosawa", style: "Epic compositions, weather as character, samurai drama" },
  { name: "Alfred Hitchcock", style: "Suspense master, voyeuristic camera, psychological terror" },
];

interface DirectorStyleAnalyzerProps {
  sceneDescription?: string;
  scriptContent?: string;
}

export function DirectorStyleAnalyzer({ sceneDescription, scriptContent }: DirectorStyleAnalyzerProps) {
  const { toast } = useToast();
  const [sceneInput, setSceneInput] = useState(sceneDescription || "");
  const [selectedDirector, setSelectedDirector] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<DirectorAnalysis | null>(null);
  const [generating, setGenerating] = useState(false);

  const analyzeScene = async () => {
    if (!sceneInput.trim() || !selectedDirector) {
      toast({
        title: "Missing Information",
        description: "Please describe your scene and select a director.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const prompt = `You are a film studies professor and cinematography expert. Analyze how ${selectedDirector} would direct this scene.

SCENE DESCRIPTION:
${sceneInput}

${scriptContent ? `SCRIPT CONTEXT:\n${scriptContent.slice(0, 800)}` : ""}

Provide a detailed analysis of how ${selectedDirector} would approach this scene. Consider their signature style, recurring themes, and technical preferences.

Return ONLY a JSON object with this exact structure:
{
  "director": "${selectedDirector}",
  "overview": "A 2-3 sentence overview of how this director would approach the scene",
  "visualStyle": "Describe the visual composition, framing, and aesthetic choices",
  "camerawork": "Describe camera movements, angles, and shot selections",
  "lighting": "Describe lighting style and mood",
  "pacing": "Describe editing rhythm and scene pacing",
  "soundtrack": "Describe music/sound approach",
  "keyTechniques": ["technique1", "technique2", "technique3"],
  "iconicReference": "A specific scene from this director's filmography that this scene would feel similar to"
}`;

      const { data, error } = await supabase.functions.invoke("dragon-ai", {
        body: { feature: "director_style", userPrompt: prompt },
      });

      if (error) throw error;

      const content = data.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setAnalysis(parsed);
        toast({
          title: `${selectedDirector}'s Vision`,
          description: "Scene analysis complete!",
        });
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: "Could not analyze the scene. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="card-cinematic">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-gold flex items-center justify-center">
            <Clapperboard className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <span className="text-gradient-gold">How Would They Shoot This?</span>
            <p className="text-xs text-muted-foreground font-normal mt-0.5">
              Analyze your scene through a legendary director's lens
            </p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Scene Input */}
        <div>
          <Textarea
            placeholder="Describe your scene... What's happening? Who's involved? What's the emotional tone?"
            value={sceneInput}
            onChange={(e) => setSceneInput(e.target.value)}
            className="min-h-[100px] bg-muted/50"
          />
        </div>

        {/* Director Selection */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Select a Director</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {directors.map((dir) => (
              <button
                key={dir.name}
                onClick={() => setSelectedDirector(dir.name)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedDirector === dir.name
                    ? "border-primary bg-primary/10"
                    : "border-border/50 hover:border-primary/50 bg-muted/30"
                }`}
              >
                <p className="font-medium text-sm">{dir.name}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{dir.style}</p>
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={analyzeScene}
          disabled={generating || !sceneInput.trim() || !selectedDirector}
          className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Channeling {selectedDirector}...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Analyze Scene
            </>
          )}
        </Button>

        {/* Analysis Results */}
        <AnimatePresence>
          {analysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 pt-4"
            >
              <div className="text-center pb-2 border-b border-border/50">
                <h3 className="text-xl font-semibold text-gradient-gold">
                  {analysis.director}'s Vision
                </h3>
                <p className="text-muted-foreground mt-2">{analysis.overview}</p>
              </div>

              <ScrollArea className="h-[350px] pr-4">
                <div className="space-y-4">
                  {/* Visual Style */}
                  <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-primary" />
                      <h4 className="font-semibold">Visual Style</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{analysis.visualStyle}</p>
                  </div>

                  {/* Camerawork */}
                  <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-primary" />
                      <h4 className="font-semibold">Camerawork</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{analysis.camerawork}</p>
                  </div>

                  {/* Lighting */}
                  <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Film className="w-4 h-4 text-primary" />
                      <h4 className="font-semibold">Lighting & Mood</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{analysis.lighting}</p>
                  </div>

                  {/* Pacing */}
                  <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Clapperboard className="w-4 h-4 text-primary" />
                      <h4 className="font-semibold">Pacing & Editing</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{analysis.pacing}</p>
                  </div>

                  {/* Soundtrack */}
                  <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4 text-primary" />
                      <h4 className="font-semibold">Sound & Music</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{analysis.soundtrack}</p>
                  </div>

                  {/* Key Techniques */}
                  <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                    <h4 className="font-semibold">Key Techniques to Apply</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.keyTechniques.map((tech, i) => (
                        <Badge key={i} variant="outline" className="bg-primary/10">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Iconic Reference */}
                  <div className="bg-gradient-gold/10 rounded-lg p-4 border border-primary/30">
                    <div className="flex items-start gap-2">
                      <Quote className="w-4 h-4 text-primary shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold text-primary">Iconic Reference</h4>
                        <p className="text-sm mt-1">{analysis.iconicReference}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
