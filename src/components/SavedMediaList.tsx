import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Music, Image as ImageIcon, Trash2, Play, Pause, Loader2, FolderOpen, FileText, ChevronDown, ChevronUp
} from "lucide-react";

interface SceneMedia {
  id: string;
  project_id: string;
  media_type: string;
  title: string;
  prompt: string;
  media_url: string;
  mood?: string;
  created_at: string;
}

interface SavedMediaListProps {
  projectId: string;
  mediaType?: "image" | "music" | "all";
  refreshTrigger?: number;
}

export function SavedMediaList({ projectId, mediaType = "all", refreshTrigger }: SavedMediaListProps) {
  const { user } = useAuth();
  const [media, setMedia] = useState<SceneMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user && projectId) fetchMedia();
  }, [user, projectId, mediaType, refreshTrigger]);

  const fetchMedia = async () => {
    setLoading(true);
    let query = supabase
      .from("scene_media")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (mediaType !== "all") {
      query = query.eq("media_type", mediaType);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching media:", error);
    } else {
      setMedia(data || []);
    }
    setLoading(false);
  };

  const deleteMedia = async (id: string) => {
    const { error } = await supabase.from("scene_media").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    } else {
      setMedia(media.filter(m => m.id !== id));
      toast({ title: "Deleted", description: "Media removed" });
    }
  };

  const togglePlay = (item: SceneMedia) => {
    if (playingId === item.id && audioElement) {
      audioElement.pause();
      setPlayingId(null);
      setAudioElement(null);
    } else {
      if (audioElement) {
        audioElement.pause();
      }
      const audio = new Audio(item.media_url);
      audio.onended = () => {
        setPlayingId(null);
        setAudioElement(null);
      };
      audio.play();
      setPlayingId(item.id);
      setAudioElement(audio);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (media.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No saved {mediaType === "all" ? "media" : mediaType} yet</p>
      </div>
    );
  }

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isComposition = (item: SceneMedia) => item.media_type === "composition" || item.media_url.startsWith("composition:");

  const getCompositionContent = (item: SceneMedia) => {
    if (item.media_url.startsWith("composition:")) {
      return item.media_url.substring(12);
    }
    return item.media_url;
  };

  return (
    <div className="space-y-3">
      {media.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-muted/30 rounded-lg group hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3 p-3">
            {item.media_type === "image" ? (
              <div className="w-16 h-12 rounded overflow-hidden flex-shrink-0">
                <img src={item.media_url} alt={item.title} className="w-full h-full object-cover" />
              </div>
            ) : isComposition(item) ? (
              <div className="w-12 h-12 rounded bg-accent/20 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-accent" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Music className="w-5 h-5 text-primary" />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{item.title}</p>
              <p className="text-xs text-muted-foreground truncate">{item.prompt}</p>
              <p className="text-xs text-muted-foreground/60">
                {new Date(item.created_at).toLocaleDateString()}
                {isComposition(item) && <span className="ml-2 text-accent">(Composition Guide)</span>}
              </p>
            </div>

            <div className="flex items-center gap-1">
              {isComposition(item) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  className="h-8 w-8 p-0"
                >
                  {expandedId === item.id ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              )}
              {item.media_type === "music" && !isComposition(item) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePlay(item)}
                  className="h-8 w-8 p-0"
                >
                  {playingId === item.id ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteMedia(item.id)}
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Expanded composition content */}
          {isComposition(item) && expandedId === item.id && (
            <div className="px-3 pb-3">
              <div className="p-3 bg-background/50 rounded text-xs text-foreground/80 whitespace-pre-wrap max-h-[200px] overflow-auto">
                {getCompositionContent(item)}
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
