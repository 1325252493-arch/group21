import React, { createContext, useContext, useEffect, useState } from "react";
import { getUserSettings, fontScaleToPx, FONT_SCALE_NORMAL } from "@/api/userSettings";
import { useAuth } from "./AuthContext";

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const { userId } = useAuth();
  const [fontScale, setFontScale] = useState(FONT_SCALE_NORMAL);

  /**
   * Applies the calculated font size to the root document element
   */
  const applyScale = (scale) => {
    const pxValue = fontScaleToPx(scale);
    document.documentElement.style.setProperty("--app-font-size", pxValue);
  };

  useEffect(() => {
    // Re-calculate font size on window resize (especially for mobile/desktop switching)
    const handleResize = () => {
      applyScale(fontScale);
    };

    window.addEventListener('resize', handleResize);
    
    // Initial load from database
    if (userId) {
      let mounted = true;
      async function load() {
        try {
          const s = await getUserSettings(userId);
          if (mounted && s?.font_scale) {
            setFontScale(s.font_scale);
            applyScale(s.font_scale);
          }
        } catch (e) {
          console.error("Failed to load settings in context", e);
        }
      }
      load();
      return () => { mounted = false; };
    }
    
    return () => window.removeEventListener('resize', handleResize);
  }, [userId, fontScale]);

  const updateFontScale = (newScale) => {
    setFontScale(newScale);
    applyScale(newScale);
  };

  const value = {
    fontScale,
    updateFontScale,
    isLarge: Number(fontScale) >= 140
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}