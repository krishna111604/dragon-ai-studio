import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface UseRealtimeScriptOptions {
  projectId: string;
  onScriptChange: (content: string) => void;
  onSceneChange: (description: string) => void;
}

export function useRealtimeScript({ projectId, onScriptChange, onSceneChange }: UseRealtimeScriptOptions) {
  const { user } = useAuth();
  const lastLocalUpdateRef = useRef<number>(0);
  const isLocalUpdateRef = useRef(false);

  useEffect(() => {
    if (!projectId || !user) return;

    const channel = supabase
      .channel(`project-sync:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${projectId}`,
        },
        (payload) => {
          // Ignore updates we just made
          if (Date.now() - lastLocalUpdateRef.current < 500) {
            return;
          }

          const newData = payload.new as { script_content?: string; scene_description?: string };
          
          if (newData.script_content !== undefined) {
            onScriptChange(newData.script_content || '');
          }
          if (newData.scene_description !== undefined) {
            onSceneChange(newData.scene_description || '');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, user, onScriptChange, onSceneChange]);

  const updateScript = useCallback(async (content: string) => {
    if (!projectId) return;
    
    lastLocalUpdateRef.current = Date.now();
    isLocalUpdateRef.current = true;
    
    await supabase
      .from('projects')
      .update({ script_content: content, updated_at: new Date().toISOString() })
      .eq('id', projectId);
  }, [projectId]);

  const updateScene = useCallback(async (description: string) => {
    if (!projectId) return;
    
    lastLocalUpdateRef.current = Date.now();
    isLocalUpdateRef.current = true;
    
    await supabase
      .from('projects')
      .update({ scene_description: description, updated_at: new Date().toISOString() })
      .eq('id', projectId);
  }, [projectId]);

  return { updateScript, updateScene };
}
