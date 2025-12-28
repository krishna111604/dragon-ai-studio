-- Version History table to track changes to scripts and scenes
CREATE TABLE public.project_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  version_number INTEGER NOT NULL,
  script_content TEXT,
  scene_description TEXT,
  change_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_versions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view versions of their projects"
ON public.project_versions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_versions.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create versions for their projects"
ON public.project_versions
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_versions.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete versions of their projects"
ON public.project_versions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_versions.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- Project Characters table for AI character consistency
CREATE TABLE public.project_characters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  appearance_details TEXT,
  reference_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_characters ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view characters of their projects"
ON public.project_characters
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_characters.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create characters for their projects"
ON public.project_characters
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_characters.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update characters of their projects"
ON public.project_characters
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_characters.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete characters of their projects"
ON public.project_characters
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_characters.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- Add updated_at trigger
CREATE TRIGGER update_project_characters_updated_at
BEFORE UPDATE ON public.project_characters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for collaboration
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;

-- Create index for better performance
CREATE INDEX idx_project_versions_project_id ON public.project_versions(project_id);
CREATE INDEX idx_project_characters_project_id ON public.project_characters(project_id);