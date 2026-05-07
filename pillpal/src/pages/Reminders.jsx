import { useState, useEffect, useCallback } from "react";
import { supabase, assertNoSupabaseError } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { useSettings } from "@/lib/SettingsContext";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Check, 
  Droplets, 
  Footprints, 
  Clock 
} from "lucide-react";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import ReminderCard from "@/components/ReminderCard";
import ReminderModal from "@/components/ReminderModal";
import SkeletonCard from "@/components/SkeletonCard";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function Reminders() {
  const { userId } = useAuth();
  const { isLarge } = useSettings();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  const [waterCount, setWaterCount] = useState(4);
  const steps = 3248;

  const fetchReminders = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await supabase
        .from("medication_reminders")
        .select("id,user_id,remind_time,memo,is_active,created_at")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("remind_time", { ascending: true });

      assertNoSupabaseError(res);
      setReminders(res.data || []);
    } catch (e) {
      toast.error(t("failed"));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchReminders(); }, [fetchReminders]);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      setCurrentTime(`${hh}:${mm}`);
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveReminder = async (formData) => {
    if (!userId) return;
    setSaving(true);
    try {
      const res = await supabase
        .from("medication_reminders")
        .insert([{ 
          user_id: userId, 
          remind_time: formData.remind_time, 
          memo: formData.memo, 
          is_active: true 
        }]);
      
      assertNoSupabaseError(res);
      toast.success(t("reminder_added"));
      setModalOpen(false);
      fetchReminders();
    } catch (e) {
      toast.error(e.message || t("failed"));
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async (reminder) => {
    if (!userId) return;
    try {
      const rTime = (reminder.remind_time || "").slice(0, 5);
      await supabase.from("pill_event").insert({
        user_id: userId,
        event_time: new Date().toISOString(),
        event_type: "confirmed_by_app",
        memo: `Confirmed: ${rTime} ${reminder.memo || ""}`.trim(),
      });
      await supabase.from("medication_reminders").update({ is_active: false }).eq("id", reminder.id);
      toast.success(t("reminder_confirmed"));
      fetchReminders();
    } catch (e) {
      toast.error(t("failed"));
    }
  };

  const nextReminder = reminders[0];

  if (isLarge) {
    return (
      <div className="px-4 pt-4 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-black text-teal-700">{t("app_name")}</h1>
          <Button onClick={() => setModalOpen(true)} className="h-16 w-16 rounded-full bg-teal-600 shadow-xl">
            <Plus className="w-10 h-10" />
          </Button>
        </div>

        {nextReminder ? (
          <Card className="border-4 border-teal-500 bg-teal-50 shadow-2xl rounded-[40px]">
            <CardContent className="p-8 space-y-6 text-center">
              <p className="text-2xl font-bold text-teal-600 uppercase tracking-widest">{t("next_medication")}</p>
              <h2 className="text-6xl font-black text-slate-900">{nextReminder.memo || "—"}</h2>
              <div className="flex justify-center items-center gap-3 text-4xl font-black text-teal-700">
                <Clock className="w-10 h-10" /> {(nextReminder.remind_time || "").slice(0, 5)}
              </div>
              <Button onClick={() => handleConfirm(nextReminder)} className="w-full h-28 text-4xl font-black bg-teal-600 rounded-3xl shadow-lg mt-4">
                <Check className="w-12 h-12 mr-4 stroke-[4]" /> {t("confirm")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="py-20 text-center bg-white rounded-[40px] border-4 border-dashed border-slate-200">
            <p className="text-3xl font-bold text-slate-400">{t("no_reminders")}</p>
          </div>
        )}

        <Card className="rounded-[40px] border-4 border-slate-200 p-8 text-center space-y-4">
          <h4 className="text-3xl font-black text-slate-900">{t("today_progress")}</h4>
          <div className="text-5xl font-black text-teal-600">2 / 3</div>
          <Progress value={66} className="h-8 bg-slate-100 rounded-full" />
        </Card>

        <ReminderModal open={modalOpen} onOpenChange={setModalOpen} onSave={handleSaveReminder} saving={saving} />
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-2 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("reminders")}</h1>
        <Button onClick={() => setModalOpen(true)} className="h-12 px-5 bg-teal-600 rounded-xl">
          <Plus className="w-5 h-5 mr-1" /> {t("add_reminder")}
        </Button>
      </div>

      {nextReminder && (
        <Card className="border-teal-200 bg-teal-50 shadow-md">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <p className="text-sm font-bold text-teal-600 uppercase tracking-widest">{t("next_medication")}</p>
                <h2 className="text-2xl font-black">{nextReminder.memo || "Medication"}</h2>
                <p className="text-xl font-medium text-teal-700">{(nextReminder.remind_time || "").slice(0, 5)}</p>
              </div>
              <Button onClick={() => handleConfirm(nextReminder)} className="h-14 w-14 rounded-2xl bg-teal-600 shadow-lg">
                <Check className="w-8 h-8 text-white" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-5 space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <h4 className="font-bold">{t("today_progress")}</h4>
              <span className="text-sm font-bold text-teal-600">2 / 3</span>
            </div>
            <Progress value={66} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="bg-blue-50 p-4 rounded-2xl flex flex-col gap-2 relative">
              <Droplets className="w-5 h-5 text-blue-500" />
              <p className="text-xs font-bold text-blue-700 uppercase">{t("water_reminder")}</p>
              <p className="text-lg font-black">{waterCount} / 8</p>
              <button 
                onClick={() => { setWaterCount(prev => prev + 1); toast.success(t("success")); }}
                className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center text-blue-600 font-bold"
              >
                +
              </button>
            </div>
            <div className="bg-orange-50 p-4 rounded-2xl flex flex-col gap-2">
              <Footprints className="w-5 h-5 text-orange-500" />
              <p className="text-xs font-bold text-orange-700 uppercase">{t("steps_count")}</p>
              <p className="text-lg font-black">{steps.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {loading ? <SkeletonCard count={2} /> : reminders.map(r => (
          <ReminderCard 
            key={r.id} 
            reminder={r} 
            isDue={(r.remind_time || "").slice(0, 5) === currentTime} 
            onConfirm={handleConfirm} 
          />
        ))}
      </div>

      <ReminderModal open={modalOpen} onOpenChange={setModalOpen} onSave={handleSaveReminder} saving={saving} />
    </div>
  );
}