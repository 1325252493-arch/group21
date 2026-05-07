import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase, assertNoSupabaseError } from "@/api/supabaseClient";
import { upsertUserSettings, FONT_SCALE_LARGE } from "@/api/userSettings";

const AuthContext = createContext(null);

const LS_USER_ID = "pillpal_user_id";
const LS_PHONE = "pillpal_phone";

export const AuthProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const [phone, setPhone] = useState(null);

  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  const isAuthenticated = !!userId;

  useEffect(() => {
    // hydrate from localStorage
    try {
      const storedUserId = localStorage.getItem(LS_USER_ID);
      const storedPhone = localStorage.getItem(LS_PHONE);
      if (storedUserId) setUserId(storedUserId);
      if (storedPhone) setPhone(storedPhone);
    } catch {
      // ignore
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  const login = async (inputPhone) => {
    const p = (inputPhone || "").trim();
    if (!p) {
      setAuthError("Phone is required");
      return null;
    }

    setIsLoadingAuth(true);
    setAuthError(null);

    try {
      // 1) try find existing user by phone
      const res = await supabase.from("users").select("id, phone").eq("phone", p).limit(1);

      assertNoSupabaseError(res);

      let u = res.data?.[0] || null;

      // 2) if not exists, create
      if (!u) {
        const insertRes = await supabase.from("users").insert({ phone: p }).select("id, phone").single();

        assertNoSupabaseError(insertRes);
        u = insertRes.data;
      }

      // 3) persist
      setUserId(u.id);
      setPhone(u.phone);

      localStorage.setItem(LS_USER_ID, u.id);
      localStorage.setItem(LS_PHONE, u.phone);

      // 4) ensure user_settings exists (best-effort)
      try {
        await upsertUserSettings(u.id, { sound_enabled: true, font_scale: FONT_SCALE_LARGE });
      } catch {
        // ignore; app can still run with defaults
      }

      return u.id;
    } catch (e) {
      setAuthError(e?.message || "Login failed");
      return null;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = () => {
    setUserId(null);
    setPhone(null);
    setAuthError(null);

    try {
      localStorage.removeItem(LS_USER_ID);
      localStorage.removeItem(LS_PHONE);
    } catch {
      // ignore
    }
  };

  const value = useMemo(
    () => ({
      userId,
      phone,
      isAuthenticated,
      isLoadingAuth,
      authError,
      login,
      logout,
    }),
    [userId, phone, isAuthenticated, isLoadingAuth, authError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};