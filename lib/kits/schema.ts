import { z } from "zod";
import { Localized, Step } from "@/lib/recipes/schema";

/** A DIY-kit build companion — the step-by-step guide a QR code on the physical
 *  box links to. Reuses the recipe `Step` shape (localized text + optional
 *  durationMin/image) so the renderer and temperature handling are shared. */
export const KitGuideSchema = z.object({
  /** Must match a DIY kit `id` in lib/products.ts (e.g. "kit-medio"). */
  id: z.string().min(1),
  title: Localized,
  intro: Localized,
  /** Optional technique video for the whole build. */
  youtubeId: z.string().nullable().default(null),
  steps: z.array(Step).min(1),
  /** Actionable tips, shown as their own list. */
  tips: z.array(Localized).default([]),
});

export type KitGuide = z.infer<typeof KitGuideSchema>;
