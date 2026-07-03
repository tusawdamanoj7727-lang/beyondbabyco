# Entity Relationship Overview

```mermaid
erDiagram
  customers ||--o{ orders : places
  orders ||--o{ order_items : contains
  products ||--o{ order_items : referenced
  customers ||--o{ loyalty_points : earns
  customers ||--o{ referrals : refers
  orders ||--o{ payments : paid_by
  orders ||--o{ shipments : fulfilled
  marketing_campaigns ||--o{ campaign_recipients : targets
  marketing_segments ||--o{ marketing_campaigns : audience
  marketing_templates ||--o{ marketing_campaigns : content
  finance_vendors ||--o{ expenses : billed
  journal_entries ||--o{ ledger_entries : posts
  audit_logs }o--|| profiles : changed_by
```

Full schema: apply migrations `001`–`021` in `supabase/database/`.

## Core entities

- **Catalog:** products, categories, brands, variants
- **Operations:** orders, inventory, warehouses, shipments
- **CRM:** customers, reviews, returns
- **Finance:** expenses, ledger, GST, vendors, bank reconciliation
- **Marketing:** campaigns, segments, templates, automation, queues
- **System:** audit_logs, permissions, roles, settings
