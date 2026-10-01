import z from "zod";

import { accountIdSchema } from "@/app/lib/data/validation/accountSchemas";

/** One player and one campaign (SPEC-022 T5). */
export const campaignMemberSchema = z.object({
  campaignId: z.number().int().positive(),
  userId: accountIdSchema,
});
export type CampaignMemberInput = z.input<typeof campaignMemberSchema>;
