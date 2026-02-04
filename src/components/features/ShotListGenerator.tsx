import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Camera,
  Video,
  Sparkles,
  Loader2,
  Plus,
  Trash2,
  Save,
  Download,
  Move,
  Eye,
  Clock,
} from "lucide-react";

interface Shot {
  number: number;
  type: string;
  angle: string;
  movement: string;
  subject: string;
  description: string;
  duration: string;
  notes: string;
}

interface ShotListGeneratorProps {
  projectId?: string;
  sceneDescription?: string;
  scriptContent?: string;
}

const shotTypes = ["Wide", "Medium", "Close-up", "Extreme Close-up", "Over-the-shoulder", "POV", "Insert", "Establishing"];
const cameraAngles = ["Eye Level", "High Angle", "Low Angle", "Dutch Angle", "Bird's Eye", "Worm's Eye"];
const cameraMovements = ["Static", "Pan", "Tilt", "Dolly", "Tracking", "Crane", "Handheld", "Steadicam", "Zoom"];

export function ShotListGenerator({ projectId, sceneDescription, scriptContent }: ShotListGeneratorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sceneName, setSceneName] = useState("");
  const [sceneInput, setSceneInput] = useState(sceneDescription || "");
  const [shots, setShots] = useState<Shot[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const generateShotList = async () => {
    if (!sceneInput.trim()) {
      toast({
        title: "Scene Required",
        description: "Please describe your scene to generate a shot list.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const prompt = `As a professional cinematographer and director, analyze this scene and create a detailed shot list.

SCENE DESCRIPTION:
${sceneInput}

${scriptContent ? `SCRIPT CONTEXT:\n${scriptContent.slice(0, 1000)}` : ""}

Generate a professional shot list with 6-10 shots. For each shot, provide:
1. Shot number
2. Shot type (Wide, Medium, Close-up, etc.)
3. Camera angle (Eye Level, High Angle, Low Angle, etc.)
4. Camera movement (Static, Pan, Dolly, Tracking, etc.)
5. Subject (what/who is being filmed)
6. Description (what happens in the shot)
7. Estimated duration
8. Technical notes

Return ONLY a JSON array with this exact structure:
[
  {
    "number": 1,
    "type": "Wide",
    "angle": "Eye Level",
    "movement": "Static",
    "subject": "Characters in room",
    "description": "Establishing shot of the scene",
    "duration": "3 seconds",
    "notes": "Use natural lighting from window"
  }
]`;

      const { data, error } = await supabase.functions.invoke("dragon-ai", {
        body: { feature: "shot_list", userPrompt: prompt },
      });

      if (error) throw error;

      const content = data.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const parsedShots = JSON.parse(jsonMatch[0]);
        setShots(parsedShots);
        toast({
          title: "Shot List Generated!",
          description: `Created ${parsedShots.length} shots for your scene.`,
        });
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error: any) {
      console.error("Shot list error:", error);
      toast({
        title: "Generation Failed",
        description: "Could not generate shot list. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const saveShotList = async () => {
    if (!user || !projectId || shots.length === 0) {
      toast({
        title: "Cannot Save",
        description: "Please generate a shot list first and ensure you're in a project.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("shot_lists").insert({
        project_id: projectId,
        user_id: user.id,
        scene_name: sceneName || "Untitled Scene",
        shots: shots as unknown as any,
      });

      if (error) throw error;

      toast({
        title: "Shot List Saved!",
        description: "Your shot list has been saved to the project.",
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

  const updateShot = (index: number, field: keyof Shot, value: string | number) => {
    setShots(shots.map((shot, i) => 
      i === index ? { ...shot, [field]: value } : shot
    ));
  };

  const deleteShot = (index: number) => {
    setShots(shots.filter((_, i) => i !== index).map((shot, i) => ({
      ...shot,
      number: i + 1,
    })));
  };

  const addShot = () => {
    setShots([...shots, {
      number: shots.length + 1,
      type: "Medium",
      angle: "Eye Level",
      movement: "Static",
      subject: "",
      description: "",
      duration: "3 seconds",
      notes: "",
    }]);
  };

  const exportShotList = () => {
    const content = shots.map(shot => 
      `Shot ${shot.number}: ${shot.type} | ${shot.angle} | ${shot.movement}
Subject: ${shot.subject}
Description: ${shot.description}
Duration: ${shot.duration}
Notes: ${shot.notes}
---`
    ).join("\n\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shot-list-${sceneName || "scene"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="card-cinematic">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-gold flex items-center justify-center">
            <Camera className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <span className="text-gradient-gold">Shot List Generator</span>
            <p className="text-xs text-muted-foreground font-normal mt-0.5">
              AI-powered cinematography planning
            </p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Input Section */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="sceneName">Scene Name</Label>
            <Input
              id="sceneName"
              placeholder="e.g., INT. COFFEE SHOP - DAY"
              value={sceneName}
              onChange={(e) => setSceneName(e.target.value)}
              className="bg-muted/50"
            />
          </div>
          
          <div>
            <Label htmlFor="sceneInput">Scene Description</Label>
            <Textarea
              id="sceneInput"
              placeholder="Describe what happens in your scene. Include characters, actions, emotions, and any visual elements you want to capture..."
              value={sceneInput}
              onChange={(e) => setSceneInput(e.target.value)}
              className="min-h-[100px] bg-muted/50"
            />
          </div>

          <Button
            onClick={generateShotList}
            disabled={generating || !sceneInput.trim()}
            className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Shot List...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Shot List
              </>
            )}
          </Button>
        </div>

        {/* Shot List Display */}
        <AnimatePresence>
          {shots.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Video className="w-4 h-4 text-primary" />
                  {shots.length} Shots
                </h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={addShot}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Shot
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportShotList}>
                    <Download className="w-4 h-4 mr-1" />
                    Export
                  </Button>
                  {projectId && (
                    <Button 
                      size="sm" 
                      onClick={saveShotList}
                      disabled={saving}
                      className="bg-gradient-gold text-primary-foreground"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-1" />
                      )}
                      Save
                    </Button>
                  )}
                </div>
              </div>

              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {shots.map((shot, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-muted/30 rounded-lg p-4 border border-border/50 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                            {shot.number}
                          </span>
                          <div className="flex gap-1 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              <Camera className="w-3 h-3 mr-1" />
                              {shot.type}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <Eye className="w-3 h-3 mr-1" />
                              {shot.angle}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <Move className="w-3 h-3 mr-1" />
                              {shot.movement}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              {shot.duration}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteShot(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Subject: </span>
                          <span>{shot.subject}</span>
                        </div>
                      </div>

                      <p className="text-sm">{shot.description}</p>

                      {shot.notes && (
                        <p className="text-xs text-muted-foreground italic">
                          📝 {shot.notes}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
