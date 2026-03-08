
-- Fix user_roles: drop restrictive policies, create permissive ones
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user_roles" ON public.user_roles;

CREATE POLICY "Users can read own role"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage user_roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Fix admin_login_logs: drop restrictive, create permissive
DROP POLICY IF EXISTS "Admins can manage admin_login_logs" ON public.admin_login_logs;

CREATE POLICY "Admins can manage admin_login_logs"
ON public.admin_login_logs FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Also allow admins to insert login logs (permissive for self-logging)
CREATE POLICY "Authenticated users can insert own login logs"
ON public.admin_login_logs FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Fix admin_settings: drop restrictive, create permissive
DROP POLICY IF EXISTS "Admins can manage admin_settings" ON public.admin_settings;

CREATE POLICY "Admins can manage admin_settings"
ON public.admin_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read settings (needed during login check)
CREATE POLICY "Authenticated can read admin_settings"
ON public.admin_settings FOR SELECT TO authenticated
USING (true);

-- Fix activity_log
DROP POLICY IF EXISTS "Admins can manage activity_log" ON public.activity_log;
CREATE POLICY "Admins can manage activity_log"
ON public.activity_log FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Fix visibility_log
DROP POLICY IF EXISTS "Admins can manage visibility_log" ON public.visibility_log;
CREATE POLICY "Admins can manage visibility_log"
ON public.visibility_log FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Fix events
DROP POLICY IF EXISTS "Anyone can read events" ON public.events;
DROP POLICY IF EXISTS "Admins can manage events" ON public.events;
CREATE POLICY "Anyone can read events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Admins can manage events" ON public.events FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Fix contacts
DROP POLICY IF EXISTS "Anyone can submit contact" ON public.contacts;
DROP POLICY IF EXISTS "Admins can view contacts" ON public.contacts;
DROP POLICY IF EXISTS "Admins can update contacts" ON public.contacts;
DROP POLICY IF EXISTS "Admins can delete contacts" ON public.contacts;
CREATE POLICY "Anyone can submit contact" ON public.contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view contacts" ON public.contacts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update contacts" ON public.contacts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete contacts" ON public.contacts FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Fix registrations
DROP POLICY IF EXISTS "Anyone can register" ON public.registrations;
DROP POLICY IF EXISTS "Admins can view registrations" ON public.registrations;
DROP POLICY IF EXISTS "Admins can update registrations" ON public.registrations;
DROP POLICY IF EXISTS "Admins can delete registrations" ON public.registrations;
CREATE POLICY "Anyone can register" ON public.registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view registrations" ON public.registrations FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update registrations" ON public.registrations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete registrations" ON public.registrations FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Fix colleges
DROP POLICY IF EXISTS "Anyone can read colleges" ON public.colleges;
DROP POLICY IF EXISTS "Admins can manage colleges" ON public.colleges;
DROP POLICY IF EXISTS "Admins can delete colleges" ON public.colleges;
CREATE POLICY "Anyone can read colleges" ON public.colleges FOR SELECT USING (true);
CREATE POLICY "Admins can manage colleges" ON public.colleges FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Fix sponsors
DROP POLICY IF EXISTS "Anyone can read sponsors" ON public.sponsors;
DROP POLICY IF EXISTS "Admins can insert sponsors" ON public.sponsors;
DROP POLICY IF EXISTS "Admins can update sponsors" ON public.sponsors;
DROP POLICY IF EXISTS "Admins can delete sponsors" ON public.sponsors;
CREATE POLICY "Anyone can read sponsors" ON public.sponsors FOR SELECT USING (true);
CREATE POLICY "Admins can manage sponsors" ON public.sponsors FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Fix college_scores
DROP POLICY IF EXISTS "Anyone can read scores" ON public.college_scores;
DROP POLICY IF EXISTS "Admins can insert scores" ON public.college_scores;
DROP POLICY IF EXISTS "Admins can update scores" ON public.college_scores;
DROP POLICY IF EXISTS "Admins can delete scores" ON public.college_scores;
CREATE POLICY "Anyone can read scores" ON public.college_scores FOR SELECT USING (true);
CREATE POLICY "Admins can manage scores" ON public.college_scores FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Fix bot_contacts
DROP POLICY IF EXISTS "Anyone can read bot_contacts" ON public.bot_contacts;
DROP POLICY IF EXISTS "Admins can manage bot_contacts" ON public.bot_contacts;
CREATE POLICY "Anyone can read bot_contacts" ON public.bot_contacts FOR SELECT USING (true);
CREATE POLICY "Admins can manage bot_contacts" ON public.bot_contacts FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Fix bot_faqs
DROP POLICY IF EXISTS "Anyone can read bot_faqs" ON public.bot_faqs;
DROP POLICY IF EXISTS "Admins can manage bot_faqs" ON public.bot_faqs;
CREATE POLICY "Anyone can read bot_faqs" ON public.bot_faqs FOR SELECT USING (true);
CREATE POLICY "Admins can manage bot_faqs" ON public.bot_faqs FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Fix api_keys
DROP POLICY IF EXISTS "Admins can manage api_keys" ON public.api_keys;
CREATE POLICY "Admins can manage api_keys" ON public.api_keys FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Fix event_updates
DROP POLICY IF EXISTS "Admins can view event_updates" ON public.event_updates;
CREATE POLICY "Admins can view event_updates" ON public.event_updates FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fix section_cards
DROP POLICY IF EXISTS "Anyone can read section_cards" ON public.section_cards;
DROP POLICY IF EXISTS "Admins can update section_cards" ON public.section_cards;
DROP POLICY IF EXISTS "Admins can insert section_cards" ON public.section_cards;
DROP POLICY IF EXISTS "Admins can delete section_cards" ON public.section_cards;
CREATE POLICY "Anyone can read section_cards" ON public.section_cards FOR SELECT USING (true);
CREATE POLICY "Admins can manage section_cards" ON public.section_cards FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Fix site_sections
DROP POLICY IF EXISTS "Anyone can read site_sections" ON public.site_sections;
DROP POLICY IF EXISTS "Admins can update site_sections" ON public.site_sections;
DROP POLICY IF EXISTS "Admins can insert site_sections" ON public.site_sections;
DROP POLICY IF EXISTS "Admins can delete site_sections" ON public.site_sections;
CREATE POLICY "Anyone can read site_sections" ON public.site_sections FOR SELECT USING (true);
CREATE POLICY "Admins can manage site_sections" ON public.site_sections FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
