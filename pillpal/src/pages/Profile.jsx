import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  LogOut, User, Cpu, Pencil, Check, X, Volume2, VolumeX, Settings2 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { useT } from "@/lib/LanguageContext";
import { useSettings } from "@/lib/SettingsContext";
import { 
  getUserSettings, updateUserSettings 
} from "../api/userSettings";
import { supabase } from "@/api/supabaseClient";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export default function Profile() {
  const nav = useNavigate();
  const { userId, phone, logout } = useAuth();
  const { isLarge } = useSettings();
  const t = useT();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [userName, setUserName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  const avatarLetter = useMemo(() => {
    const s = (userName || phone || "").trim();
    return s ? s[0].toUpperCase() : "?";
  }, [userName, phone]);

  useEffect(() => {
    async function load() {
      if (!userId) return;
      try {
        const s = await getUserSettings(userId);
        if (s && typeof s.sound_enabled === "boolean") setSoundEnabled(s.sound_enabled);
        
        const { data } = await supabase.from("users").select("user_name").eq("id", userId).single();
        if (data?.user_name) {
          setUserName(data.user_name);
          setNewName(data.user_name);
        }
      } catch (e) {
        console.error("Load settings failed", e);
      }
    }
    load();
  }, [userId]);

  const onToggleSound = async () => {
    if (!userId) return;
    const next = !soundEnabled;
    setSoundEnabled(next);
    toast.success(next ? t("on") : t("off"));
    try { await updateUserSettings(userId, { sound_enabled: next }); } catch (e) { setSoundEnabled(!next); }
  };

  const handleUpdateName = async () => {
    if (!userId || !newName.trim()) return;
    setIsSavingName(true);
    try {
      const { error } = await supabase.from("users").update({ user_name: newName.trim() }).eq("id", userId);
      if (error) throw error;
      setUserName(newName.trim());
      setIsEditingName(false);
      toast.success(t("success"));
    } catch (e) {
      toast.error(t("failed"));
    } finally {
      setIsSavingName(false);
    }
  };

  if (isLarge) {
    return (
      <div className="px-4 pt-4 pb-24 space-y-6">
        <h1 className="text-4xl font-black text-foreground flex items-center gap-3">
          <User className="w-10 h-10 text-teal-600" /> {t("profile")}
        </h1>

        <div className="bg-white rounded-[40px] p-8 shadow-sm border-4 border-border text-center">
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="h-28 w-28 rounded-full bg-teal-100 flex items-center justify-center border-4 border-white shadow-inner">
              <span className="text-6xl font-black text-teal-700">{avatarLetter}</span>
            </div>
            {isEditingName ? (
              <div className="flex flex-col gap-3 w-full">
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} className="h-20 text-3xl text-center font-black rounded-2xl border-4" />
                <div className="flex gap-2">
                  <Button onClick={handleUpdateName} disabled={isSavingName} className="flex-1 h-16 bg-teal-600 text-2xl font-black rounded-2xl"><Check className="w-8 h-8 mr-2" /> {t("save")}</Button>
                  <Button onClick={() => setIsEditingName(false)} variant="outline" className="flex-1 h-16 text-2xl font-black rounded-2xl border-4"><X className="w-8 h-8 mr-2" /> {t("cancel")}</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3" onClick={() => setIsEditingName(true)}>
                <p className="text-4xl font-black text-foreground truncate max-w-[200px]">{userName || t("my_account")}</p>
                <Pencil className="w-8 h-8 text-teal-600" />
              </div>
            )}
            <p className="text-2xl font-bold text-slate-400">{phone}</p>
          </div>
          <Button onClick={() => nav("/device")} className="w-full h-24 text-3xl font-black bg-orange-500 hover:bg-orange-600 rounded-3xl shadow-lg flex gap-3"><Cpu className="w-10 h-10" /> {t("device")}</Button>
        </div>

        <div className="bg-white rounded-[40px] p-8 border-4 border-border space-y-4">
          <span className="text-2xl font-bold block text-center text-slate-500">{t("sound_alerts")}</span>
          <button onClick={onToggleSound} className={cn("w-full h-24 rounded-3xl text-3xl font-black flex items-center justify-center gap-4 border-4", soundEnabled ? "bg-teal-50 border-teal-500 text-teal-700" : "bg-slate-50 border-slate-300 text-slate-500")}>
            {soundEnabled ? <Volume2 className="w-10 h-10" /> : <VolumeX className="w-10 h-10" />}
            {soundEnabled ? t("voice_on") : t("voice_off")}
          </button>
        </div>

        <Button onClick={() => { logout(); nav("/login"); }} variant="outline" className="w-full h-24 text-3xl font-black rounded-3xl border-red-200 text-red-600 border-4 bg-red-50"><LogOut className="w-10 h-10 mr-4" /> {t("logout")}</Button>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-24 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t("profile")}</h1>
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-teal-100 flex items-center justify-center font-bold text-teal-700 text-xl shadow-inner">{avatarLetter}</div>
          <div className="min-w-0">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} className="h-8 w-24 text-xs font-bold" />
                <Check className="w-4 h-4 text-green-600 cursor-pointer" onClick={handleUpdateName} />
                <X className="w-4 h-4 text-red-500 cursor-pointer" onClick={() => setIsEditingName(false)} />
              </div>
            ) : (
              <div className="flex items-center gap-2" onClick={() => setIsEditingName(true)}>
                <p className="text-xl font-bold text-slate-900 truncate max-w-[120px]">{userName || t("my_account")}</p>
                <Pencil className="w-4 h-4 text-slate-400 cursor-pointer" />
              </div>
            )}
            <p className="text-xs text-muted-foreground">{phone}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => nav("/device")} className="gap-2 border-teal-200 text-teal-700 rounded-xl"><Cpu className="w-4 h-4" /> {t("device")}</Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-border p-4 space-y-4">
        <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mb-2"><Settings2 className="w-4 h-4" /> {t("settings")}</div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3"><Volume2 className="w-5 h-5 text-teal-600" /><span className="text-sm font-bold">{t("sound_alerts")}</span></div>
          <button onClick={onToggleSound} className={cn("px-4 py-1.5 rounded-lg border text-xs font-bold transition-all", soundEnabled ? "bg-teal-600 text-white border-teal-600" : "bg-white text-slate-400")}>{soundEnabled ? t("on") : t("off")}</button>
        </div>
      </div>
      
      <Button onClick={() => { logout(); nav("/login"); }} variant="outline" className="w-full h-12 rounded-xl border-red-100 text-red-500 font-bold"><LogOut className="w-4 h-4 mr-2" /> {t("logout")}</Button>
    </div>
  );
}