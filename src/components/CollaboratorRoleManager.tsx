import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Users, Trash2, Crown, Eye, Edit } from "lucide-react";

interface Collaborator {
  id: string;
  user_id: string;
  role: string;
  display_name?: string;
}

interface CollaboratorRoleManagerProps {
  projectId: string;
  isOwner: boolean;
}

export function CollaboratorRoleManager({ projectId, isOwner }: CollaboratorRoleManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCollaborators();
    }
  }, [open, projectId]);

  const fetchCollaborators = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('project_collaborators')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;

      // Enrich with display names
      const enriched = await Promise.all(
        (data || []).map(async (collab) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', collab.user_id)
            .maybeSingle();
          return { ...collab, display_name: profile?.display_name || 'Unknown User' };
        })
      );

      setCollaborators(enriched);
    } catch (error) {
      console.error('Error fetching collaborators:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (collaboratorId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('project_collaborators')
        .update({ role: newRole })
        .eq('id', collaboratorId);

      if (error) throw error;

      setCollaborators(prev =>
        prev.map(c => c.id === collaboratorId ? { ...c, role: newRole } : c)
      );

      toast({
        title: "Role updated",
        description: `Collaborator role changed to ${newRole}`,
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      });
    }
  };

  const removeCollaborator = async (collaboratorId: string, displayName: string) => {
    try {
      const { error } = await supabase
        .from('project_collaborators')
        .delete()
        .eq('id', collaboratorId);

      if (error) throw error;

      setCollaborators(prev => prev.filter(c => c.id !== collaboratorId));

      toast({
        title: "Collaborator removed",
        description: `${displayName} has been removed from the project`,
      });
    } catch (error) {
      console.error('Error removing collaborator:', error);
      toast({
        title: "Error",
        description: "Failed to remove collaborator",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  const getColor = (userId: string) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500',
      'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'
    ];
    const index = userId.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (!isOwner) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="w-4 h-4 mr-2" />
          Manage Team
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            Manage Collaborators
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {loading ? (
            <p className="text-muted-foreground text-center py-4">Loading...</p>
          ) : collaborators.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No collaborators yet</p>
              <p className="text-sm">Share your project code to invite team members</p>
            </div>
          ) : (
            <div className="space-y-3">
              {collaborators.map((collab) => (
                <div
                  key={collab.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-9 h-9">
                      <AvatarFallback className={`${getColor(collab.user_id)} text-white text-sm`}>
                        {getInitials(collab.display_name || 'UN')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{collab.display_name}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {collab.role === 'editor' ? (
                          <><Edit className="w-3 h-3" /> Can edit</>
                        ) : (
                          <><Eye className="w-3 h-3" /> View only</>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      value={collab.role}
                      onValueChange={(value) => updateRole(collab.id, value)}
                    >
                      <SelectTrigger className="w-24 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="editor">
                          <div className="flex items-center gap-2">
                            <Edit className="w-3 h-3" /> Editor
                          </div>
                        </SelectItem>
                        <SelectItem value="viewer">
                          <div className="flex items-center gap-2">
                            <Eye className="w-3 h-3" /> Viewer
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => removeCollaborator(collab.id, collab.display_name || 'User')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="w-4 h-4" />
              <span><strong>Viewer:</strong> Read-only access</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Edit className="w-4 h-4" />
              <span><strong>Editor:</strong> Can edit scripts and scenes</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}