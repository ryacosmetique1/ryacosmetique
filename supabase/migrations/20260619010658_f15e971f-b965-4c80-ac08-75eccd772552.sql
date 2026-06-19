
-- search_path on helpers
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- Revoke EXECUTE on internal SECURITY DEFINER triggers/helpers from public/auth roles
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
-- has_role is used in RLS expressions — keep EXECUTE for authenticated (RLS engine runs as caller).
-- place_order must remain callable by authenticated; already granted.

-- Tighten testimonials insert: must include name & comment of caller's profile
DROP POLICY "testi insert auth" ON public.testimonials;
CREATE POLICY "testi insert auth" ON public.testimonials FOR INSERT TO authenticated WITH CHECK (length(customer_name) > 0 AND length(comment) > 0);
