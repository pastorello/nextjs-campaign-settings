import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: false });

export async function fetchCardData() {
  try {
    const magicItemCountPromise = sql`SELECT COUNT(*) FROM magicitems`;
    const pngCountPromise = sql`SELECT COUNT(*) FROM png`;
    const spellCountPromise = sql`SELECT COUNT(*) FROM spells`;
    const deityCountPromise = sql`SELECT COUNT(*) FROM deities`;

    const data = await Promise.all([
      magicItemCountPromise,
      pngCountPromise,
      spellCountPromise,
      deityCountPromise,
    ]);

    const numberOfmagicItems = Number(data[0][0].count ?? "0");
    const numberOfPng = Number(data[1][0].count ?? "0");
    const numberOfSpells = Number(data[2][0].count ?? "0");
    const numberOfDeities = Number(data[3][0].count ?? "0");

    return {
      numberOfmagicItems,
      numberOfPng,
      numberOfSpells,
      numberOfDeities,
    };
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch card data.");
  }
}
