-- Create a security definer function to look up projects by code for collaboration requests
-- This allows any authenticated user to find a project by its code without exposing the full project

CREATE OR REPLACE FUNCTION public.get_project_by_code(p_code text)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.user_id, p.name
  FROM public.projects p
  WHERE p.project_code = p_code
  LIMIT 1;
$$;

-- Grant execute to authenticated users only
REVOKE ALL ON FUNCTION public.get_project_by_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_project_by_code(text) TO authenticated;