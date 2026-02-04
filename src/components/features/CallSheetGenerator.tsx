import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ClipboardList,
  Sparkles,
  Loader2,
  Save,
  Plus,
  Trash2,
  Download,
  Clock,
  MapPin,
  Users,
  Calendar,
} from "lucide-react";

interface CastMember {
  name: string;
  role: string;
  callTime: string;
}

interface CrewMember {
  name: string;
  position: string;
  callTime: string;
}

interface CallSheetGeneratorProps {
  projectId?: string;
  projectName?: string;
}

export function CallSheetGenerator({ projectId, projectName }: CallSheetGeneratorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [shootDate, setShootDate] = useState("");
  const [callTime, setCallTime] = useState("06:00");
  const [location, setLocation] = useState("");
  const [scenes, setScenes] = useState<string[]>([]);
  const [sceneInput, setSceneInput] = useState("");
  const [cast, setCast] = useState<CastMember[]>([]);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [notes, setNotes] = useState("");
  const [weatherNotes, setWeatherNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Temp form state
  const [castName, setCastName] = useState("");
  const [castRole, setCastRole] = useState("");
  const [castCallTime, setCastCallTime] = useState("06:00");
  const [crewName, setCrewName] = useState("");
  const [crewPosition, setCrewPosition] = useState("");
  const [crewCallTime, setCrewCallTime] = useState("05:30");

  const addScene = () => {
    if (sceneInput.trim()) {
      setScenes([...scenes, sceneInput.trim()]);
      setSceneInput("");
    }
  };

  const addCastMember = () => {
    if (castName.trim() && castRole.trim()) {
      setCast([...cast, { name: castName.trim(), role: castRole.trim(), callTime: castCallTime }]);
      setCastName("");
      setCastRole("");
    }
  };

  const addCrewMember = () => {
    if (crewName.trim() && crewPosition.trim()) {
      setCrew([...crew, { name: crewName.trim(), position: crewPosition.trim(), callTime: crewCallTime }]);
      setCrewName("");
      setCrewPosition("");
    }
  };

  const generateWeatherSuggestion = async () => {
    if (!location || !shootDate) {
      toast({
        title: "Missing Info",
        description: "Please enter location and date first.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("dragon-ai", {
        body: { 
          feature: "weather_notes", 
          userPrompt: `For a film shoot at "${location}" on ${shootDate}, provide brief weather considerations and suggestions for the crew. Include lighting conditions, potential weather challenges, and preparation tips. Keep it concise (3-4 sentences).`
        },
      });

      if (error) throw error;

      const content = data.choices?.[0]?.message?.content || "";
      setWeatherNotes(content);
    } catch (error) {
      console.error("Weather suggestion error:", error);
    } finally {
      setGenerating(false);
    }
  };

  const saveCallSheet = async () => {
    if (!user || !projectId || !shootDate || !location) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least the date and location.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("call_sheets").insert({
        project_id: projectId,
        user_id: user.id,
        shoot_date: shootDate,
        call_time: callTime,
        location: location,
        scenes: scenes,
        cast_members: cast as unknown as any,
        crew_members: crew as unknown as any,
        notes: notes,
        weather_notes: weatherNotes,
      });

      if (error) throw error;

      toast({
        title: "📋 Call Sheet Saved!",
        description: "Your call sheet is ready for the shoot.",
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

  const exportCallSheet = () => {
    const content = `
CALL SHEET
${projectName ? `Production: ${projectName}` : ""}
Date: ${shootDate}
General Call Time: ${callTime}
Location: ${location}

SCENES TO SHOOT:
${scenes.map((s, i) => `${i + 1}. ${s}`).join("\n")}

CAST:
${cast.map((c) => `${c.name} - ${c.role} - Call: ${c.callTime}`).join("\n")}

CREW:
${crew.map((c) => `${c.name} - ${c.position} - Call: ${c.callTime}`).join("\n")}

NOTES:
${notes}

WEATHER:
${weatherNotes}
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `call-sheet-${shootDate || "draft"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="card-cinematic">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-gold flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <span className="text-gradient-gold">Call Sheet Generator</span>
            <p className="text-xs text-muted-foreground font-normal mt-0.5">
              Professional production planning
            </p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Shoot Date
                </Label>
                <Input
                  type="date"
                  value={shootDate}
                  onChange={(e) => setShootDate(e.target.value)}
                  className="bg-muted/50"
                />
              </div>
              <div>
                <Label className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  General Call Time
                </Label>
                <Input
                  type="time"
                  value={callTime}
                  onChange={(e) => setCallTime(e.target.value)}
                  className="bg-muted/50"
                />
              </div>
            </div>

            <div>
              <Label className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Location
              </Label>
              <Input
                placeholder="e.g., Downtown LA - 5th Street & Main"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="bg-muted/50"
              />
            </div>

            {/* Scenes */}
            <div>
              <Label>Scenes to Shoot</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Scene 12 - INT. OFFICE"
                  value={sceneInput}
                  onChange={(e) => setSceneInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addScene()}
                  className="bg-muted/50"
                />
                <Button type="button" onClick={addScene} variant="outline" size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {scenes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {scenes.map((s, i) => (
                    <Badge key={i} variant="secondary" className="flex items-center gap-1">
                      {s}
                      <button onClick={() => setScenes(scenes.filter((_, idx) => idx !== i))}>
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Cast */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                Cast
              </Label>
              <div className="grid grid-cols-4 gap-2">
                <Input
                  placeholder="Name"
                  value={castName}
                  onChange={(e) => setCastName(e.target.value)}
                  className="bg-muted/50"
                />
                <Input
                  placeholder="Role"
                  value={castRole}
                  onChange={(e) => setCastRole(e.target.value)}
                  className="bg-muted/50"
                />
                <Input
                  type="time"
                  value={castCallTime}
                  onChange={(e) => setCastCallTime(e.target.value)}
                  className="bg-muted/50"
                />
                <Button type="button" onClick={addCastMember} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {cast.length > 0 && (
                <div className="space-y-1 mt-2">
                  {cast.map((c, i) => (
                    <div key={i} className="flex items-center justify-between bg-muted/30 rounded px-3 py-2 text-sm">
                      <span><strong>{c.name}</strong> as {c.role}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{c.callTime}</Badge>
                        <button onClick={() => setCast(cast.filter((_, idx) => idx !== i))}>
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Crew */}
            <div className="space-y-2">
              <Label>Crew</Label>
              <div className="grid grid-cols-4 gap-2">
                <Input
                  placeholder="Name"
                  value={crewName}
                  onChange={(e) => setCrewName(e.target.value)}
                  className="bg-muted/50"
                />
                <Input
                  placeholder="Position"
                  value={crewPosition}
                  onChange={(e) => setCrewPosition(e.target.value)}
                  className="bg-muted/50"
                />
                <Input
                  type="time"
                  value={crewCallTime}
                  onChange={(e) => setCrewCallTime(e.target.value)}
                  className="bg-muted/50"
                />
                <Button type="button" onClick={addCrewMember} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {crew.length > 0 && (
                <div className="space-y-1 mt-2">
                  {crew.map((c, i) => (
                    <div key={i} className="flex items-center justify-between bg-muted/30 rounded px-3 py-2 text-sm">
                      <span><strong>{c.name}</strong> - {c.position}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{c.callTime}</Badge>
                        <button onClick={() => setCrew(crew.filter((_, idx) => idx !== i))}>
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Weather */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Weather Notes</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={generateWeatherSuggestion}
                  disabled={generating}
                >
                  {generating ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  <span className="ml-1">AI Suggest</span>
                </Button>
              </div>
              <Textarea
                placeholder="Weather conditions and crew preparation notes..."
                value={weatherNotes}
                onChange={(e) => setWeatherNotes(e.target.value)}
                className="bg-muted/50 min-h-[60px]"
              />
            </div>

            {/* General Notes */}
            <div>
              <Label>Additional Notes</Label>
              <Textarea
                placeholder="Special instructions, parking info, contact numbers..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-muted/50 min-h-[60px]"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={exportCallSheet}
                variant="outline"
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              {projectId && (
                <Button
                  onClick={saveCallSheet}
                  disabled={saving || !shootDate || !location}
                  className="flex-1 bg-gradient-gold text-primary-foreground hover:opacity-90"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
