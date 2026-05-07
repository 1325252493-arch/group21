import React, { useState, useEffect } from "react";
import { Droplet, TrendingDown, Plus, Info, Loader2, Clock, Check } from "lucide-react";
import { useT } from "@/lib/LanguageContext";
import { useSettings } from "@/lib/SettingsContext";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase, assertNoSupabaseError } from "@/api/supabaseClient";
import ReminderModal from "@/components/ReminderModal";

export default function Diabetes() {
  const t = useT();
  const { isLarge } = useSettings();
  const { userId } = useAuth();
  
  const [lastSugar, setLastSugar] = useState("6.2");
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
        .or("memo.ilike.%糖%,memo.ilike.%二甲双胍%,memo.ilike.%胰岛素%")
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
      const { data } = await supabase
        .from("health_metrics")
        .select("value_numeric")
        .eq("user_id", userId)
        .eq("metric_type", "blood_sugar")
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data) setLastSugar(data.value_numeric.toString());
      await fetchReminders();
    }
    loadData();
  }, [userId]);

  const handleSaveReminder = async (formData) => {
    if (!userId) return;
    setSavingReminder(true);
    try {
      const res = await supabase.from("medication_reminders").insert([{ 
        user_id: userId, 
        remind_time: formData.remind_time, 
        memo: formData.memo, 
        is_active: true 
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

  const handleRecordSugar = async () => {
    if (!userId) return;
    setIsSaving(true);
    const newSugar = (Math.random() * (7.5 - 5.0) + 5.0).toFixed(1);
    const toastId = toast.loading(t("loading"));
    try {
      await supabase.from("health_metrics").insert({
        user_id: userId,
        metric_type: "blood_sugar",
        value_numeric: parseFloat(newSugar)
      });
      setLastSugar(newSugar);
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
        <h1 className="text-4xl font-black text-teal-700">{t('tab_diabetes')}</h1>
        
        <Card className="border-4 border-teal-500 bg-teal-50 shadow-xl rounded-[40px]">
          <CardContent className="p-8 text-center space-y-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-2xl font-bold text-teal-600 uppercase">{t('next_medication')}</p>
              <Button onClick={() => setModalOpen(true)} size="icon" className="h-16 w-16 rounded-full bg-teal-600 shadow-lg"><Plus className="w-10 h-10"/></Button>
            </div>
            {reminders[0] ? (
              <>
                <h3 className="text-6xl font-black text-slate-900">{reminders[0].memo}</h3>
                <div className="flex justify-center items-center gap-3 text-4xl font-black text-teal-700">
                  <Clock className="w-10 h-10" /> {reminders[0].remind_time.slice(0,5)}
                </div>
              </>
            ) : <p className="text-3xl text-slate-400 font-bold py-10">{t("no_reminders")}</p>}
          </CardContent>
        </Card>

        <div className="bg-white rounded-[40px] p-8 border-4 border-border shadow-sm text-center space-y-6">
          <div className="flex justify-center gap-3 items-center"><Droplet className="w-12 h-12 text-red-500" /><span className="text-3xl font-bold">{t('blood_sugar')}</span></div>
          <div className="text-8xl font-black text-slate-900">{lastSugar}</div>
          <div className="inline-block px-10 py-3 rounded-full bg-green-100 text-green-700 text-3xl font-black">{t("status_green")}</div>
          <Button onClick={handleRecordSugar} disabled={isSaving} className="w-full h-24 text-4xl font-black bg-teal-600 rounded-3xl shadow-xl flex gap-4">
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
      <h1 className="text-2xl font-bold">{t('tab_diabetes')}</h1>
      
      <Card className="border-teal-100 bg-teal-50/30">
        <CardContent className="p-5">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm font-bold text-teal-600 uppercase">{t("next_medication")}</p>
            <Button onClick={() => setModalOpen(true)} size="sm" variant="ghost" className="h-8 w-8 p-0 text-teal-600"><Plus className="w-5 h-5"/></Button>
          </div>
          {reminders[0] ? (
            <div className="flex justify-between items-center">
              <div><h3 className="text-xl font-bold">{reminders[0].memo}</h3><p className="text-teal-700 font-medium">{reminders[0].remind_time.slice(0,5)}</p></div>
              <Button size="sm" className="bg-teal-600"><Check className="w-4 h-4 mr-1"/>{t("confirm")}</Button>
            </div>
          ) : <p className="text-sm text-slate-400 text-center py-2">{t("no_reminders")}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-5 pb-0"><CardTitle className="text-lg font-semibold flex items-center gap-2"><Droplet className="w-5 h-5 text-red-500" />{t('blood_sugar')}</CardTitle></CardHeader>
        <CardContent className="p-5 text-center">
          <div className="bg-slate-50 rounded-2xl p-6 border border-dashed mb-4">
            <div className="text-4xl font-black">{lastSugar} <span className="text-lg font-normal text-slate-500">mmol/L</span></div>
          </div>
          <Button onClick={handleRecordSugar} disabled={isSaving} variant="outline" className="w-full h-12 rounded-xl font-bold text-teal-700"><Plus className="w-4 h-4" /> {t('record_data')}</Button>
        </CardContent>
      </Card>
      <ReminderModal open={modalOpen} onOpenChange={setModalOpen} onSave={handleSaveReminder} saving={savingReminder} />
    </div>
  );
}