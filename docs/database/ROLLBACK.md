# Migration Rollback

## Policy

This project uses **forward-only migrations**. Rollback scripts are not auto-generated.

## If a migration fails mid-apply

1. Fix the SQL file
2. Manually revert partial changes in Supabase SQL editor
3. Re-run corrected migration

## If a migration causes production issues

1. **Immediate:** revert application deploy on Vercel (previous git commit)
2. **Database:** forward-fix with a new migration `022_fix_*.sql` — never edit applied migrations
3. **Restore:** use Supabase PITR if data corruption occurred

## Manual rollback template

```sql
-- Example: undo a column add (use with caution)
-- ALTER TABLE my_table DROP COLUMN IF EXISTS new_column;
```

Document any manual rollback in incident report.

## Prevention

- Test migrations on staging Supabase first
- Run `npm run validate:migrations` in CI
- Take manual snapshot before production apply
