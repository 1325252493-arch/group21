import React, { useState, useEffect, useCallback } from "react";
import { 
  Smile, Meh, Frown, AlertCircle, Phone, 
  ChevronDown, Check, Plus, Clock, BookOpen, Trash2, Pencil, Loader2, Wind 
} from "lucide-react";
import { useLang, useT } from "@/lib/LanguageContext";
import { useSettings } from "@/lib/SettingsContext";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/api/supabaseClient";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import ReminderModal from "@/components/ReminderModal";
import { Textarea } from "@/components/ui/textarea";
import moment from "moment";
import "moment/locale/zh-cn";

export default function Mood() {
  const t = useT();
  const { lang } = useLang();
  const { isLarge } = useSettings();
  const { userId } = useAuth();
  
  const [relatives, setRelatives] = useState([]);
  const [emergencyContact, setEmergencyContact] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  const [diaries, setDiaries] = useState([]);
  const [diaryContent, setDiaryContent] = useState("");
  const [isSavingDiary, setIsSavingDiary] = useState(false);
  const [editingDiaryId, setEditingDiaryId] = useState(null);

  const [moodTrend, setMoodTrend] = useState([]);
  const [isBreathing, setIsBreathing] = useState(false);

  // Sync moment locale
  useEffect(() => {
    moment.locale(lang === "zh" ? "zh-cn" : "en");
  }, [lang]);

  const fetchReminders = useCallback(async () => {
    if (!userId) return;
    try {
      const { data } = await supabase
        .from("medication_reminders")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .or("memo.ilike.%情绪%,memo.ilike.%安神%,memo.ilike.%助眠%")
        .order("remind_time", { ascending: true });
      setReminders(data || []);
    } catch (e) { console.error(e); }
  }, [userId]);

  const fetchDiaries = useCallback(async () => {
    if (!userId) return;
    try {
      const { data } = await supabase
        .from("mood_diaries")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      setDiaries(data || []);
    } catch (e) { console.error(e); }
  }, [userId]);

  const fetchMoodStats = useCallback(async () => {
    if (!userId) return;
    try {
      const sevenDaysAgo = moment().subtract(7, 'days').toISOString();
      const { data } = await supabase
        .from("mood_checkin")
        .select("mood, recorded_at")
        .eq("user_id", userId)
        .gte("recorded_at", sevenDaysAgo)
        .order("recorded_at", { ascending: true });
      setMoodTrend(data || []);
    } catch (e) { console.error(e); }
  }, [userId]);

  useEffect(() => {
    async function loadData() {
      if (!userId) return;
      const { data: rels } = await supabase.from("relatives").select("*").eq("user_id", userId);
      setRelatives(rels || []);

      const { data: metric } = await supabase
        .from("health_metrics")
        .select("value_text")
        .eq("user_id", userId)
        .eq("metric_type", "emergency_contact_config")
        .maybeSingle();
      
      if (metric && rels) {
        const found = rels.find(r => r.id === metric.value_text);
        if (found) setEmergencyContact(found);
      }
      
      await fetchReminders();
      await fetchDiaries();
      await fetchMoodStats();
    }
    loadData();
  }, [userId, fetchReminders, fetchDiaries, fetchMoodStats]);

  const handleSetEmergency = async (rel) => {
    if (!userId) return;
    setEmergencyContact(rel);
    try {
      await supabase.from("health_metrics").upsert({
        user_id: userId,
        metric_type: "emergency_contact_config",
        value_text: rel.id
      }, { onConflict: 'user_id,metric_type' });
      toast.success(t("success"));
    } catch (e) { toast.error(t("failed")); }
  };

  const handleEmergencyCall = async () => {
    if (!emergencyContact || !userId) {
      toast.error(t("failed"), { description: "Please link a relative first" });
      return;
    }
    try {
      await supabase.from("pill_event").insert([{
        user_id: userId,
        event_type: "emergency_call",
        memo: `Called: ${emergencyContact.name} (${emergencyContact.phone})`,
        event_time: new Date().toISOString()
      }]);
      toast.error(t("emergency_contact"), {
        description: `${emergencyContact.name}: ${emergencyContact.phone}`,
        duration: 5000,
      });
    } catch (e) { console.warn(e); }
  };

  const handleConfirmMed = async (reminder) => {
    if (!userId) return;
    try {
      await supabase.from("pill_event").insert([{
        user_id: userId,
        event_time: new Date().toISOString(),
        event_type: "confirmed_by_app",
        memo: `Mood Med Confirmed: ${reminder.memo}`
      }]);
      await supabase.from("medication_reminders").update({ is_active: false }).eq("id", reminder.id);
      toast.success(t("success"));
      fetchReminders();
    } catch (e) { toast.error(t("failed")); }
  };

  const handleMoodCheckin = async (mood) => {
    if (!userId) return;
    try {
      await supabase.from("mood_checkin").insert([{ user_id: userId, mood }]);
      toast.success(t("success"));
      fetchMoodStats();
    } catch (e) { toast.error(t("failed")); }
  };

  const handleSaveDiary = async () => {
    if (!userId || !diaryContent.trim()) return;
    setIsSavingDiary(true);
    try {
      if (editingDiaryId) await supabase.from("mood_diaries").update({ content: diaryContent }).eq("id", editingDiaryId);
      else await supabase.from("mood_diaries").insert([{ user_id: userId, content: diaryContent }]);
      setDiaryContent(""); setEditingDiaryId(null); fetchDiaries();
      toast.success(t("success"));
    } catch (e) { toast.error(t("failed")); }
    finally { setIsSavingDiary(false); }
  };

  const startBreathing = () => {
    setIsBreathing(true);
    setTimeout(() => { setIsBreathing(false); toast.success(t("success")); }, 15000);
  };

  const getMoodEmoji = (mood) => {
    if (mood === 'good') return "😊";
    if (mood === 'normal') return "😐";
    return "☹️";
  };

  if (isLarge) {
    return (
      <div className="px-4 pt-4 pb-24 space-y-8 text-center">
        <h1 className="text-4xl font-black text-teal-700">{t('tab_mood')}</h1>
        
        {/* Medication Reminder Section */}
        <Card className="border-4 border-teal-500 bg-teal-50 shadow-xl rounded-[40px]">
          <CardContent className="p-8 space-y-4 text-center">
            <div className="flex justify-between items-center mb-2">
              <p className="text-2xl font-bold text-teal-600 uppercase tracking-widest">{t('next_medication')}</p>
              <Button onClick={() => setModalOpen(true)} size="icon" className="h-14 w-14 rounded-full bg-teal-600 shadow-lg"><Plus /></Button>
            </div>
            {reminders[0] ? (
              <>
                <h3 className="text-6xl font-black text-slate-900">{reminders[0].memo}</h3>
                <div className="flex justify-center items-center gap-3 text-4xl font-black text-teal-700">
                  <Clock className="w-10 h-10" /> {reminders[0].remind_time.slice(0,5)}
                </div>
                <Button onClick={() => handleConfirmMed(reminders[0])} className="w-full h-24 text-3xl font-black bg-teal-600 rounded-3xl mt-4 text-white">{t('confirm')}</Button>
              </>
            ) : <p className="text-3xl text-slate-400 font-bold py-10">{t("no_reminders")}</p>}
          </CardContent>
        </Card>

        {/* Mood Checkin Section */}
        <Card className="bg-white rounded-[40px] p-8 border-4 border-border space-y-6">
          <h3 className="text-3xl font-black">{t('mood_check')}</h3>
          <div className="grid grid-cols-3 gap-4">
            {['good', 'normal', 'bad'].map(m => (
              <button key={m} onClick={() => handleMoodCheckin(m)} className="p-6 bg-slate-50 rounded-3xl border-4 hover:border-teal-500 transition-all">
                <span className="text-6xl mb-2 block">{getMoodEmoji(m)}</span>
                <p className="text-xl font-bold">{t('mood_' + m)}</p>
              </button>
            ))}
          </div>
        </Card>

        {/* Mood Trend Section (Newly Added for Elderly Mode) */}
        <Card className="bg-white rounded-[40px] p-8 border-4 border-border space-y-6">
          <h3 className="text-3xl font-black text-slate-400 uppercase">{t('mood_trend')}</h3>
          <div className="flex gap-4 overflow-x-auto justify-center pb-2">
            {moodTrend.map((m, i) => (
              <div key={i} className="flex flex-col items-center shrink-0 bg-slate-50 p-4 rounded-2xl border-2">
                <span className="text-4xl">{getMoodEmoji(m.mood)}</span>
                <span className="text-sm font-bold text-slate-400 mt-2">{moment(m.recorded_at).format('ddd')}</span>
              </div>
            ))}
            {moodTrend.length === 0 && <p className="text-2xl text-slate-400 font-bold py-4">{t('no_events')}</p>}
          </div>
        </Card>

        {/* Original Emergency Section */}
        <div className="bg-red-600 border-4 border-red-800 rounded-[40px] p-8 shadow-2xl space-y-6">
          <div className="flex flex-col items-center text-center gap-4 text-white">
            <AlertCircle className="w-20 h-20" />
            <h4 className="font-black text-4xl">{t('emergency_contact')}</h4>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-2xl font-bold text-white/90 border-2 border-white/20 rounded-2xl px-6 py-8 h-auto">
                  {emergencyContact ? `${emergencyContact.name} (${emergencyContact.phone})` : t("manage_relatives")}
                  <ChevronDown className="ml-2 w-8 h-8" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80 rounded-2xl">
                {relatives.map(r => (
                  <DropdownMenuItem key={r.id} onClick={() => handleSetEmergency(r)} className="text-xl py-4 flex justify-between">
                    {r.name} {emergencyContact?.id === r.id && <Check className="w-6 h-6 text-teal-600" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={handleEmergencyCall} className="w-full h-24 bg-white text-red-600 rounded-3xl text-3xl font-black shadow-inner">
              <Phone className="w-10 h-10 mr-4 fill-current" /> {t("start")}
            </Button>
          </div>
        </div>

        {/* Breathing Exercise */}
        <Button onClick={startBreathing} disabled={isBreathing} className={cn("w-full h-32 text-4xl font-black rounded-[40px] transition-all", isBreathing ? "bg-teal-100 text-teal-600 animate-pulse" : "bg-teal-600 text-white shadow-xl")}>
          <Wind className="w-12 h-12 mr-4" /> {isBreathing ? "..." : t('breathing_practice')}
        </Button>

        <ReminderModal open={modalOpen} onOpenChange={setModalOpen} onSave={fetchReminders} />
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-24 space-y-6">
      <h1 className="text-2xl font-bold">{t('tab_mood')}</h1>
      
      {/* Medication Reminder Section */}
      <Card className="border-teal-100 bg-teal-50/30">
        <CardContent className="p-5">
          <div className="flex justify-between items-center mb-4">
            <p className="text-xs font-bold text-teal-600 uppercase tracking-widest">{t("next_medication")}</p>
            <Button onClick={() => setModalOpen(true)} size="sm" variant="ghost" className="h-8 w-8 p-0 text-teal-600"><Plus className="w-4 h-4"/></Button>
          </div>
          {reminders[0] ? (
            <div className="flex justify-between items-center">
              <div><h3 className="text-lg font-bold">{reminders[0].memo}</h3><p className="text-teal-700 font-medium">{reminders[0].remind_time.slice(0,5)}</p></div>
              <Button size="sm" onClick={() => handleConfirmMed(reminders[0])} className="bg-teal-600 text-white rounded-lg px-4">{t("confirm")}</Button>
            </div>
          ) : <p className="text-sm text-slate-400 text-center py-2">{t("no_reminders")}</p>}
        </CardContent>
      </Card>

      {/* Mood Checkin & Trend Section */}
      <Card className="p-5 space-y-4">
        <h4 className="font-bold text-sm">{t('mood_check')}</h4>
        <div className="flex justify-around border-b pb-4">
          {['good', 'normal', 'bad'].map(m => (
            <button key={m} onClick={() => handleMoodCheckin(m)} className="flex flex-col items-center gap-1 group">
              <span className="text-3xl grayscale group-hover:grayscale-0 transition-all">{getMoodEmoji(m)}</span>
              <span className="text-[10px] font-bold text-slate-500">{t('mood_' + m)}</span>
            </button>
          ))}
        </div>
        <div className="pt-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">{t('mood_trend')}</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {moodTrend.map((m, i) => (
              <div key={i} className="flex flex-col items-center shrink-0 bg-slate-50 p-2 rounded-lg">
                <span className="text-lg">{getMoodEmoji(m.mood)}</span>
                <span className="text-[8px] text-slate-400">{moment(m.recorded_at).format('ddd')}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Original Emergency Card */}
      <Card className="bg-red-50 border-red-100 shadow-sm">
        <CardContent className="p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-red-100 rounded-2xl text-red-600"><AlertCircle className="w-6 h-6" /></div>
             <div className="min-w-0">
               <p className="font-bold text-red-900 leading-none mb-1">{t("emergency_contact")}</p>
               <DropdownMenu>
                  <DropdownMenuTrigger className="text-xs text-red-600 flex items-center gap-1 hover:underline truncate">
                    {emergencyContact ? emergencyContact.name : t('select_contact')} <ChevronDown className="w-3 h-3 shrink-0"/>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {relatives.map(r => (
                      <DropdownMenuItem key={r.id} onClick={() => handleSetEmergency(r)} className="flex justify-between gap-4 text-xs">
                        {r.name} {emergencyContact?.id === r.id && <Check className="w-3 h-3 text-teal-600" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
               </DropdownMenu>
             </div>
          </div>
          <Button onClick={handleEmergencyCall} className="bg-red-600 h-12 px-6 rounded-xl font-bold text-white shrink-0">
            <Phone className="w-4 h-4 mr-2"/>{t("start")}
          </Button>
        </CardContent>
      </Card>

      {/* Breathing Button */}
      <Button onClick={startBreathing} disabled={isBreathing} className="w-full h-14 bg-teal-600 text-white font-black rounded-xl text-white">
        <Wind className="w-5 h-5 mr-2" /> {isBreathing ? "..." : t('breathing_practice')}
      </Button>

      {/* Original Mood Diary Section */}
      <Card className="p-5 space-y-4">
        <h4 className="font-bold text-sm flex items-center gap-2"><BookOpen className="w-4 h-4"/> {t("mood_diary")}</h4>
        <Textarea 
          value={diaryContent} 
          onChange={e => setDiaryContent(e.target.value)} 
          placeholder={t("diary_placeholder")}
          className="min-h-[100px] bg-slate-50 border-none rounded-xl"
        />
        <Button onClick={handleSaveDiary} disabled={isSavingDiary} className="w-full bg-teal-600 rounded-xl h-10 font-bold text-white">
          {isSavingDiary ? <Loader2 className="animate-spin w-4 h-4"/> : editingDiaryId ? t("save") : t("write_diary")}
        </Button>

        <div className="space-y-3 mt-4 border-t pt-4">
          {diaries.map(d => (
            <div key={d.id} className="bg-slate-50 p-4 rounded-xl relative group">
              <p className="text-[10px] text-slate-400 mb-1">{moment(d.created_at).format('MMM DD, HH:mm')}</p>
              <p className="text-sm text-slate-700 leading-relaxed">{d.content}</p>
              <div className="flex gap-2 mt-2">
                <button onClick={() => { setEditingDiaryId(d.id); setDiaryContent(d.content); }} className="text-[10px] text-teal-600 font-bold underline">{t("edit")}</button>
                <button onClick={async () => { await supabase.from("mood_diaries").delete().eq("id", d.id); fetchDiaries(); }} className="text-[10px] text-red-500 font-bold underline">{t("delete")}</button>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <ReminderModal open={modalOpen} onOpenChange={setModalOpen} onSave={fetchReminders} />
    </div>
  );
}