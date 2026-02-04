-- Daily Filmmaker Challenges table
CREATE TABLE public.daily_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_date DATE NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT DEFAULT 'medium',
  tips TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User challenge completions
CREATE TABLE public.challenge_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

-- Shot lists for projects
CREATE TABLE public.shot_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  scene_name TEXT NOT NULL,
  shots JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Mood boards for projects
CREATE TABLE public.mood_boards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  color_palette JSONB DEFAULT '[]',
  keywords TEXT[],
  mood_description TEXT,
  generated_images JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Call sheets for projects
CREATE TABLE public.call_sheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  shoot_date DATE NOT NULL,
  call_time TIME NOT NULL,
  location TEXT NOT NULL,
  scenes TEXT[],
  cast_members JSONB DEFAULT '[]',
  crew_members JSONB DEFAULT '[]',
  notes TEXT,
  weather_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Budget estimates for projects
CREATE TABLE public.project_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  total_estimate DECIMAL(12,2) DEFAULT 0,
  line_items JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Progress journal entries
CREATE TABLE public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  mood TEXT,
  milestones TEXT[],
  lessons_learned TEXT[],
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shot_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Daily challenges are public to read
CREATE POLICY "Anyone can view daily challenges" ON public.daily_challenges FOR SELECT USING (true);

-- Challenge completions policies
CREATE POLICY "Users can view their own completions" ON public.challenge_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own completions" ON public.challenge_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own completions" ON public.challenge_completions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own completions" ON public.challenge_completions FOR DELETE USING (auth.uid() = user_id);

-- Shot lists policies
CREATE POLICY "Users can view their own shot lists" ON public.shot_lists FOR SELECT USING (auth.uid() = user_id OR is_project_collaborator(project_id));
CREATE POLICY "Users can create shot lists" ON public.shot_lists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own shot lists" ON public.shot_lists FOR UPDATE USING (auth.uid() = user_id OR is_project_editor(project_id));
CREATE POLICY "Users can delete their own shot lists" ON public.shot_lists FOR DELETE USING (auth.uid() = user_id);

-- Mood boards policies
CREATE POLICY "Users can view their own mood boards" ON public.mood_boards FOR SELECT USING (auth.uid() = user_id OR is_project_collaborator(project_id));
CREATE POLICY "Users can create mood boards" ON public.mood_boards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own mood boards" ON public.mood_boards FOR UPDATE USING (auth.uid() = user_id OR is_project_editor(project_id));
CREATE POLICY "Users can delete their own mood boards" ON public.mood_boards FOR DELETE USING (auth.uid() = user_id);

-- Call sheets policies
CREATE POLICY "Users can view their own call sheets" ON public.call_sheets FOR SELECT USING (auth.uid() = user_id OR is_project_collaborator(project_id));
CREATE POLICY "Users can create call sheets" ON public.call_sheets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own call sheets" ON public.call_sheets FOR UPDATE USING (auth.uid() = user_id OR is_project_editor(project_id));
CREATE POLICY "Users can delete their own call sheets" ON public.call_sheets FOR DELETE USING (auth.uid() = user_id);

-- Project budgets policies
CREATE POLICY "Users can view their own budgets" ON public.project_budgets FOR SELECT USING (auth.uid() = user_id OR is_project_collaborator(project_id));
CREATE POLICY "Users can create budgets" ON public.project_budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own budgets" ON public.project_budgets FOR UPDATE USING (auth.uid() = user_id OR is_project_editor(project_id));
CREATE POLICY "Users can delete their own budgets" ON public.project_budgets FOR DELETE USING (auth.uid() = user_id);

-- Journal entries policies
CREATE POLICY "Users can view their own journal entries" ON public.journal_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own journal entries" ON public.journal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own journal entries" ON public.journal_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own journal entries" ON public.journal_entries FOR DELETE USING (auth.uid() = user_id);

-- Update triggers
CREATE TRIGGER update_shot_lists_updated_at BEFORE UPDATE ON public.shot_lists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_mood_boards_updated_at BEFORE UPDATE ON public.mood_boards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_call_sheets_updated_at BEFORE UPDATE ON public.call_sheets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_project_budgets_updated_at BEFORE UPDATE ON public.project_budgets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON public.journal_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some initial daily challenges
INSERT INTO public.daily_challenges (challenge_date, title, description, category, difficulty, tips) VALUES
(CURRENT_DATE, 'The One-Take Wonder', 'Film an entire scene in a single continuous take. No cuts allowed!', 'cinematography', 'hard', ARRAY['Plan your movements carefully', 'Rehearse multiple times before recording', 'Use natural lighting changes to your advantage']),
(CURRENT_DATE + 1, 'Silence Speaks', 'Tell a complete story without any dialogue - rely purely on visual storytelling.', 'storytelling', 'medium', ARRAY['Focus on facial expressions', 'Use props and environment', 'Let body language do the talking']),
(CURRENT_DATE + 2, 'Color Your World', 'Create a scene dominated by a single color that reflects the emotional tone.', 'production design', 'easy', ARRAY['Choose a color that matches your mood', 'Use lighting gels or colored props', 'Post-process to enhance the effect']),
(CURRENT_DATE + 3, 'The 180° Rule', 'Film a conversation scene while strictly following the 180-degree rule.', 'cinematography', 'medium', ARRAY['Draw your axis line first', 'Use over-the-shoulder shots', 'Maintain consistent eyelines']),
(CURRENT_DATE + 4, 'Found Sound', 'Create a scene using only diegetic sound - no score or soundtrack.', 'sound design', 'medium', ARRAY['Record ambient sounds on location', 'Use everyday objects as sound sources', 'Layer sounds for depth']),
(CURRENT_DATE + 5, 'The Hitchcock Zoom', 'Execute a dolly zoom (vertigo effect) in your scene.', 'cinematography', 'hard', ARRAY['Dolly in while zooming out (or vice versa)', 'Keep your subject the same size in frame', 'Works best with a clear background']),
(CURRENT_DATE + 6, 'Micro Story', 'Tell a complete three-act story in under 60 seconds.', 'storytelling', 'hard', ARRAY['Start in the middle of action', 'Every frame must count', 'End with a twist or revelation']);