import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { 
  Layers, Trash2, GripVertical, Loader2, Image as ImageIcon 
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

interface StoryboardViewProps {
  projectId: string;
  refreshTrigger?: number;
}

export function StoryboardView({ projectId, refreshTrigger }: StoryboardViewProps) {
  const { user } = useAuth();
  const [media, setMedia] = useState<SceneMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user && projectId) fetchMedia();
  }, [user, projectId, refreshTrigger]);

  const fetchMedia = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("scene_media")
      .select("*")
      .eq("project_id", projectId)
      .eq("media_type", "image")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching storyboard:", error);
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
      toast({ title: "Deleted", description: "Scene removed from storyboard" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (media.length === 0) {
    return (
      <div className="card-cinematic rounded-xl p-8 text-center">
        <Layers className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
        <h3 className="font-semibold mb-2">No Storyboard Yet</h3>
        <p className="text-sm text-muted-foreground">
          Generate and save scene images to build your visual timeline
        </p>
      </div>
    );
  }

  return (
    <div className="card-cinematic rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Storyboard Timeline</h3>
        <span className="text-xs text-muted-foreground ml-auto">{media.length} scenes</span>
      </div>
      
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {media.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="relative flex-shrink-0 w-48 group"
            >
              {/* Scene number badge */}
              <div className="absolute -top-2 -left-2 z-10 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-lg">
                {index + 1}
              </div>
              
              {/* Delete button */}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteMedia(item.id)}
                className="absolute -top-2 -right-2 z-10 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
              >
                <Trash2 className="w-3 h-3" />
              </Button>

              {/* Image */}
              <div className="aspect-video rounded-lg overflow-hidden bg-muted mb-2 ring-2 ring-border/50 group-hover:ring-primary/50 transition-all">
                <img 
                  src={item.media_url} 
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Title and prompt */}
              <p className="text-xs font-medium truncate">{item.title}</p>
              <p className="text-xs text-muted-foreground truncate">{item.prompt}</p>
              
              {/* Connector line */}
              {index < media.length - 1 && (
                <div className="absolute top-1/2 -right-4 w-4 h-0.5 bg-border" />
              )}
            </motion.div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
