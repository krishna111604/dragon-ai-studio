-- Add unique project code to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS project_code TEXT UNIQUE;

-- Generate unique 5-digit codes for existing projects
UPDATE public.projects 
SET project_code = LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0')
WHERE project_code IS NULL;

-- Create function to generate unique 5-digit project code
CREATE OR REPLACE FUNCTION public.generate_project_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
    SELECT EXISTS(SELECT 1 FROM public.projects WHERE project_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  NEW.project_code := new_code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-generate project code
DROP TRIGGER IF EXISTS generate_project_code_trigger ON public.projects;
CREATE TRIGGER generate_project_code_trigger
BEFORE INSERT ON public.projects
FOR EACH ROW
WHEN (NEW.project_code IS NULL)
EXECUTE FUNCTION public.generate_project_code();