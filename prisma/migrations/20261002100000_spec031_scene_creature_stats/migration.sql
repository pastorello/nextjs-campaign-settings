-- AlterTable
ALTER TABLE "sceneCreature" ADD COLUMN     "challengeRating" TEXT,
ADD COLUMN     "statsUrl" TEXT;


-- Hand-written below this line: guards the schema language cannot express.
-- `prisma migrate diff` does not know them, so a later generated migration
-- must be checked for not dropping them (schema.prisma says the same).

-- SPEC-031 §5.A.1: a statistics link is an http/https address, never
-- `javascript:` or another scheme a link's href would act on.
ALTER TABLE "sceneCreature" ADD CONSTRAINT "sceneCreature_stats_url_http" CHECK ("statsUrl" IS NULL OR "statsUrl" ~* '^https?://');

-- SPEC-031 §5.A.3: a challenge rating is one of the 34 values of
-- `5e-encounters.md` §1.
ALTER TABLE "sceneCreature" ADD CONSTRAINT "sceneCreature_challenge_rating_known" CHECK ("challengeRating" IS NULL OR "challengeRating" IN ('0', '1/8', '1/4', '1/2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30'));
