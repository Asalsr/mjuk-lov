import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Mirror the tsconfig "@/*" → "./*" path alias so tests can import modules that
// use the @ alias at runtime (e.g. lib/recipes/schema.ts → @/lib/units/units).
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
