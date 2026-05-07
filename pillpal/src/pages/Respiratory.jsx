import React, { useState, useEffect, useCallback } from "react";
import { Wind, Plus, AlertTriangle, Activity, History, ShieldAlert, Check, Clock, Sun } from "lucide-react";
import { useLang, useT } from "@/lib/LanguageContext";
import { useSettings } from "@/lib/SettingsContext";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase, assertNoSupabaseError } from "@/api/supabaseClient";
import ReminderModal from "@/components/ReminderModal";
import moment from "moment";
import "moment/locale/zh-cn";
import { Checkbox } from "@/components/ui/checkbox";

export default function Respiratory() {
  const t = useT();
  const { lang } = useLang();
  const { isLarge } = useSettings();
  const { userId } = useAuth();

  const [subTab, setSubTab] = useState("asthma");
  const [pefValue, setPefValue] = useState(420);
  const [isSaving, setIsSaving] = useState(false);
  const [allergyReminders, setAllergyReminders] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  const [attacks, setAttacks] = useState([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [symptomStats, setSymptomStats] = useState({});

  const symptomOptions = [
    { id: "sneezing", label: t("symptom_sneezing") },
    { id: "nose", label: t("symptom_nose") },
    { id: "eyes", label: t("symptom_eyes") },
    { id: "rash", label: t("symptom_rash") },
    { id: "throat", label: t("symptom_throat") },
    { id: "headache", label: t("symptom_headache") },
    { id: "fatigue", label: t("symptom_fatigue") },
  ];

  useEffect(() => {
    moment.locale(lang === "zh" ? "zh-cn" : "en");
  }, [lang]);

  const fetchAllergyReminders = useCallback(async () => {
    if (!userId) return;
    try {
      const { data } = await supabase
        .from("medication_reminders")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .or("memo.ilike.%过敏%,memo.ilike.%哮喘%")
        .order("remind_time", { ascending: true });
      setAllergyReminders(data || []);
    } catch (e) { console.error(e); }
  }, [userId]);

  const handleConfirmMed = async (reminder) => {
    if (!userId) return;
    try {
      await supabase.from("pill_event").insert([{
        user_id: userId,
        event_time: new Date().toISOString(),
        event_type: "confirmed_by_app",
        memo: `Confirmed: ${reminder.memo}`
      }]);
      await supabase.from("medication_reminders").update({ is_active: false }).eq("id", reminder.id);
      toast.success(t("success"));
      fetchAllergyReminders();
    } catch (e) { toast.error(t("failed")); }
  };

  const fetchAttacks = useCallback(async () => {
    if (!userId) return;
    try {
      const { data } = await supabase
        .from("asthma_attacks")
        .select("*")
        .eq("user_id", userId)
        .order("attack_time", { ascending: false });
      setAttacks(data || []);
    } catch (e) { console.error(e); }
  }, [userId]);

  const fetchSymptomStats = useCallback(async () => {
    if (!userId) return;
    try {
      const sevenDaysAgo = moment().subtract(7, 'days').toISOString();
      const { data } = await supabase
        .from("allergy_symptoms")
        .select("symptoms")
        .eq("user_id", userId)
        .gte("recorded_at", sevenDaysAgo);
      const counts = {};
      data?.forEach(record => {
        record.symptoms?.forEach(s => { counts[s] = (counts[s] || 0) + 1; });
      });
      setSymptomStats(counts);
    } catch (e) { console.error(e); }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchAllergyReminders();
      fetchAttacks();
      fetchSymptomStats();
    }
  }, [userId, fetchAllergyReminders, fetchAttacks, fetchSymptomStats]);

  const handleRecordPEF = async () => {
    if (!userId) return;
    setIsSaving(true);
    const newVal = Math.floor(Math.random() * (500 - 320) + 320);
    try {
      await supabase.from("health_metrics").insert({ user_id: userId, metric_type: "pef", value_numeric: newVal });
      setPefValue(newVal);
      toast.success(t("success"));
    } catch (e) { toast.error(t("failed")); }
    finally { setIsSaving(false); }
  };

  const handleRecordAttack = async (severity) => {
    if (!userId) return;
    try {
      await supabase.from("asthma_attacks").insert([{ user_id: userId, severity, attack_time: new Date().toISOString() }]);
      toast.success(t("success"));
      fetchAttacks();
    } catch (e) { toast.error(t("failed")); }
  };

  const toggleSymptom = (id) => {
    setSelectedSymptoms(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSaveSymptoms = async () => {
    if (!userId || selectedSymptoms.length === 0) return;
    setIsSaving(true);
    try {
      await supabase.from("allergy_symptoms").insert([{ user_id: userId, symptoms: selectedSymptoms }]);
      toast.success(t("success"));
      setSelectedSymptoms([]);
      fetchSymptomStats();
    } catch (e) { toast.error(t("failed")); }
    finally { setIsSaving(false); }
  };

  const lastAttack = attacks[0];
  const daysSinceLast = lastAttack ? moment().diff(moment(lastAttack.attack_time), 'days') : null;

  if (isLarge) {
    return (
      <div className="px-4 pt-4 pb-24 space-y-8 text-center">
        <h1 className="text-4xl font-black text-teal-700 flex items-center justify-center gap-3">
          <Wind className="w-10 h-10" /> {t('tab_respiratory')}
        </h1>
        <div className="flex bg-slate-100 p-2 rounded-[30px] h-20">
          <button onClick={() => setSubTab("asthma")} className={cn("flex-1 rounded-[25px] text-2xl font-black transition-all", subTab === "asthma" ? "bg-white shadow-md text-teal-600" : "text-slate-500")}>{t('asthma')}</button>
          <button onClick={() => setSubTab("allergy")} className={cn("flex-1 rounded-[25px] text-2xl font-black transition-all", subTab === "allergy" ? "bg-white shadow-md text-teal-600" : "text-slate-500")}>{t('allergy')}</button>
        </div>

        {/* Medication Reminder UI Section */}
        <Card className="border-4 border-teal-500 bg-teal-50 shadow-xl rounded-[40px]">
          <CardContent className="p-8 text-center space-y-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-2xl font-bold text-teal-600 uppercase tracking-widest">{t('next_medication')}</p>
              <Button onClick={() => setModalOpen(true)} size="icon" className="h-14 w-14 rounded-full bg-teal-600 shadow-lg"><Plus /></Button>
            </div>
            {allergyReminders[0] ? (
              <>
                <h3 className="text-6xl font-black text-slate-900">{allergyReminders[0].memo}</h3>
                <div className="flex justify-center items-center gap-3 text-4xl font-black text-teal-700">
                  <Clock className="w-10 h-10" /> {allergyReminders[0].remind_time.slice(0,5)}
                </div>
                <Button onClick={() => handleConfirmMed(allergyReminders[0])} className="w-full h-24 text-3xl font-black bg-teal-600 rounded-3xl mt-4 shadow-lg text-white">{t('confirm')}</Button>
              </>
            ) : <p className="text-3xl text-slate-400 font-bold py-10">{t("no_reminders")}</p>}
          </CardContent>
        </Card>

        {subTab === "asthma" ? (
          <div className="space-y-6">
            <Card className="bg-slate-900 text-white rounded-[40px] p-8 space-y-4 shadow-2xl">
               <ShieldAlert className="w-12 h-12 text-teal-400 mx-auto" />
               <p className="text-3xl font-black">{t('air_quality_label')} ({t('severity_moderate')})</p>
               <p className="text-xl text-slate-300 font-bold">{t('pollen_risk')}</p>
            </Card>
            <Card className="bg-white rounded-[40px] p-8 border-4 border-border shadow-sm space-y-4">
              <div className="flex justify-center gap-3 items-center text-teal-600"><Activity className="w-10 h-10" /><span className="text-3xl font-bold">PEF</span></div>
              <div className="text-8xl font-black text-slate-900">{pefValue} <span className="text-2xl text-slate-400">L/min</span></div>
              <p className="text-slate-500 text-xl font-bold px-4 leading-relaxed">{t("pef_desc")}</p>
              <Button onClick={handleRecordPEF} disabled={isSaving} className="w-full h-24 text-3xl font-black bg-teal-600 rounded-3xl shadow-lg mt-4 text-white">{t('record_data')}</Button>
            </Card>
            <Card className="bg-red-50 border-4 border-red-200 rounded-[40px] p-8 space-y-6">
              <div className="flex justify-center gap-3 items-center text-red-600">
                <AlertTriangle className="w-10 h-10" />
                <span className="text-3xl font-black">{t('record_attack')}</span>
              </div>
              <p className="text-2xl font-bold text-slate-600">{lastAttack ? `${t('last_attack')}: ${daysSinceLast} ${t('days_ago')} (${t('severity_' + lastAttack.severity)})` : t('no_events')}</p>
              <div className="grid grid-cols-3 gap-4">
                <Button onClick={() => handleRecordAttack('mild')} className="h-24 text-xl font-black bg-green-500 rounded-2xl text-white">{t('severity_mild')}</Button>
                <Button onClick={() => handleRecordAttack('moderate')} className="h-24 text-xl font-black bg-orange-500 rounded-2xl text-white">{t('severity_moderate')}</Button>
                <Button onClick={() => handleRecordAttack('severe')} className="h-24 text-xl font-black bg-red-600 rounded-2xl text-white">{t('severity_severe')}</Button>
              </div>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="bg-amber-50 border-4 border-amber-200 rounded-[40px] p-8 space-y-2">
              <Sun className="w-12 h-12 text-amber-500 mx-auto" />
              <h3 className="text-3xl font-black text-amber-700">{t('allergy_season_title')}</h3>
              <p className="text-2xl font-bold text-amber-600">{t('allergy_season_desc')}</p>
              <p className="text-lg text-slate-500">{t('allergy_season_advice')}</p>
            </Card>
            <Card className="bg-white rounded-[40px] p-8 border-4 border-border space-y-6">
              <h3 className="text-3xl font-black">{t('symptoms')}</h3>
              <div className="grid grid-cols-2 gap-4">
                {symptomOptions.map(opt => (
                  <button key={opt.id} onClick={() => toggleSymptom(opt.id)} className={cn("p-6 rounded-2xl border-4 text-2xl font-bold transition-all", selectedSymptoms.includes(opt.id) ? "bg-teal-50 border-teal-500 text-teal-700" : "bg-slate-50 border-slate-100 text-slate-400")}>
                    {opt.label}
                  </button>
                ))}
              </div>
              <Button onClick={handleSaveSymptoms} disabled={isSaving} className="w-full h-24 text-3xl font-black bg-teal-600 rounded-3xl text-white">{t('save')}</Button>
            </Card>
          </div>
        )}
        <ReminderModal open={modalOpen} onOpenChange={setModalOpen} onSave={fetchAllergyReminders} />
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-24 space-y-4">
      <h1 className="text-2xl font-bold">{t('tab_respiratory')}</h1>
      
      {/* Medication Reminder Section */}
      <Card className="border-teal-100 bg-teal-50/30">
        <CardContent className="p-5">
          <div className="flex justify-between items-center mb-4">
            <p className="text-xs font-bold text-teal-600 uppercase tracking-widest">{t("next_medication")}</p>
            <Button onClick={() => setModalOpen(true)} size="sm" variant="ghost" className="h-8 w-8 p-0 text-teal-600"><Plus className="w-4 h-4"/></Button>
          </div>
          {allergyReminders[0] ? (
            <div className="flex justify-between items-center">
              <div><h3 className="text-lg font-bold">{allergyReminders[0].memo}</h3><p className="text-teal-700 font-medium">{allergyReminders[0].remind_time.slice(0,5)}</p></div>
              <Button size="sm" onClick={() => handleConfirmMed(allergyReminders[0])} className="bg-teal-600 text-white rounded-lg px-4">{t("confirm")}</Button>
            </div>
          ) : <p className="text-sm text-slate-400 text-center py-2">{t("no_reminders")}</p>}
        </CardContent>
      </Card>

      <div className="flex bg-slate-100 p-1 rounded-xl">
        <button onClick={() => setSubTab("asthma")} className={cn("flex-1 py-2 text-sm font-bold rounded-lg transition-all", subTab === "asthma" ? "bg-white shadow-sm text-teal-600" : "text-slate-500")}>{t('asthma')}</button>
        <button onClick={() => setSubTab("allergy")} className={cn("flex-1 py-2 text-sm font-bold rounded-lg transition-all", subTab === "allergy" ? "bg-white shadow-sm text-teal-600" : "text-slate-500")}>{t('allergy')}</button>
      </div>

      {subTab === "asthma" ? (
        <div className="space-y-4">
          <Card className="bg-slate-900 text-white p-4 rounded-2xl flex items-center gap-4">
            <ShieldAlert className="text-teal-400" />
            <div>
              <p className="text-sm font-bold">{t('air_quality_label')} ({t('severity_moderate')})</p>
              <p className="text-xs text-slate-300">{t('pollen_risk')}</p>
            </div>
          </Card>
          <Card className="p-6 text-center space-y-4">
            <div className="text-lg font-bold text-slate-500 flex items-center justify-center gap-2"><Activity className="w-4 h-4"/> PEF</div>
            <div className="text-4xl font-black">{pefValue} <span className="text-lg font-normal text-slate-500">L/min</span></div>
            <p className="text-[10px] text-slate-500 text-left bg-slate-50 p-2 rounded-lg leading-relaxed">{t("pef_desc")}</p>
            <Button onClick={handleRecordPEF} className="w-full bg-teal-600 rounded-xl font-bold text-white">{t('record_data')}</Button>
          </Card>
          <Card>
            <CardContent className="p-5 space-y-4">
              <h4 className="font-bold text-sm flex items-center gap-2"><History className="w-4 h-4"/> {t('record_attack')}</h4>
              <div className="flex gap-2">
                {['mild', 'moderate', 'severe'].map(s => (
                  <Button key={s} size="sm" variant="outline" onClick={() => handleRecordAttack(s)} className="flex-1 h-10 text-[10px] font-bold">{t('severity_' + s)}</Button>
                ))}
              </div>
              <div className="space-y-1">
                {attacks.slice(0, 3).map(a => (
                  <div key={a.id} className="text-[10px] flex justify-between bg-slate-50 p-2 rounded-lg">
                    <span className="font-medium text-slate-600">{moment(a.attack_time).format('MMM DD, HH:mm')}</span>
                    <span className={cn("font-bold", a.severity === 'severe' ? "text-red-500" : "text-orange-500")}>{t('severity_' + a.severity)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          <Card className="bg-amber-50 border-amber-100 p-4 rounded-2xl space-y-1">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-sm"><Sun className="w-4 h-4"/> {t('allergy_season_title')}</div>
            <p className="text-xs text-amber-600 font-medium">{t('allergy_season_desc')}</p>
            <p className="text-[10px] text-amber-700 mt-1">{t('allergy_season_advice')}</p>
          </Card>
          <Card className="p-5 space-y-4">
            <h4 className="font-bold text-sm">{t('symptoms')}</h4>
            <div className="grid grid-cols-2 gap-2">
              {symptomOptions.map(opt => (
                <div key={opt.id} className="flex items-center space-x-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <Checkbox id={opt.id} checked={selectedSymptoms.includes(opt.id)} onCheckedChange={() => toggleSymptom(opt.id)} />
                  <label htmlFor={opt.id} className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{opt.label}</label>
                </div>
              ))}
            </div>
            <Button onClick={handleSaveSymptoms} className="w-full bg-teal-600 rounded-xl h-10 text-white font-bold">{t('record_data')}</Button>
          </Card>
          <Card className="p-5 space-y-3">
            <h4 className="font-bold text-sm">{t('weekly_frequency')}</h4>
            <div className="space-y-2">
              {Object.entries(symptomStats).map(([id, count]) => (
                <div key={id} className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">{t('symptom_' + id)}</span>
                  <span className="font-bold text-teal-600">{count} {t('days_ago').replace('天前', '天').replace('days ago', 'times')}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
      <ReminderModal open={modalOpen} onOpenChange={setModalOpen} onSave={fetchAllergyReminders} />
    </div>
  );
}