import { useState, useEffect, useCallback, useRef } from "react";
import { supabase, assertNoSupabaseError } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import ReminderCard from "@/components/ReminderCard";
import ReminderModal from "@/components/ReminderModal";
import SkeletonCard from "@/components/SkeletonCard";

const toTimeHHMMSS = (v) => {
  // Accept "HH:MM" or "HH:MM:SS" and normalize to "HH:MM:00"
  if (!v) return null;
  const s = String(v).trim();
  if (/^\d{2}:\d{2}:\d{2}$/.test(s)) return s;
  if (/^\d{2}:\d{2}$/.test(s)) return `${s}:00`;
  // fallback: try first 5 chars
  const hhmm = s.slice(0, 5);
  if (/^\d{2}:\d{2}$/.test(hhmm)) return `${hhmm}:00`;
  return null;
};

export default function Reminders() {
  const { userId } = useAuth();

  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const [currentTime, setCurrentTime] = useState("");
  const alertedIds = useRef(new Set());

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
      toast.error(e?.message || "Failed to load reminders");
      setReminders([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  // Due highlight: update current time every 10 seconds
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

  // Toast for due reminders (once per reminder per session)
  useEffect(() => {
    if (!currentTime) return;
    reminders.forEach((r) => {
      const rTime = (r.remind_time || "").slice(0, 5);
      if (rTime === currentTime && !alertedIds.current.has(r.id)) {
        alertedIds.current.add(r.id);
        toast.warning(`${rTime} — ${r.memo || t("reminder_due")}`);
      }
    });
  }, [currentTime, reminders]);

  const handleSave = async (data) => {
    if (!userId) return;
    setSaving(true);

    try {
      const remind_time = toTimeHHMMSS(data?.remind_time);
      if (!remind_time) throw new Error("Invalid time format");

      const memo = (data?.memo || "").trim();

      if (editingReminder) {
        const res = await supabase
          .from("medication_reminders")
          .update({ remind_time, memo })
          .eq("id", editingReminder.id)
          .eq("user_id", userId)
          .select("id")
          .limit(1);

        assertNoSupabaseError(res);
        toast.success(t("reminder_updated"));
      } else {
        const res = await supabase
          .from("medication_reminders")
          .insert({
            user_id: userId,
            remind_time,
            memo,
            is_active: true,
          })
          .select("id")
          .limit(1);

        assertNoSupabaseError(res);
        toast.success(t("reminder_added"));
      }

      setModalOpen(false);
      setEditingReminder(null);
      fetchReminders();
    } catch (e) {
      toast.error(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async (reminder) => {
    if (!userId) return;

    try {
      const rTime = (reminder.remind_time || "").slice(0, 5);

      // 1) Insert pill_event
      const evRes = await supabase
        .from("pill_event")
        .insert({
          user_id: userId,
          event_time: new Date().toISOString(),
          event_type: "confirmed_by_app",
          memo: `confirmed reminder ${reminder.id}: ${rTime} ${reminder.memo || ""}`.trim(),
        })
        .select("id")
        .limit(1);

      assertNoSupabaseError(evRes);

      // 2) Deactivate reminder
      const updRes = await supabase
        .from("medication_reminders")
        .update({ is_active: false })
        .eq("id", reminder.id)
        .eq("user_id", userId);

      assertNoSupabaseError(updRes);

      toast.success(t("reminder_confirmed"));
      fetchReminders();
    } catch (e) {
      toast.error(e?.message || "Confirm failed");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !userId) return;

    try {
      const delRes = await supabase
        .from("medication_reminders")
        .delete()
        .eq("id", deleteTarget.id)
        .eq("user_id", userId);

      assertNoSupabaseError(delRes);

      toast.success(t("reminder_deleted"));
      setDeleteTarget(null);
      fetchReminders();
    } catch (e) {
      toast.error(e?.message || "Delete failed");
    }
  };

  const openEdit = (reminder) => {
    setEditingReminder(reminder);
    setModalOpen(true);
  };

  const openAdd = () => {
    setEditingReminder(null);
    setModalOpen(true);
  };

  return (
    <div className="px-4 pt-4 pb-24">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-foreground">{t("reminders")}</h1>
        <Button onClick={openAdd} className="h-12 px-5 text-lg bg-teal-600 hover:bg-teal-700 rounded-xl">
          <Plus className="w-5 h-5 mr-1" />
          {t("add_reminder")}
        </Button>
      </div>

      {loading ? (
        <SkeletonCard count={3} />
      ) : reminders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-xl text-muted-foreground">{t("no_reminders")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.map((r) => {
            const rTime = (r.remind_time || "").slice(0, 5);
            const isDue = rTime === currentTime;
            return (
              <ReminderCard
                key={r.id}
                reminder={r}
                isDue={isDue}
                onEdit={openEdit}
                onConfirm={handleConfirm}
                onDelete={setDeleteTarget}
              />
            );
          })}
        </div>
      )}

      <ReminderModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        reminder={editingReminder}
        onSave={handleSave}
        saving={saving}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">{t("delete_confirm_title")}</AlertDialogTitle>
            <AlertDialogDescription className="text-lg">{t("delete_confirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-12 text-lg">{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="h-12 text-lg bg-destructive hover:bg-destructive/90"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}