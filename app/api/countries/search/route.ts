import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { worldGeoJSONSchema } from "../worldGeoJson";

interface Country {
  id: string;
  name: string;
  nameLong: string;
}

// Cache for the GeoJSON data (in-memory)
let countriesCache: Country[] | null = null;

/**
 * Load world.geojson and cache it in memory
 * Only extracts essential data (name, nameLong, id) for search
 */
function loadCountries(): Country[] {
  if (countriesCache) {
    return countriesCache;
  }

  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "data",
      "world.geojson"
    );
    const fileContents = fs.readFileSync(filePath, "utf8");
    const parsed = worldGeoJSONSchema.safeParse(JSON.parse(fileContents));

    if (!parsed.success) {
      console.error("world.geojson failed validation:", parsed.error.message);
      return [];
    }

    // Extract only essential data for search
    countriesCache = parsed.data.features
      .map((feature, index: number) => ({
        id: feature.properties.NAME || `country-${index}`,
        name: feature.properties.NAME || "Unknown",
        nameLong:
          feature.properties.NAME_LONG || feature.properties.NAME || "Unknown",
      }))
      .filter((c: Country) => c.name !== "Unknown"); // Filter out unknown countries

    return countriesCache;
  } catch {
    return [];
  }
}

/**
 * GET /api/countries/search?q=query
 * Search countries by name
 */
export function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") || "";

  const countries = loadCountries();

  if (!query) {
    // Return top 5 popular countries by default
    const defaultCountries = [
      "Indonesia",
      "India",
      "United Kingdom",
      "Japan",
      "Australia",
    ];
    const filtered = countries
      .filter((c) => defaultCountries.includes(c.name))
      .slice(0, 5);

    return NextResponse.json(filtered);
  }

  // Search countries by name (case-insensitive)
  const lowerQuery = query.toLowerCase();
  const filtered = countries
    .filter(
      (country) =>
        country.name.toLowerCase().includes(lowerQuery) ||
        country.nameLong.toLowerCase().includes(lowerQuery)
    )
    .slice(0, 5); // Limit to 10 results

  return NextResponse.json(filtered);
}
