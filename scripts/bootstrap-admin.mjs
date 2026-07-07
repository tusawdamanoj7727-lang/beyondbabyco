#!/usr/bin/env node
/**
 * Supabase Cloud admin bootstrap via the official Admin API.
 * Idempotent — safe to re-run. Never inserts into auth.users via SQL.
 *
 * Run after migrations 001–022: npm run bootstrap:admin
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

import { loadEnvFile } from "./env-config.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const ADMIN_EMAIL = "admin@beyondbabyco.com";
const ADMIN_PASSWORD = "Admin@123456";
const ADMIN_NAME = "BeyondBabyCo Admin";

const ROLES = [
  ["admin", "Full system access across all modules.", true],
  ["manager", "Manages catalog, inventory, orders and content.", true],
  ["support", "Handles customer support and order assistance.", true],
  ["customer", "Standard shopper account.", true],
];

const PERMISSIONS = [
  ["catalog.manage", "Create and edit products, categories, brands."],
  ["inventory.manage", "Manage warehouses, stock and purchase orders."],
  ["orders.manage", "View and update orders, payments, shipments."],
  ["orders.view", "Read-only access to orders."],
  ["customers.view", "View customer records."],
  ["customers.manage", "Create, edit, merge and manage customer records."],
  ["content.manage", "Manage CMS: homepage, blogs, banners, pages."],
  ["cms.manage", "Manage the homepage CMS, hero slides and testimonials."],
  ["media.manage", "Manage the media library and storage assets."],
  ["reviews.manage", "Moderate product reviews and featured ratings."],
  ["returns.manage", "Manage returns, RMA workflow, inspections and refunds."],
  ["support.manage", "Manage tickets and contact queries."],
  ["marketing.manage", "Manage coupons, gift cards, loyalty, referrals and campaigns."],
  ["marketing.view", "View marketing dashboard, campaigns, segments and analytics."],
  ["marketing.send", "Send, pause and resume marketing campaigns."],
  ["shipping.manage", "Manage carriers, zones, rates, shipments, pickups and NDR."],
  ["payments.manage", "Manage payment gateways, transactions, settlements and reconciliation."],
  ["reports.view", "View reports and analytics dashboards."],
  ["reports.export", "Export reports to CSV, Excel and PDF."],
  ["analytics.manage", "Manage saved dashboards, scheduled reports and widget layouts."],
  ["finance.view", "View accounting dashboard, ledger and GST reports."],
  ["finance.manage", "Manage expenses, vendors, journal entries and reconciliation."],
  ["finance.export", "Export financial reports and GST data."],
  ["accounting.manage", "Manage expenses, transactions and GST reports."],
  ["settings.manage", "Manage global system settings."],
];

function die(msg) {
  console.error(`\n✗ ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`✓ ${msg}`);
}

function loadAdminClient() {
  const envPath = resolve(root, ".env.local");
  if (!existsSync(envPath)) {
    die(".env.local missing — configure Supabase keys first");
  }

  const env = loadEnvFile(envPath, readFileSync, existsSync);
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) {
    die("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function findAdminUser(admin) {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) {
    throw new Error(`listUsers: ${error.message}`);
  }
  return data.users.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) ?? null;
}

/**
 * @param {{ silent?: boolean }} [options]
 * @returns {Promise<{ created: boolean, userId: string }>}
 */
export async function bootstrapAdmin(options = {}) {
  const silent = options.silent === true;
  const log = silent ? () => {} : ok;

  const admin = loadAdminClient();

  if (!silent) {
    console.log("\nBeyondBabyCo — Admin bootstrap (Supabase Cloud)\n");
  }

  for (const [name, description, isSystem] of ROLES) {
    const { error } = await admin
      .from("roles")
      .upsert({ name, description, is_system: isSystem }, { onConflict: "name", ignoreDuplicates: true });
    if (error) throw new Error(`roles upsert (${name}): ${error.message}`);
  }
  log("Roles seeded");

  for (const [code, description] of PERMISSIONS) {
    const { error } = await admin
      .from("permissions")
      .upsert({ code, description }, { onConflict: "code", ignoreDuplicates: true });
    if (error) throw new Error(`permissions upsert (${code}): ${error.message}`);
  }
  log("Permissions seeded");

  const { data: adminRole, error: adminRoleError } = await admin
    .from("roles")
    .select("id")
    .eq("name", "admin")
    .single();
  if (adminRoleError || !adminRole) {
    throw new Error(`admin role lookup: ${adminRoleError?.message ?? "not found"}`);
  }

  const { data: allPerms, error: permsError } = await admin.from("permissions").select("id");
  if (permsError) throw new Error(`permissions list: ${permsError.message}`);

  for (const perm of allPerms ?? []) {
    const { error } = await admin
      .from("role_permissions")
      .upsert(
        { role_id: adminRole.id, permission_id: perm.id },
        { onConflict: "role_id,permission_id", ignoreDuplicates: true },
      );
    if (error) throw new Error(`role_permissions (${perm.id}): ${error.message}`);
  }
  log(`Admin role linked to ${allPerms?.length ?? 0} permissions`);

  let user = await findAdminUser(admin);
  let created = false;

  if (!user) {
    const { data: createdData, error: createError } = await admin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: ADMIN_NAME },
    });
    if (createError) throw new Error(`createUser: ${createError.message}`);
    user = createdData.user;
    created = true;
    if (!silent) ok("Admin user created");
  } else if (!silent) {
    ok("Admin already exists");
  }

  const { error: metaError } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...(user.user_metadata ?? {}),
      full_name: ADMIN_NAME,
      role: "super_admin",
      is_admin: true,
    },
  });
  if (metaError) throw new Error(`updateUser metadata: ${metaError.message}`);
  log("Admin user metadata synced");

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: user.id,
      role_id: adminRole.id,
      full_name: ADMIN_NAME,
      is_active: true,
    },
    { onConflict: "id" },
  );
  if (profileError) throw new Error(`profile upsert: ${profileError.message}`);
  log("Profile linked to admin role");

  if (!silent) {
    console.log("\nBootstrap complete. Run: npm run check:admin\n");
  }

  return { created, userId: user.id };
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  try {
    await bootstrapAdmin();
  } catch (err) {
    die(err instanceof Error ? err.message : String(err));
  }
}
