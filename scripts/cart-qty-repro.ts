/**
 * Pure-logic reproduction of cart quantity drift paths.
 * Run: npx tsx scripts/cart-qty-repro.ts
 */
import { mergeCartItems, mergeGuestCartIntoServer, cartLineKey, type CartItem } from "../src/lib/storefront/cart-types";

function item(
  productId: string,
  variantId: string | null,
  quantity: number,
): CartItem {
  return {
    productId,
    variantId,
    quantity,
    addedAt: 1,
    name: "Test",
    slug: "test",
    price: 100,
    compareAtPrice: null,
    variantName: null,
    imageUrl: null,
    categoryId: null,
    brandId: null,
    stock: 10,
    inStock: true,
    gstRate: 12,
  };
}

console.log("=== Repro A: mergeCartItems additive merge (login hydration) ===");
let local = [item("p1", null, 1)]; // guest local uses null -> key p1:default
let remote = [item("p1", "uuid-variant", 1)]; // server uses real variant uuid
let merged = mergeCartItems(local, remote);
console.log("local key", cartLineKey("p1", null));
console.log("remote key", cartLineKey("p1", "uuid-variant"));
console.log(
  "merged lines",
  merged.map((i) => ({ key: cartLineKey(i.productId, i.variantId), qty: i.quantity })),
);
console.log("total qty", merged.reduce((s, i) => s + i.quantity, 0));

console.log("\n=== Repro B: repeated mergeCartItems simulates setLoggedIn re-fire ===");
local = merged.map((i) => ({ ...i }));
remote = [item("p1", "uuid-variant", 1)];
for (let cycle = 1; cycle <= 5; cycle++) {
  merged = mergeCartItems(local, remote);
  local = merged.map((i) => ({ ...i }));
  const total = merged.reduce((s, i) => s + i.quantity, 0);
  console.log(`cycle ${cycle}: total qty = ${total}`, merged.map((i) => i.quantity));
}

console.log("\n=== Repro C (FIXED): same variant key repeated mergeGuestCartIntoServer ===");
local = [item("p1", "uuid-variant", 1)];
remote = [item("p1", "uuid-variant", 1)];
for (let cycle = 1; cycle <= 5; cycle++) {
  merged = mergeGuestCartIntoServer(local, remote);
  local = merged.map((i) => ({ ...i }));
  console.log(`cycle ${cycle}: qty = ${merged[0]?.quantity}`);
}

console.log("\n=== Repro D (FIXED): variant key mismatch guest merge ===");
local = [item("p1", null, 1)];
remote = [item("p1", "uuid-variant", 1)];
for (let cycle = 1; cycle <= 5; cycle++) {
  merged = mergeGuestCartIntoServer(local, remote);
  local = merged.map((i) => ({ ...i }));
  const total = merged.reduce((s, i) => s + i.quantity, 0);
  console.log(`cycle ${cycle}: total qty = ${total}`, merged.map((i) => i.quantity));
}
