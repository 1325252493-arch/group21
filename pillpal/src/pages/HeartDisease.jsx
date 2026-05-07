import React, { useState, useEffect } from "react";
import { Heart, Activity, Plus, Loader2, Clock, Check } from "lucide-react";
import { useT } from "@/lib/LanguageContext";
import { useSettings } from "@/lib/SettingsContext";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase, assertNoSupabaseError } from "@/api/supabaseClient";
import ReminderModal from "@/components/ReminderModal";

export default function HeartDisease() {
  const t = useT();
  const { isLarge } = useSettings();
  const { userId } = useAuth();
  
  const [bp, setBp] = useState({ sys: 128, dia: 82 });
  const [isSaving, setIsSaving] = useState(false);
  const [reminders, setReminders] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [savingReminder, setSavingReminder] = useState(false);

  const fetchReminders = async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from("medication_reminders")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .or("memo.ilike.%心%,memo.ilike.%压%,memo.ilike.%阿司匹林%")
        .order("remind_time", { ascending: true });
      if (error) throw error;
      setReminders(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    async function loadData() {
      if (!userId) return;
      const { data: sysData } = await supabase
        .from("health_metrics")
        .select("value_numeric")
        .eq("user_id", userId)
        .eq("metric_type", "blood_pressure_sys")
        .order("recorded_at", { ascending: false })
        .limit(1).maybeSingle();
      const { data: diaData } = await supabase
        .from("health_metrics")
        .select("value_numeric")
        .eq("user_id", userId)
        .eq("metric_type", "blood_pressure_dia")
        .order("recorded_at", { ascending: false })
        .limit(1).maybeSingle();
      
      if (sysData && diaData) setBp({ sys: sysData.value_numeric, dia: diaData.value_numeric });
      await fetchReminders();
    }
    loadData();
  }, [userId]);

  const handleSaveReminder = async (formData) => {
    if (!userId) return;
    setSavingReminder(true);
    try {
      const res = await supabase.from("medication_reminders").insert([{ 
        user_id: userId, remind_time: formData.remind_time, memo: formData.memo, is_active: true 
      }]);
      assertNoSupabaseError(res);
      toast.success(t("success"));
      setModalOpen(false);
      fetchReminders();
    } catch (e) {
      toast.error(t("failed"));
    } finally {
      setSavingReminder(false);
    }
  };

  const handleRecordBP = async () => {
    if (!userId) return;
    setIsSaving(true);
    const toastId = toast.loading(t("loading"));
    const newSys = Math.floor(Math.random() * (135 - 115) + 115);
    const newDia = Math.floor(Math.random() * (85 - 75) + 75);
    try {
      await supabase.from("health_metrics").insert([
        { user_id: userId, metric_type: "blood_pressure_sys", value_numeric: newSys },
        { user_id: userId, metric_type: "blood_pressure_dia", value_numeric: newDia }
      ]);
      setBp({ sys: newSys, dia: newDia });
      toast.success(t("success"), { id: toastId });
    } catch (e) {
      toast.error(t("failed"), { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLarge) {
    return (
      <div className="px-4 pt-4 pb-24 space-y-8">
        <h1 className="text-4xl font-black text-teal-700">{t('tab_heart')}</h1>
        <Card className="border-4 border-red-500 bg-red-50 shadow-xl rounded-[40px]">
          <CardContent className="p-8 text-center space-y-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-2xl font-bold text-red-600 uppercase">{t('next_medication')}</p>
              <Button onClick={() => setModalOpen(true)} size="icon" className="h-16 w-16 rounded-full bg-red-600 shadow-lg"><Plus className="w-10 h-10"/></Button>
            </div>
            {reminders[0] ? (
              <>
                <h3 className="text-6xl font-black text-slate-900">{reminders[0].memo}</h3>
                <p className="text-3xl font-bold text-red-700">{reminders[0].remind_time.slice(0,5)}</p>
              </>
            ) : <p className="text-3xl text-slate-400 font-bold py-10">{t("no_reminders")}</p>}
          </CardContent>
        </Card>

        <div className="bg-white rounded-[40px] p-8 border-4 border-border shadow-sm text-center space-y-6">
          <div className="flex justify-center gap-3 items-center"><Heart className="w-12 h-12 text-red-500" /><span className="text-3xl font-bold">{t('blood_pressure')}</span></div>
          <div className="flex justify-center items-baseline gap-2"><span className="text-8xl font-black text-slate-900">{bp.sys}</span><span className="text-3xl font-bold text-slate-400">/ {bp.dia}</span></div>
          <Button onClick={handleRecordBP} disabled={isSaving} className="w-full h-24 text-4xl font-black bg-teal-600 rounded-3xl shadow-xl flex gap-4 mt-2">
            {isSaving ? <Loader2 className="animate-spin w-10 h-10" /> : <Plus className="w-10 h-10 stroke-[4]" />}
            {t('record_data')}
          </Button>
        </div>
        <ReminderModal open={modalOpen} onOpenChange={setModalOpen} onSave={handleSaveReminder} saving={savingReminder} />
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-24 space-y-4">
      <h1 className="text-2xl font-bold">{t('tab_heart')}</h1>
      <Card className="border-red-100 bg-red-50/30">
        <CardContent className="p-5">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm font-bold text-red-600 uppercase">{t("next_medication")}</p>
            <Button onClick={() => setModalOpen(true)} size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600"><Plus className="w-5 h-5"/></Button>
          </div>
          {reminders[0] ? (
            <div className="flex justify-between items-center">
              <div><h3 className="text-xl font-bold">{reminders[0].memo}</h3><p className="text-red-700 font-medium">{reminders[0].remind_time.slice(0,5)}</p></div>
              <Button size="sm" className="bg-red-600"><Check className="w-4 h-4 mr-1"/>{t("confirm")}</Button>
            </div>
          ) : <p className="text-sm text-slate-400 text-center py-2">{t("no_reminders")}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-5 pb-0"><CardTitle className="text-lg font-semibold flex items-center gap-2"><Heart className="w-5 h-5 text-red-500" /> {t('blood_pressure')}</CardTitle></CardHeader>
        <CardContent className="p-5 text-center">
          <div className="grid grid-cols-2 gap-2 bg-slate-50 rounded-2xl p-4 mb-4">
            <div><div className="text-2xl font-black text-slate-900">{bp.sys}</div><div className="text-[10px] text-slate-500 uppercase font-bold">SYS</div></div>
            <div><div className="text-2xl font-black text-slate-900">{bp.dia}</div><div className="text-[10px] text-slate-500 uppercase font-bold">DIA</div></div>
          </div>
          <Button onClick={handleRecordBP} disabled={isSaving} variant="outline" className="w-full h-12 rounded-xl font-bold text-teal-700"><Plus className="w-4 h-4" /> {t('record_data')}</Button>
        </CardContent>
      </Card>
      <ReminderModal open={modalOpen} onOpenChange={setModalOpen} onSave={handleSaveReminder} saving={savingReminder} />
    </div>
  );
}