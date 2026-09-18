import { z } from "zod";

/**
 * A `dateSystem` row id, as the panel's actions receive it. Not a
 * `PageMeta` field — an id is never a form field — so it is declared once
 * here for the four actions that name a row.
 */
const dateSystemIdValidator = z.number().int().positive();

export default dateSystemIdValidator;
