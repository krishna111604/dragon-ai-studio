-- Create table for storing generated scene media (images and music)
CREATE TABLE public.scene_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'music')),
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  media_url TEXT NOT NULL,
  mood TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.scene_media ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view own scene media" 
ON public.scene_media 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own scene media" 
ON public.scene_media 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scene media" 
ON public.scene_media 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_scene_media_project ON public.scene_media(project_id);
CREATE INDEX idx_scene_media_user ON public.scene_media(user_id);