DROP POLICY IF EXISTS "anyone can insert subscription" ON public.push_subscriptions;

CREATE POLICY "anon inserts anonymous subscription"
  ON public.push_subscriptions FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);

CREATE POLICY "authenticated inserts own subscription"
  ON public.push_subscriptions FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());