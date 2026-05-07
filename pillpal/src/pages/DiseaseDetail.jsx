import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Plus, Trash2, Clock, Activity, 
  Pill, Save, Loader2, Info 
} from "lucide-react";
import { useT } from "@/lib/LanguageContext";
import { useSettings } from "@/lib/SettingsContext";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function DiseaseDetail() {
  const { id: diseaseId } = useParams();
  const nav = useNavigate();
  const t = useT();
  const { isLarge } = useSettings();
  const { userId } = useAuth();

  const [disease, setDisease] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!userId || !diseaseId) return;
    setLoading(true);
    try {
      const { data: dData } = await supabase.from("custom_diseases").select("*").eq("id", diseaseId).single();
      setDisease(dData);

      const { data: mData } = await supabase.from("custom_metrics_config").select("*").eq("disease_id", diseaseId).order("created_at", { ascending: true });
      setMetrics(mData || []);

      const { data: rData } = await supabase.from("medication_reminders").select("*").eq("user_id", userId).ilike("memo", `%[${dData.name}]%`).eq("is_active", true);
      setReminders(rData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [userId, diseaseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddMetric = async () => {
    const { error } = await supabase.from("custom_metrics_config").insert([{ disease_id: diseaseId, label: t('default_metric_name'), unit: "-" }]);
    if (!error) fetchData();
  };

  const handleUpdateMetric = async (mId, field, value) => {
    await supabase.from("custom_metrics_config").update({ [field]: value }).eq("id", mId);
  };

  const handleDeleteMetric = async (mId) => {
    await supabase.from("custom_metrics_config").delete().eq("id", mId);
    fetchData();
  };

  const handleAddMed = async () => {
    if (!disease) return;
    const { error } = await supabase.from("medication_reminders").insert([{ 
      user_id: userId, 
      remind_time: "08:00:00", 
      memo: `[${disease.name}] ${t('default_med_name')}`,
      is_active: true 
    }]);
    if (!error) fetchData();
  };

  const handleUpdateMed = async (rId, field, value) => {
    await supabase.from("medication_reminders").update({ [field]: value }).eq("id", rId);
  };

  const handleDeleteMed = async (rId) => {
    await supabase.from("medication_reminders").delete().eq("id", rId);
    fetchData();
  };

  const handleDeleteDisease = async () => {
    await supabase.from("custom_diseases").delete().eq("id", diseaseId);
    toast.success(t("success"));
    nav("/general");
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className={cn("px-4 pt-4 pb-24 space-y-6", isLarge && "max-w-2xl mx-auto")}>
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => nav("/general")} className="gap-2">
          <ArrowLeft className="w-5 h-5" /> {t('back')}
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="w-4 h-4 mr-1" /> {t('delete')}
            </Button>
          </AlertDialogTrigger>
          {/* Modified: Added max-w-[320px] to shrink the dialog size */}
          <AlertDialogContent className="max-w-[320px] rounded-3xl p-6">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-center">{t('delete_confirm_title')}</AlertDialogTitle>
              <AlertDialogDescription className="text-center">
                {t('delete_confirm')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-col gap-2 mt-4">
              <AlertDialogAction onClick={handleDeleteDisease} className="w-full bg-red-600 rounded-xl h-12 order-1">
                {t('delete')}
              </AlertDialogAction>
              <AlertDialogCancel className="w-full mt-0 rounded-xl h-12 order-2 border-none bg-slate-100">
                {t('cancel')}
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <section className="space-y-4">
        <h2 className={cn("font-black flex items-center gap-2", isLarge ? "text-3xl" : "text-lg")}>
          <Info className="text-teal-600" /> {t('basic_info')}
        </h2>
        <Card className={cn(isLarge ? "rounded-[40px] border-4" : "rounded-2xl")}>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="text-5xl bg-teal-50 w-20 h-20 flex items-center justify-center rounded-3xl">
              {disease?.icon || '💊'}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t('disease_name')}</p>
              <h1 className={cn("font-black text-slate-900", isLarge ? "text-4xl" : "text-2xl")}>{disease?.name}</h1>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className={cn("font-black flex items-center gap-2", isLarge ? "text-3xl" : "text-lg")}>
            <Activity className="text-blue-500" /> {t('monitoring_metrics')}
          </h2>
          <Button onClick={handleAddMetric} size="sm" variant="outline" className="rounded-xl border-2">
            <Plus className="w-4 h-4 mr-1" /> {t('add_metric')}
          </Button>
        </div>
        <div className="space-y-3">
          {metrics.map((m) => (
            <Card key={m.id} className={cn(isLarge ? "rounded-[30px] border-2" : "rounded-xl shadow-none")}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <Input 
                    defaultValue={m.label} 
                    onBlur={(e) => handleUpdateMetric(m.id, 'label', e.target.value)}
                    placeholder={t('metric_name')}
                    className="h-10 text-sm font-bold bg-transparent"
                  />
                  <Input 
                    defaultValue={m.unit} 
                    onBlur={(e) => handleUpdateMetric(m.id, 'unit', e.target.value)}
                    placeholder={t('unit')}
                    className="h-10 text-sm bg-transparent"
                  />
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteMetric(m.id)} className="text-red-400 hover:bg-red-50">
                  <Trash2 className="w-5 h-5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className={cn("font-black flex items-center gap-2", isLarge ? "text-3xl" : "text-lg")}>
            <Pill className="text-orange-500" /> {t('common_meds')}
          </h2>
          <Button onClick={handleAddMed} size="sm" variant="outline" className="rounded-xl border-2">
            <Plus className="w-4 h-4 mr-1" /> {t('add_med')}
          </Button>
        </div>
        <div className="space-y-3">
          {reminders.map((r) => (
            <Card key={r.id} className={cn(isLarge ? "rounded-[30px] border-2" : "rounded-xl shadow-none")}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex-1 space-y-2">
                  <Input 
                    defaultValue={r.memo.replace(`[${disease.name}] `, "")} 
                    onBlur={(e) => handleUpdateMed(r.id, 'memo', `[${disease.name}] ${e.target.value}`)}
                    placeholder={t('med_name')}
                    className="h-10 text-sm font-bold bg-transparent"
                  />
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <Input 
                      type="time"
                      defaultValue={r.remind_time.slice(0, 5)} 
                      onBlur={(e) => handleUpdateMed(r.id, 'remind_time', e.target.value)}
                      className="h-8 w-32 text-xs bg-slate-50 border-none"
                    />
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteMed(r.id)} className="text-red-400 hover:bg-red-50">
                  <Trash2 className="w-5 h-5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="pt-6">
         <p className="text-center text-slate-400 text-[10px] italic flex items-center justify-center gap-1">
           <Save className="w-3 h-3" /> {t('auto_save_hint')}
         </p>
      </div>
    </div>
  );
}