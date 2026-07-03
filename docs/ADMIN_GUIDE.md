# Admin Guide

## Access

Navigate to `/admin/login`. Unauthenticated users are redirected automatically.

Roles: **admin** (full access), **manager** (most modules), **support** (orders/customers).

## Modules

| Section | URL | Purpose |
|---------|-----|---------|
| Dashboard | `/admin` | Overview |
| Catalog | `/admin/products`, `/admin/categories`, `/admin/brands` | Product catalog |
| Inventory | `/admin/inventory`, `/admin/warehouses` | Stock management |
| Sales | `/admin/orders`, `/admin/customers`, `/admin/coupons` | Order pipeline |
| Finance | `/admin/finance` | Accounting, GST, vendors |
| Marketing | `/admin/marketing` | Campaigns, segments, automation |
| Reports | `/admin/reports` | Analytics dashboards |
| CMS | `/admin/homepage` | Homepage content |

## Audit trail

All CRUD mutations log to `audit_logs` via `log_audit`. View via API (admin/settings permission):

```
GET /api/admin/audit-logs?limit=50&table=orders
```

## Exports

Most list views support CSV export via server actions.

## Support

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).
