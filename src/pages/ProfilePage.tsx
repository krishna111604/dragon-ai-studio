import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, Save, Loader2, Film } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const GENRES = ["Drama", "Comedy", "Action", "Horror", "Thriller", "Sci-Fi", "Romance", "Documentary", "Animation", "Fantasy"];
const STYLES = ["Cinematic", "Minimalist", "Noir", "Experimental", "Classical", "Modern", "Indie", "Blockbuster"];
const EXPERIENCE_LEVELS = [
  { value: "beginner", label: "Beginner - Just starting out" },
  { value: "intermediate", label: "Intermediate - Some experience" },
  { value: "advanced", label: "Advanced - Professional" },
  { value: "expert", label: "Expert - Industry veteran" },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [preferredGenres, setPreferredGenres] = useState<string[]>([]);
  const [preferredStyles, setPreferredStyles] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setDisplayName(data.display_name || "");
      setExperienceLevel(data.experience_level || "");
      setPreferredGenres(data.preferred_genres || []);
      setPreferredStyles(data.preferred_styles || []);
    }
    setLoading(false);
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        experience_level: experienceLevel,
        preferred_genres: preferredGenres,
        preferred_styles: preferredStyles,
      })
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Error", description: "Failed to save profile", variant: "destructive" });
    } else {
      toast({ title: "Saved!", description: "Profile updated successfully" });
    }
    setSaving(false);
  };

  const toggleGenre = (genre: string) => {
    setPreferredGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const toggleStyle = (style: string) => {
    setPreferredStyles(prev => 
      prev.includes(style) 
        ? prev.filter(s => s !== style)
        : [...prev, style]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <span className="font-semibold">Profile Settings</span>
            </div>
          </div>
          <Button onClick={saveProfile} disabled={saving} className="bg-gradient-gold text-primary-foreground">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Avatar & Name */}
          <div className="card-cinematic rounded-xl p-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-gradient-gold flex items-center justify-center shadow-gold">
                <Film className="w-10 h-10 text-primary-foreground" />
              </div>
              <div className="flex-1 space-y-2">
                <Label>Display Name</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your name"
                  className="bg-muted/50"
                />
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Experience Level */}
          <div className="card-cinematic rounded-xl p-6">
            <h3 className="font-semibold mb-4">Experience Level</h3>
            <Select value={experienceLevel} onValueChange={setExperienceLevel}>
              <SelectTrigger className="bg-muted/50">
                <SelectValue placeholder="Select your experience level" />
              </SelectTrigger>
              <SelectContent>
                {EXPERIENCE_LEVELS.map(level => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              This helps Dragon AI tailor suggestions to your skill level
            </p>
          </div>

          {/* Preferred Genres */}
          <div className="card-cinematic rounded-xl p-6">
            <h3 className="font-semibold mb-4">Preferred Genres</h3>
            <div className="flex flex-wrap gap-2">
              {GENRES.map(genre => (
                <Badge
                  key={genre}
                  variant={preferredGenres.includes(genre) ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${
                    preferredGenres.includes(genre) 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:border-primary"
                  }`}
                  onClick={() => toggleGenre(genre)}
                >
                  {genre}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Select the genres you work with most often
            </p>
          </div>

          {/* Preferred Styles */}
          <div className="card-cinematic rounded-xl p-6">
            <h3 className="font-semibold mb-4">Visual Styles</h3>
            <div className="flex flex-wrap gap-2">
              {STYLES.map(style => (
                <Badge
                  key={style}
                  variant={preferredStyles.includes(style) ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${
                    preferredStyles.includes(style) 
                      ? "bg-accent text-accent-foreground" 
                      : "hover:border-accent"
                  }`}
                  onClick={() => toggleStyle(style)}
                >
                  {style}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Your preferred filmmaking styles for personalized recommendations
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
