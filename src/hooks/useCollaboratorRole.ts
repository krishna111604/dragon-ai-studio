import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface UseCollaboratorRoleOptions {
  projectId: string;
}

export function useCollaboratorRole({ projectId }: UseCollaboratorRoleOptions) {
  const { user } = useAuth();
  const [role, setRole] = useState<'owner' | 'editor' | 'viewer' | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !projectId) {
      setLoading(false);
      return;
    }

    fetchRole();
  }, [user, projectId]);

  const fetchRole = async () => {
    if (!user) return;

    try {
      // Check if user is the owner
      const { data: project } = await supabase
        .from('projects')
        .select('user_id')
        .eq('id', projectId)
        .maybeSingle();

      if (project?.user_id === user.id) {
        setRole('owner');
        setIsOwner(true);
        setCanEdit(true);
        setLoading(false);
        return;
      }

      // Check collaborator role
      const { data: collab } = await supabase
        .from('project_collaborators')
        .select('role')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (collab) {
        const collabRole = collab.role as 'editor' | 'viewer';
        setRole(collabRole);
        setIsOwner(false);
        setCanEdit(collabRole === 'editor');
      } else {
        setRole(null);
        setIsOwner(false);
        setCanEdit(false);
      }
    } catch (error) {
      console.error('Error fetching role:', error);
    } finally {
      setLoading(false);
    }
  };

  return { role, isOwner, canEdit, loading, refetch: fetchRole };
}