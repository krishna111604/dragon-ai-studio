-- Fix RLS recursion on public.projects and enforce editor-only updates

-- 1) Make project code generator bypass RLS so uniqueness check is global
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.generate_project_code() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_project_code() TO anon, authenticated;

-- 2) Helper functions to avoid policy recursion
CREATE OR REPLACE FUNCTION public.is_project_collaborator(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_collaborators pc
    WHERE pc.project_id = p_project_id
      AND pc.user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_project_collaborator(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_project_collaborator(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_project_editor(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_collaborators pc
    WHERE pc.project_id = p_project_id
      AND pc.user_id = auth.uid()
      AND pc.role = 'editor'
  );
$$;

REVOKE ALL ON FUNCTION public.is_project_editor(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_project_editor(uuid) TO anon, authenticated;

-- 3) Replace problematic policies on projects
DROP POLICY IF EXISTS "Users can view own or collaborated projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own or collaborated projects" ON public.projects;

CREATE POLICY "Users can view own or collaborated projects"
ON public.projects
FOR SELECT
USING (
  auth.uid() = user_id
  OR public.is_project_collaborator(id)
);

CREATE POLICY "Users can update own or collaborated projects"
ON public.projects
FOR UPDATE
USING (
  auth.uid() = user_id
  OR public.is_project_editor(id)
)
WITH CHECK (
  auth.uid() = user_id
  OR public.is_project_editor(id)
);