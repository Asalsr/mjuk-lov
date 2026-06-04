// The single owner account that can manage all orders. Override via env.
// If you change this, also update the email in the owner RLS policy
// (supabase/migrations/20260604160000_owner_orders.sql).
export const OWNER_EMAIL = process.env.OWNER_EMAIL || "saeedeh.sarmadi@sisp.se";
