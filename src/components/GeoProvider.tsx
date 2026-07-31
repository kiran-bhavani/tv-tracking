"use client";

import { useEffect } from "react";
import { useStore } from "@/store/useStore";
import { detectUserRegion } from "@/app/actions/geo";

export default function GeoProvider({ children }: { children: React.ReactNode }) {
  const { isRegionOverridden, setRegionPreferences, language, countryCode, timezone } = useStore();

  useEffect(() => {
    async function initializeGeo() {
      // 1. Detect local timezone via browser APIs
      const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";

      // 2. If the user hasn't manually overridden their region in settings, fetch edge location
      if (!isRegionOverridden) {
        try {
          const { countryCode: edgeCountry } = await detectUserRegion();
          setRegionPreferences(edgeCountry, "en-US", localTimezone, false);
        } catch (error) {
          console.error("Failed to detect region, defaulting to fallback.", error);
          // Fallback if action fails
          setRegionPreferences("US", "en-US", localTimezone, false);
        }
      } else {
        // Even if overridden, we might want to ensure the timezone is accurate to their device
        // if they travel, but let's just keep their timezone synced to the device always
        // unless they explicitly overrode timezone (we don't have a timezone override yet).
        if (timezone !== localTimezone) {
           setRegionPreferences(countryCode, language, localTimezone, true);
        }
      }
    }

    initializeGeo();
  }, [isRegionOverridden, setRegionPreferences, timezone, countryCode, language]);

  return <>{children}</>;
}
