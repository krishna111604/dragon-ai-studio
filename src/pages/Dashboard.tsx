import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Film, Plus, FolderOpen, Trash2, Sparkles, 
  Clapperboard, Brain, Music, BookOpen, TrendingUp, Search
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AppSidebar } from "@/components/AppSidebar";
import { RecentInsightsWidget } from "@/components/RecentInsightsWidget";
import { InspirationFeed } from "@/components/InspirationFeed";
import { DragonAnimation } from "@/components/DragonAnimation";

interface Project {
  id: string;
  name: string;
  genre: string | null;
  target_audience: string | null;
  created_at: string;
  updated_at: string;
}

const aiFeatures = [
  { icon: Sparkles, name: "Script Analyzer", desc: "Deep story analysis", color: "text-primary" },
  { icon: Clapperboard, name: "Director's Lens", desc: "Cinematic suggestions", color: "text-accent" },
  { icon: Brain, name: "Dream Weaver", desc: "Creative brainstorming", color: "text-info" },
  { icon: Music, name: "Emotional Arc", desc: "Music & sound", color: "text-success" },
  { icon: BookOpen, name: "Film Historian", desc: "References & inspirations", color: "text-warning" },
  { icon: TrendingUp, name: "The Oracle", desc: "Predictive analytics", color: "text-primary" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", genre: "", targetAudience: "" });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("updated_at", { ascending: false });
    
    if (error) {
      toast({ title: "Error", description: "Failed to load projects", variant: "destructive" });
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  };

  const createProject = async () => {
    if (!newProject.name.trim()) {
      toast({ title: "Error", description: "Project name is required", variant: "destructive" });
      return;
    }

    const { data, error } = await supabase.from("projects").insert({
      user_id: user?.id,
      name: newProject.name,
      genre: newProject.genre || null,
      target_audience: newProject.targetAudience || null,
    }).select().single();

    if (error) {
      toast({ title: "Error", description: "Failed to create project", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Project created!" });
      setIsCreateOpen(false);
      setNewProject({ name: "", genre: "", targetAudience: "" });
      navigate(`/project/${data.id}`);
    }
  };

  const deleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    } else {
      setProjects(projects.filter(p => p.id !== id));
      toast({ title: "Deleted", description: "Project removed" });
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex relative">
      <DragonAnimation />
      <AppSidebar />

      <main className="flex-1 p-8 relative z-10">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-display text-gradient-gold mb-2">Welcome Back, Director</h1>
          <p className="text-muted-foreground">Your filmmaking AI companion awaits</p>
        </motion.div>

        {/* AI Features Grid */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-10">
          <h2 className="text-lg font-semibold mb-4">AI Tools</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {aiFeatures.map((feature, i) => (
              <div key={i} className="card-cinematic rounded-lg p-4 text-center hover-lift cursor-pointer">
                <feature.icon className={`w-8 h-8 mx-auto mb-2 ${feature.color}`} />
                <p className="text-sm font-medium">{feature.name}</p>
                <p className="text-xs text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Insights */}
        <RecentInsightsWidget />

        {/* Inspiration Feed */}
        <InspirationFeed />

        {/* Projects */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Your Projects</h2>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Search..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-48 bg-muted/50"
                />
              </div>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-gold text-primary-foreground shadow-gold">
                    <Plus className="w-4 h-4 mr-2" /> New Project
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>Project Name *</Label>
                      <Input 
                        value={newProject.name}
                        onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                        placeholder="My Film Project"
                        className="bg-muted/50"
                      />
                    </div>
                    <div>
                      <Label>Genre</Label>
                      <Input 
                        value={newProject.genre}
                        onChange={(e) => setNewProject({...newProject, genre: e.target.value})}
                        placeholder="Drama, Thriller, Comedy..."
                        className="bg-muted/50"
                      />
                    </div>
                    <div>
                      <Label>Target Audience</Label>
                      <Input 
                        value={newProject.targetAudience}
                        onChange={(e) => setNewProject({...newProject, targetAudience: e.target.value})}
                        placeholder="Adults 18-35, Film enthusiasts..."
                        className="bg-muted/50"
                      />
                    </div>
                    <Button onClick={createProject} className="w-full bg-gradient-gold text-primary-foreground">
                      Create Project
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading projects...</div>
          ) : filteredProjects.length === 0 ? (
            <div className="card-cinematic rounded-xl p-12 text-center">
              <FolderOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-4">Create your first film project to get started</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((project) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="card-cinematic rounded-xl p-6 cursor-pointer hover-lift group"
                  onClick={() => navigate(`/project/${project.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Film className="w-6 h-6 text-primary" />
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => deleteProject(project.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{project.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {project.genre || "No genre"} • {project.target_audience || "No audience set"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-3">
                    Updated {new Date(project.updated_at).toLocaleDateString()}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
