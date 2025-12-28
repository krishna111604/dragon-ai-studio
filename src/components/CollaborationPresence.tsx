import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Users } from "lucide-react";

interface Collaborator {
  id: string;
  email: string;
  online_at: string;
  cursor?: { x: number; y: number };
}

interface CollaborationPresenceProps {
  projectId: string;
}

export function CollaborationPresence({ projectId }: CollaborationPresenceProps) {
  const { user } = useAuth();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

  useEffect(() => {
    if (!user || !projectId) return;

    const channel = supabase.channel(`project-${projectId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: Collaborator[] = [];
        
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: Collaborator) => {
            if (presence.id !== user.id) {
              users.push(presence);
            }
          });
        });
        
        setCollaborators(users);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('User left:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            id: user.id,
            email: user.email || 'Unknown',
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, projectId]);

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const getColor = (email: string) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 
      'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'
    ];
    const index = email.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (collaborators.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Users className="w-4 h-4" />
        <span>{collaborators.length} online</span>
      </div>
      <div className="flex -space-x-2">
        {collaborators.slice(0, 5).map((collab) => (
          <Tooltip key={collab.id}>
            <TooltipTrigger asChild>
              <Avatar className="w-7 h-7 border-2 border-background cursor-pointer">
                <AvatarFallback className={`${getColor(collab.email)} text-white text-xs`}>
                  {getInitials(collab.email)}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>{collab.email}</p>
              <p className="text-xs text-muted-foreground">Currently viewing</p>
            </TooltipContent>
          </Tooltip>
        ))}
        {collaborators.length > 5 && (
          <Avatar className="w-7 h-7 border-2 border-background">
            <AvatarFallback className="bg-muted text-xs">
              +{collaborators.length - 5}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
}