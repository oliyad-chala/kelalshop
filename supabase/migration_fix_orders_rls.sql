-- Fix orders INSERT policy: buyers (not shoppers) place orders.
-- The old policy incorrectly required auth.uid() = shopper_id on INSERT.

drop policy if exists "Shoppers can create orders" on orders;

create policy "Buyers can create orders"
  on orders for insert with check (auth.uid() = buyer_id);
