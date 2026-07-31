"use server";

import { headers } from "next/headers";

export async function detectUserRegion() {
  const headersList = await headers();
  // Vercel edge network automatically injects the ISO-3166-1 country code
  const country = headersList.get("x-vercel-ip-country");
  
  return {
    countryCode: country || "US"
  };
}
