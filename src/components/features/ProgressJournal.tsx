import { useState, useEffect } from "react";
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
  BookOpen,
  Sparkles,
  Loader2,
  Plus,
  Trash2,
  Save,
  Smile,
  Heart,
  Star,
  Calendar,
  Trophy,
  Lightbulb,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood: string | null;
  milestones: string[] | null;
  lessons_learned: string[] | null;
  entry_date: string;
  project_id: string | null;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
}

const moodOptions = [
  { value: "inspired", label: "🔥 Inspired", icon: Sparkles },
  { value: "productive", label: "💪 Productive", icon: Star },
  { value: "creative", label: "🎨 Creative", icon: Lightbulb },
  { value: "challenged", label: "🤔 Challenged", icon: Heart },
  { value: "frustrated", label: "😤 Frustrated", icon: Smile },
  { value: "accomplished", label: "🏆 Accomplished", icon: Trophy },
];

export function ProgressJournal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [milestone, setMilestone] = useState("");
  const [milestones, setMilestones] = useState<string[]>([]);
  const [lesson, setLesson] = useState("");
  const [lessons, setLessons] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetchEntries();
      fetchProjects();
    }
  }, [user]);

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user!.id)
        .order("entry_date", { ascending: false })
        .limit(20);

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error("Error fetching entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    const { data } = await supabase
      .from("projects")
      .select("id, name")
      .eq("user_id", user!.id)
      .order("updated_at", { ascending: false });
    setProjects(data || []);
  };

  const saveEntry = async () => {
    if (!user || !title.trim() || !content.trim()) {
      toast({
        title: "Missing Information",
        description: "Please add a title and content for your journal entry.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase.from("journal_entries").insert({
        user_id: user.id,
        title: title.trim(),
        content: content.trim(),
        mood: mood || null,
        project_id: projectId || null,
        milestones: milestones.length > 0 ? milestones : null,
        lessons_learned: lessons.length > 0 ? lessons : null,
        entry_date: new Date().toISOString().split("T")[0],
      }).select().single();

      if (error) throw error;

      setEntries([data, ...entries]);
      resetForm();
      setShowForm(false);
      
      toast({
        title: "📝 Entry Saved!",
        description: "Your filmmaking journey has been documented.",
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

  const deleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from("journal_entries")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setEntries(entries.filter((e) => e.id !== id));
      toast({ title: "Entry deleted" });
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setMood("");
    setProjectId("");
    setMilestones([]);
    setLessons([]);
    setMilestone("");
    setLesson("");
  };

  const addMilestone = () => {
    if (milestone.trim()) {
      setMilestones([...milestones, milestone.trim()]);
      setMilestone("");
    }
  };

  const addLesson = () => {
    if (lesson.trim()) {
      setLessons([...lessons, lesson.trim()]);
      setLesson("");
    }
  };

  const getMoodEmoji = (moodValue: string | null) => {
    return moodOptions.find((m) => m.value === moodValue)?.label || moodValue;
  };

  if (loading) {
    return (
      <Card className="card-cinematic">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-cinematic">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-gold flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-gradient-gold">Progress Journal</span>
              <p className="text-xs text-muted-foreground font-normal mt-0.5">
                Document your filmmaking journey
              </p>
            </div>
          </CardTitle>
          
          <Button
            onClick={() => setShowForm(!showForm)}
            variant={showForm ? "outline" : "default"}
            className={showForm ? "" : "bg-gradient-gold text-primary-foreground"}
          >
            {showForm ? "Cancel" : (
              <>
                <Plus className="w-4 h-4 mr-1" />
                New Entry
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* New Entry Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 bg-muted/30 rounded-lg p-4 border border-border/50"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Entry Title</Label>
                  <Input
                    id="title"
                    placeholder="Today's progress..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-muted/50"
                  />
                </div>
                
                <div>
                  <Label>Mood</Label>
                  <Select value={mood} onValueChange={setMood}>
                    <SelectTrigger className="bg-muted/50">
                      <SelectValue placeholder="How are you feeling?" />
                    </SelectTrigger>
                    <SelectContent>
                      {moodOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Link to Project (optional)</Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No project</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="content">Journal Entry</Label>
                <Textarea
                  id="content"
                  placeholder="What did you work on today? What challenges did you face? What are you proud of?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[120px] bg-muted/50"
                />
              </div>

              {/* Milestones */}
              <div>
                <Label>Milestones Achieved</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a milestone..."
                    value={milestone}
                    onChange={(e) => setMilestone(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addMilestone()}
                    className="bg-muted/50"
                  />
                  <Button type="button" onClick={addMilestone} variant="outline" size="icon">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {milestones.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {milestones.map((m, i) => (
                      <Badge key={i} variant="outline" className="flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        {m}
                        <button onClick={() => setMilestones(milestones.filter((_, idx) => idx !== i))}>
                          <Trash2 className="w-3 h-3 ml-1" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Lessons Learned */}
              <div>
                <Label>Lessons Learned</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="What did you learn?"
                    value={lesson}
                    onChange={(e) => setLesson(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addLesson()}
                    className="bg-muted/50"
                  />
                  <Button type="button" onClick={addLesson} variant="outline" size="icon">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {lessons.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {lessons.map((l, i) => (
                      <Badge key={i} variant="outline" className="flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" />
                        {l}
                        <button onClick={() => setLessons(lessons.filter((_, idx) => idx !== i))}>
                          <Trash2 className="w-3 h-3 ml-1" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={saveEntry}
                disabled={saving || !title.trim() || !content.trim()}
                className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Entry
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Entries List */}
        {entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No journal entries yet.</p>
            <p className="text-sm">Start documenting your filmmaking journey!</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {entries.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-muted/30 rounded-lg p-4 border border-border/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold">{entry.title}</h4>
                        {entry.mood && (
                          <Badge variant="outline" className="text-xs">
                            {getMoodEmoji(entry.mood)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(entry.entry_date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setExpandedEntry(
                          expandedEntry === entry.id ? null : entry.id
                        )}
                      >
                        {expandedEntry === entry.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteEntry(entry.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedEntry === entry.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 space-y-3"
                      >
                        <p className="text-sm whitespace-pre-wrap">{entry.content}</p>

                        {entry.milestones && entry.milestones.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Milestones</p>
                            <div className="flex flex-wrap gap-1">
                              {entry.milestones.map((m, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  <Trophy className="w-3 h-3 mr-1" />
                                  {m}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {entry.lessons_learned && entry.lessons_learned.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Lessons</p>
                            <div className="flex flex-wrap gap-1">
                              {entry.lessons_learned.map((l, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  <Lightbulb className="w-3 h-3 mr-1" />
                                  {l}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
