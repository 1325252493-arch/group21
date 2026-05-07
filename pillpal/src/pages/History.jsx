import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { useT, useLang } from "@/lib/LanguageContext";
import { Button } from "@/components/ui/button";
import { RefreshCw, Bell, Activity, Phone, Droplet, Heart, Wind } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import moment from "moment";
import "moment/locale/zh-cn";

export default function History() {
  const { userId } = useAuth();
  const t = useT();
  const { lang } = useLang();

  const [activeTab, setActiveTab] = useState("reminders");
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    moment.locale(lang === "zh" ? "zh-cn" : "en");
  }, [lang]);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      if (activeTab === "reminders") {
        const { data, error } = await supabase
          .from("pill_event")
          .select("id, event_time, event_type, memo")
          .eq("user_id", userId)
          .in("event_type", ["confirmed_by_device", "confirmed_by_app", "emergency_call"])
          .order("event_time", { ascending: false })
          .limit(50);
        if (error) throw error;
        setReminders(data || []);
      } else {
        const { data, error } = await supabase
          .from("health_metrics")
          .select("id, metric_type, value_numeric, value_text, recorded_at")
          .eq("user_id", userId)
          .order("recorded_at", { ascending: false })
          .limit(100);
        if (error) throw error;

        // --- Logic to Merge BP Records ---
        const processedMetrics = [];
        const bpMap = new Map(); // Store BP by timestamp

        data.forEach(item => {
          const timeKey = moment(item.recorded_at).format("YYYY-MM-DD HH:mm:ss");
          
          if (item.metric_type === 'blood_pressure_sys' || item.metric_type === 'blood_pressure_dia') {
            if (!bpMap.has(timeKey)) {
              bpMap.set(timeKey, { 
                type: 'blood_pressure_combined', 
                recorded_at: item.recorded_at, 
                sys: null, 
                dia: null 
              });
            }
            const bpObj = bpMap.get(timeKey);
            if (item.metric_type === 'blood_pressure_sys') bpObj.sys = item.value_numeric;
            if (item.metric_type === 'blood_pressure_dia') bpObj.dia = item.value_numeric;
          } else {
            processedMetrics.push(item);
          }
        });

        // Add merged BP records back to the list
        bpMap.forEach(bp => processedMetrics.push(bp));
        
        // Final Sort by time
        processedMetrics.sort((a, b) => 
          new Date(b.recorded_at || b.event_time) - new Date(a.recorded_at || a.event_time)
        );

        setMetrics(processedMetrics);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [userId, activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  return (
    <div className="px-4 pt-4 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t("history")}</h1>
        <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={cn("w-5 h-5", refreshing && "animate-spin")} />
        </Button>
      </div>

      <div className="flex bg-slate-100 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab("reminders")}
          className={cn("flex-1 py-2 text-sm font-bold rounded-lg transition-all", activeTab === "reminders" ? "bg-white shadow-sm text-teal-600" : "text-slate-500")}
        >
          {t("history_reminders")}
        </button>
        <button
          onClick={() => setActiveTab("metrics")}
          className={cn("flex-1 py-2 text-sm font-bold rounded-lg transition-all", activeTab === "metrics" ? "bg-white shadow-sm text-teal-600" : "text-slate-500")}
        >
          {t("history_metrics")}
        </button>
      </div>

      {loading ? (
        <p className="text-center py-10 text-slate-400">{t("loading")}</p>
      ) : (
        <div className="space-y-3">
          {activeTab === "reminders" ? (
            reminders.length > 0 ? reminders.map(r => (
              <ReminderEventCard key={r.id} event={r} t={t} />
            )) : <NoData t={t} />
          ) : (
            metrics.length > 0 ? metrics.map((m, idx) => (
              <MetricEventCard key={m.id || idx} metric={m} t={t} />
            )) : <NoData t={t} />
          )}
        </div>
      )}
    </div>
  );
}

function ReminderEventCard({ event, t }) {
  const isEmergency = event.event_type === "emergency_call";
  return (
    <Card className={cn("border-l-4", isEmergency ? "border-l-red-500" : "border-l-teal-500")}>
      <CardContent className="p-4 flex items-start gap-3">
        <div className={cn("p-2 rounded-lg", isEmergency ? "bg-red-50 text-red-600" : "bg-teal-50 text-teal-600")}>
          {isEmergency ? <Phone className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold">{t(event.event_type)}</p>
          <p className="text-xs text-slate-500">{moment(event.event_time).format("MMM DD, HH:mm")}</p>
          {event.memo && <p className="text-sm text-slate-700 mt-1">{event.memo}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function MetricEventCard({ metric, t }) {
  const getIcon = () => {
    switch(metric.metric_type || metric.type) {
      case 'blood_sugar': return <Droplet className="w-5 h-5 text-red-500" />;
      case 'blood_pressure_combined': return <Heart className="w-5 h-5 text-rose-500" />;
      case 'pef': return <Wind className="w-5 h-5 text-blue-500" />;
      default: return <Activity className="w-5 h-5 text-slate-500" />;
    }
  };

  const getLabel = () => {
    if (metric.type === 'blood_pressure_combined') return t('blood_pressure_combined');
    return t(metric.metric_type) || metric.metric_type;
  };

  const getValue = () => {
    if (metric.type === 'blood_pressure_combined') {
        return (
            <div className="text-right">
                <div className="text-lg font-black text-slate-900">{metric.sys}/{metric.dia} <span className="text-[10px] font-normal text-slate-400">{t('bp_unit')}</span></div>
                <div className="text-[9px] text-slate-400 font-bold uppercase">{t('sys_label')} / {t('dia_label')}</div>
            </div>
        );
    }
    if (metric.value_numeric) {
        const unit = metric.metric_type === 'blood_sugar' ? ' mmol/L' : metric.metric_type === 'pef' ? ' L/min' : '';
        return <div className="text-lg font-black text-slate-900">{metric.value_numeric}{unit}</div>;
    }
    return <div className="text-lg font-black text-slate-900">{metric.value_text || '—'}</div>;
  };

  return (
    <Card className="border-l-4 border-l-blue-400">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-50 rounded-lg">{getIcon()}</div>
          <div>
            <p className="text-sm font-bold">{getLabel()}</p>
            <p className="text-[10px] text-slate-400">{moment(metric.recorded_at).format("MMM DD, HH:mm")}</p>
          </div>
        </div>
        {getValue()}
      </CardContent>
    </Card>
  );
}

function NoData({ t }) {
  return <div className="text-center py-20 text-slate-400">{t("no_events")}</div>;
}