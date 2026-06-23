
-- Restrict app_config to admins (handle_new_user is SECURITY DEFINER, still works)
DROP POLICY IF EXISTS "config read" ON public.app_config;
REVOKE SELECT ON public.app_config FROM anon;
GRANT SELECT ON public.app_config TO authenticated;
CREATE POLICY "app_config admin read" ON public.app_config
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "app_config admin write" ON public.app_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Restrict realtime broadcasts on orders to admin or the order's customer
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders realtime authorized" ON realtime.messages;
CREATE POLICY "orders realtime authorized" ON realtime.messages
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.customer_id = auth.uid()
        AND realtime.topic() = 'orders:' || o.id::text
    )
  );
