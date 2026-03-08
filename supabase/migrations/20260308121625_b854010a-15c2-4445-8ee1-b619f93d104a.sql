-- Drop the problematic restrictive policy
DROP POLICY IF EXISTS "Admins can manage user_roles" ON public.user_roles;
-- Drop the new one too, we'll redo it
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;

-- Permissive: users can read their own role (no recursion)
CREATE POLICY "Users can read own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Permissive: admins can manage all roles (uses security definer function)
CREATE POLICY "Admins can manage user_roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));