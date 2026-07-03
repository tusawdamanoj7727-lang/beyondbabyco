-- =====================================================================
-- BeyondBabyCo — 002_indexes.sql
-- Performance indexes for high-traffic query paths.
-- =====================================================================

-- ---------- Products ----------
create index if not exists idx_products_category      on products(category_id);
create index if not exists idx_products_subcategory   on products(subcategory_id);
create index if not exists idx_products_brand         on products(brand_id);
create index if not exists idx_products_status        on products(status);
create index if not exists idx_products_is_featured   on products(is_featured) where is_featured = true;
create index if not exists idx_products_created_at    on products(created_at desc);
create index if not exists idx_products_name_trgm     on products using gin (name gin_trgm_ops);

create index if not exists idx_product_images_product on product_images(product_id);
create index if not exists idx_product_variants_prod  on product_variants(product_id);
create index if not exists idx_product_tag_map_tag    on product_tag_map(tag_id);
create index if not exists idx_product_ingredients_i  on product_ingredients(ingredient_id);
create index if not exists idx_product_benefits_b     on product_benefits(benefit_id);

create index if not exists idx_categories_parent      on categories(parent_id);
create index if not exists idx_subcategories_category on subcategories(category_id);

-- ---------- Orders ----------
create index if not exists idx_orders_customer        on orders(customer_id);
create index if not exists idx_orders_status          on orders(status);
create index if not exists idx_orders_placed_at       on orders(placed_at desc);
create index if not exists idx_orders_created_at      on orders(created_at desc);
create index if not exists idx_order_items_order      on order_items(order_id);
create index if not exists idx_order_items_product    on order_items(product_id);
create index if not exists idx_payments_order         on payments(order_id);
create index if not exists idx_payments_status        on payments(status);
create index if not exists idx_payment_txn_payment    on payment_transactions(payment_id);
create index if not exists idx_shipments_order        on shipments(order_id);
create index if not exists idx_shipments_status       on shipments(status);
create index if not exists idx_tracking_events_ship   on tracking_events(shipment_id);
create index if not exists idx_shipping_addr_order    on shipping_addresses(order_id);

-- ---------- Customers ----------
create index if not exists idx_customers_profile      on customers(profile_id);
create index if not exists idx_customers_email        on customers(lower(email));
create index if not exists idx_customer_addr_customer on customer_addresses(customer_id);
create index if not exists idx_wishlist_customer      on wishlist(customer_id);
create index if not exists idx_cart_customer          on cart(customer_id);
create index if not exists idx_cart_items_cart        on cart_items(cart_id);

-- ---------- Inventory ----------
create index if not exists idx_inventory_variant      on inventory(product_variant_id);
create index if not exists idx_inventory_warehouse    on inventory(warehouse_id);
create index if not exists idx_inventory_low_stock    on inventory(quantity) where quantity <= reorder_level;
create index if not exists idx_stock_moves_inventory  on stock_movements(inventory_id);
create index if not exists idx_po_items_po            on purchase_order_items(purchase_order_id);
create index if not exists idx_po_supplier            on purchase_orders(supplier_id);

-- ---------- Reviews ----------
create index if not exists idx_reviews_product        on reviews(product_id);
create index if not exists idx_reviews_customer       on reviews(customer_id);
create index if not exists idx_reviews_published      on reviews(is_published) where is_published = true;
create index if not exists idx_review_images_review   on review_images(review_id);

-- ---------- Marketing ----------
create index if not exists idx_coupon_usage_coupon    on coupon_usage(coupon_id);
create index if not exists idx_coupon_usage_customer  on coupon_usage(customer_id);
create index if not exists idx_loyalty_customer       on loyalty_points(customer_id);
create index if not exists idx_referrals_referrer     on referrals(referrer_customer_id);

-- ---------- Support / System ----------
create index if not exists idx_tickets_customer       on support_tickets(customer_id);
create index if not exists idx_tickets_assigned       on support_tickets(assigned_to);
create index if not exists idx_ticket_messages_ticket on ticket_messages(ticket_id);
create index if not exists idx_notifications_user     on notifications(user_id) where is_read = false;
create index if not exists idx_activity_logs_actor    on activity_logs(actor_id);
create index if not exists idx_audit_logs_table       on audit_logs(table_name, record_id);
