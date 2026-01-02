-- Create collaboration requests table
CREATE TABLE IF NOT EXISTS public.collaboration_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL,
  owner_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, requester_id)
);

-- Create project collaborators table
CREATE TABLE IF NOT EXISTS public.project_collaborators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('viewer', 'editor')),
  cursor_position JSONB,
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Enable RLS on collaboration_requests
ALTER TABLE public.collaboration_requests ENABLE ROW LEVEL SECURITY;

-- Policies for collaboration_requests
CREATE POLICY "Users can view requests they made or own"
ON public.collaboration_requests FOR SELECT
USING (auth.uid() = requester_id OR auth.uid() = owner_id);

CREATE POLICY "Users can create join requests"
ON public.collaboration_requests FOR INSERT
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Project owners can update requests"
ON public.collaboration_requests FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own requests"
ON public.collaboration_requests FOR DELETE
USING (auth.uid() = requester_id OR auth.uid() = owner_id);

-- Enable RLS on project_collaborators
ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;

-- Policies for project_collaborators
CREATE POLICY "Users can view collaborators of their projects"
ON public.project_collaborators FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.project_collaborators pc WHERE pc.project_id = project_collaborators.project_id AND pc.user_id = auth.uid())
);

CREATE POLICY "Project owners can add collaborators"
ON public.project_collaborators FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid())
);

CREATE POLICY "Users can update their own cursor position"
ON public.project_collaborators FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Project owners can delete collaborators"
ON public.project_collaborators FOR DELETE
USING (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid())
);

-- Update projects RLS to allow collaborators to view
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
CREATE POLICY "Users can view own or collaborated projects"
ON public.projects FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM public.project_collaborators WHERE project_id = id AND user_id = auth.uid())
);

-- Update projects RLS to allow collaborators to update script
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
CREATE POLICY "Users can update own or collaborated projects"
ON public.projects FOR UPDATE
USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM public.project_collaborators WHERE project_id = id AND user_id = auth.uid())
);

-- Enable realtime for collaboration tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.collaboration_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_collaborators;