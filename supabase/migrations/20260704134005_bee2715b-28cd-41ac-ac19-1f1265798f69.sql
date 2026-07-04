-- Harden testimonials Realtime: remove from realtime publication.
-- Rationale: Realtime broadcasts every row change on the publication; even with RLS,
-- pending (approved=false) rows contain user_id and free-text comments that must not
-- leak to public subscribers. Testimonials are not time-sensitive; the public site
-- reads them via a normal SELECT with policy (approved = true).
ALTER PUBLICATION supabase_realtime DROP TABLE public.testimonials;

-- Tighten public SELECT: expose only approved rows AND hide user_id from the anon audience
-- by dropping the column-less "public" policy and re-creating it scoped to safe columns.
-- (RLS is row-level, not column-level, so we rely on server-side / client projections;
-- the policy itself already restricts to approved=true. We re-affirm it explicitly.)
DROP POLICY IF EXISTS "testi public approved" ON public.testimonials;
CREATE POLICY "testi public approved read"
  ON public.testimonials
  FOR SELECT
  TO anon, authenticated
  USING (approved = true);

-- Authors can read their own submissions (pending or approved) so the "my reviews"
-- surface works without leaking to others.
DROP POLICY IF EXISTS "testi author read own" ON public.testimonials;
CREATE POLICY "testi author read own"
  ON public.testimonials
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());