import z from "zod";

/** One campaign, by id (SPEC-032 T4: archive and restore). */
export const campaignIdSchema = z.object({
  campaignId: z.number().int().positive(),
});
export type CampaignIdInput = z.input<typeof campaignIdSchema>;
