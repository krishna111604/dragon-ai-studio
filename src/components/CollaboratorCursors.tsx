import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CursorPosition {
  x: number;
  y: number;
  selectionStart?: number;
  selectionEnd?: number;
}

interface Collaborator {
  user_id: string;
  display_name: string;
  cursor_position: CursorPosition | null;
  color: string;
}

interface CollaboratorCursorsProps {
  projectId: string;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

const CURSOR_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
];

export function CollaboratorCursors({ projectId, textareaRef }: CollaboratorCursorsProps) {
  const { user } = useAuth();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const lastPositionRef = useRef<CursorPosition | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!user || !projectId) return;

    const channel = supabase.channel(`cursors:${projectId}`);

    // Track presence
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const others: Collaborator[] = [];
        
        Object.entries(state).forEach(([key, presences]: [string, any[]]) => {
          presences.forEach((presence, index) => {
            if (presence.user_id !== user.id) {
              others.push({
                user_id: presence.user_id,
                display_name: presence.display_name || 'Unknown',
                cursor_position: presence.cursor_position,
                color: CURSOR_COLORS[others.length % CURSOR_COLORS.length],
              });
            }
          });
        });
        
        setCollaborators(others);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Get user's display name
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', user.id)
            .maybeSingle();

          await channel.track({
            user_id: user.id,
            display_name: profile?.display_name || user.email?.split('@')[0] || 'Unknown',
            cursor_position: null,
            online_at: new Date().toISOString(),
          });
        }
      });

    // Update cursor position on selection change
    const handleSelectionChange = () => {
      if (!textareaRef.current) return;

      const textarea = textareaRef.current;
      const newPosition: CursorPosition = {
        x: 0,
        y: 0,
        selectionStart: textarea.selectionStart,
        selectionEnd: textarea.selectionEnd,
      };

      // Debounce updates
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      updateTimeoutRef.current = setTimeout(async () => {
        if (
          !lastPositionRef.current ||
          lastPositionRef.current.selectionStart !== newPosition.selectionStart ||
          lastPositionRef.current.selectionEnd !== newPosition.selectionEnd
        ) {
          lastPositionRef.current = newPosition;
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', user.id)
            .maybeSingle();

          await channel.track({
            user_id: user.id,
            display_name: profile?.display_name || user.email?.split('@')[0] || 'Unknown',
            cursor_position: newPosition,
            online_at: new Date().toISOString(),
          });
        }
      }, 50);
    };

    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [user, projectId, textareaRef]);

  // Calculate cursor position in textarea
  const getCursorCoordinates = (position: number): { top: number; left: number } | null => {
    if (!textareaRef.current) return null;

    const textarea = textareaRef.current;
    const text = textarea.value.substring(0, position);
    const lines = text.split('\n');
    const lineNumber = lines.length - 1;
    const charOffset = lines[lines.length - 1].length;

    // Approximate line height and character width
    const computedStyle = window.getComputedStyle(textarea);
    const lineHeight = parseFloat(computedStyle.lineHeight) || 20;
    const charWidth = 8; // Approximate for monospace

    const textareaRect = textarea.getBoundingClientRect();
    const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
    const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;

    return {
      top: textareaRect.top + paddingTop + (lineNumber * lineHeight) - textarea.scrollTop,
      left: textareaRect.left + paddingLeft + (charOffset * charWidth),
    };
  };

  return (
    <>
      {collaborators.map((collab) => {
        if (!collab.cursor_position?.selectionStart) return null;
        
        const coords = getCursorCoordinates(collab.cursor_position.selectionStart);
        if (!coords) return null;

        return (
          <div
            key={collab.user_id}
            className="fixed pointer-events-none z-50 transition-all duration-75"
            style={{
              top: coords.top,
              left: coords.left,
            }}
          >
            {/* Cursor line */}
            <div
              className="w-0.5 h-5 animate-pulse"
              style={{ backgroundColor: collab.color }}
            />
            {/* Name tag */}
            <div
              className="absolute -top-5 left-0 px-1.5 py-0.5 rounded text-xs text-white whitespace-nowrap"
              style={{ backgroundColor: collab.color }}
            >
              {collab.display_name}
            </div>
          </div>
        );
      })}
    </>
  );
}
