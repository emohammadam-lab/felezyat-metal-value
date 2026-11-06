-- 1. Restore EXECUTE permission on has_role for authenticated and service_role
-- (Previously revoked from PUBLIC, which broke RLS policies calling public.has_role)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- 2. Ensure the shipment-photos storage bucket exists and is public for viewing
INSERT INTO storage.buckets (id, name, public)
VALUES ('shipment-photos', 'shipment-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Tighten shipment RLS policies for sellers so they cannot forge final_price, final_weight, or settled status
DROP POLICY IF EXISTS "Seller manages own shipments" ON public.shipments;

CREATE POLICY "Seller reads own shipments"
  ON public.shipments FOR SELECT TO authenticated
  USING (auth.uid() = seller_id);

CREATE POLICY "Seller inserts own shipments"
  ON public.shipments FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = seller_id
    AND status IN ('registered', 'awaiting_expert')
    AND final_price IS NULL
    AND final_weight IS NULL
  );

CREATE POLICY "Seller updates own shipments"
  ON public.shipments FOR UPDATE TO authenticated
  USING (auth.uid() = seller_id AND status IN ('registered', 'awaiting_expert', 'price_offered'))
  WITH CHECK (auth.uid() = seller_id AND status IN ('registered', 'awaiting_expert', 'seller_approved', 'rejected'));

CREATE POLICY "Seller deletes own pending shipments"
  ON public.shipments FOR DELETE TO authenticated
  USING (auth.uid() = seller_id AND status IN ('registered', 'awaiting_expert'));

