/**
 * Re-exports the generated database types so existing imports
 * (`./types`) continue to work. The source of truth lives in
 * `database.types.ts`.
 */
export type { Database, Json, ProductStatus, Tables, TablesInsert, TablesUpdate } from "./database.types";
