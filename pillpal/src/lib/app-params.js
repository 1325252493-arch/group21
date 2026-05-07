const getEnv = (k, fallback = null) => {
  try {
    const v = import.meta?.env?.[k];
    return v ?? fallback;
  } catch {
    return fallback;
  }
};

export const appParams = {
  // Supabase
  supabaseUrl: getEnv("VITE_SUPABASE_URL", "https://lzzjyxyojvsghqihlozd.supabase.co"),
  supabaseAnonKey: getEnv("VITE_SUPABASE_ANON_KEY", "sb_publishable_SLp_wg98TRukYnhYcon7Xw_YAo2-kaA"),

  // Device defaults (must match firmware)
  defaultDeviceId: getEnv("VITE_DEFAULT_DEVICE_ID", "demo_device_01"),
};
