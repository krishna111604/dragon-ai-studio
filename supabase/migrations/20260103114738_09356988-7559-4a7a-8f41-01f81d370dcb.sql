-- Create project_chat_messages table for real-time collaboration chat
CREATE TABLE public.project_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.project_chat_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chat messages
-- Users can view messages if they own the project or are a collaborator
CREATE POLICY "Users can view chat messages for their projects"
ON public.project_chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_chat_messages.project_id
    AND projects.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.project_collaborators
    WHERE project_collaborators.project_id = project_chat_messages.project_id
    AND project_collaborators.user_id = auth.uid()
  )
);

-- Users can send messages if they own the project or are a collaborator
CREATE POLICY "Users can send chat messages in their projects"
ON public.project_chat_messages
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_chat_messages.project_id
      AND projects.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.project_collaborators
      WHERE project_collaborators.project_id = project_chat_messages.project_id
      AND project_collaborators.user_id = auth.uid()
    )
  )
);

-- Users can delete their own messages
CREATE POLICY "Users can delete their own chat messages"
ON public.project_chat_messages
FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_chat_messages;

-- Update project_collaborators RLS policy for role updates by project owners
CREATE POLICY "Project owners can update collaborator roles"
ON public.project_collaborators
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_collaborators.project_id
    AND projects.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_collaborators.project_id
    AND projects.user_id = auth.uid()
  )
);