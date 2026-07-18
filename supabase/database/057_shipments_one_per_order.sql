-- =====================================================================
-- 057_shipments_one_per_order.sql
-- Enforce at most one shipment row per order (Delhivery create-once lock).
-- Safe to re-run.
-- =====================================================================

-- Keep oldest shipment per order; drop newer duplicates (prefer row with AWB).
with ranked as (
  select
    id,
    row_number() over (
      partition by order_id
      order by
        case when tracking_number is not null and btrim(tracking_number) <> '' then 0 else 1 end,
        created_at asc,
        id asc
    ) as rn
  from public.shipments
)
delete from public.shipments s
using ranked r
where s.id = r.id
  and r.rn > 1;

create unique index if not exists uq_shipments_order_id
  on public.shipments (order_id);
