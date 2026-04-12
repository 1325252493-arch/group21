import { useState, useEffect, useCallback } from "react";
import { supabase, assertNoSupabaseError } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Cpu, CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import moment from "moment";
import { useAuth } from "@/lib/AuthContext";
import { appParams } from "@/lib/app-params";

export default function Device() {
  const { userId } = useAuth();

  const [deviceId, setDeviceId] = useState(appParams.defaultDeviceId || "demo_device_01");

  const [binding, setBinding] = useState(null);
  const [lastEvent, setLastEvent] = useState(null);

  const [loading, setLoading] = useState(true);
  const [bindingLoading, setBindingLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!userId || !deviceId) return;
    setLoading(true);

    try {
      // 1) Get binding for this device_id
      const bindRes = await supabase
        .from("device_bindings")
        .select("device_id,user_id,bound_at")
        .eq("device_id", deviceId)
        .maybeSingle();

      assertNoSupabaseError(bindRes);
      setBinding(bindRes.data || null);

      // 2) Get last event for this user
      const evRes = await supabase
        .from("pill_event")
        .select("id,user_id,event_time,voltage,event_type,memo")
        .eq("user_id", userId)
        .order("event_time", { ascending: false })
        .limit(1);

      assertNoSupabaseError(evRes);
      setLastEvent(evRes.data?.[0] || null);
    } catch (e) {
      toast.error(e?.message || "Failed to load device status");
      setBinding(null);
      setLastEvent(null);
    } finally {
      setLoading(false);
    }
  }, [userId, deviceId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleBind = async () => {
    if (!userId || !deviceId) return;

    setBindingLoading(true);
    try {
      const upsertRes = await supabase
        .from("device_bindings")
        .upsert(
          {
            device_id: deviceId,
            user_id: userId,
            // bound_at has default now() in DB; we can omit it
          },
          { onConflict: "device_id" }
        )
        .select("device_id,user_id,bound_at")
        .maybeSingle();

      assertNoSupabaseError(upsertRes);

      toast.success(t("device_bound"));
      setBinding(upsertRes.data || null);
      await fetchStatus();
    } catch (e) {
      toast.error(e?.message || "Bind failed");
    } finally {
      setBindingLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStatus();
    setRefreshing(false);
  };

  const getBindingStatus = () => {
    if (!binding) return { label: t("not_bound"), icon: XCircle, color: "text-muted-foreground" };
    if (binding.user_id === userId) return { label: t("bound_to_you"), icon: CheckCircle, color: "text-teal-600" };
    return { label: t("bound_to_another"), icon: AlertTriangle, color: "text-amber-600" };
  };

  const status = getBindingStatus();
  const StatusIcon = status.icon;

  return (
    <div className="px-4 pt-4 pb-24">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-foreground">{t("device")}</h1>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          className="h-12 w-12 rounded-xl"
          disabled={refreshing}
          title={t("refresh") || "Refresh"}
        >
          <RefreshCw className={cn("w-5 h-5", refreshing && "animate-spin")} />
        </Button>
      </div>

      {/* Device ID */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-border mb-4">
        <Label className="text-lg font-medium mb-2 block">{t("device_id")}</Label>
        <Input value={deviceId} onChange={(e) => setDeviceId(e.target.value)} className="h-14 text-lg mb-4" />
        <Button
          onClick={handleBind}
          disabled={bindingLoading || !deviceId || !userId}
          className="w-full h-12 text-lg bg-teal-600 hover:bg-teal-700 rounded-xl"
        >
          {bindingLoading ? t("loading") : t("bind_device")}
        </Button>
      </div>

      {/* Binding Status */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-border mb-4">
        <h2 className="text-xl font-semibold mb-3">{t("binding_status")}</h2>
        {loading ? (
          <div className="h-8 bg-muted animate-pulse rounded-lg" />
        ) : (
          <div className="flex items-center gap-3">
            <StatusIcon className={cn("w-7 h-7", status.color)} />
            <span className={cn("text-lg font-medium", status.color)}>{status.label}</span>
          </div>
        )}
      </div>

      {/* Last Activity */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-border mb-4">
        <h2 className="text-xl font-semibold mb-3">{t("last_activity")}</h2>
        {loading ? (
          <div className="space-y-2">
            <div className="h-5 bg-muted animate-pulse rounded w-3/4" />
            <div className="h-5 bg-muted animate-pulse rounded w-1/2" />
          </div>
        ) : lastEvent ? (
          <div className="space-y-1">
            <p className="text-lg">
              <span className="text-muted-foreground">{t("event_type")}: </span>
              <span className="font-medium">{t(lastEvent.event_type) || lastEvent.event_type}</span>
            </p>
            <p className="text-lg">
              <span className="text-muted-foreground">{t("event_time")}: </span>
              <span className="font-medium">{moment(lastEvent.event_time).format("YYYY-MM-DD HH:mm")}</span>
            </p>
            {lastEvent.voltage != null && (
              <p className="text-lg">
                <span className="text-muted-foreground">{t("voltage")}: </span>
                <span className="font-medium">{lastEvent.voltage}V</span>
              </p>
            )}
          </div>
        ) : (
          <p className="text-lg text-muted-foreground">{t("no_events")}</p>
        )}
      </div>

      {/* Explanation */}
      <div className="bg-teal-50 rounded-2xl p-5 border border-teal-200">
        <div className="flex gap-3">
          <Cpu className="w-6 h-6 text-teal-600 shrink-0 mt-0.5" />
          <p className="text-base text-teal-800 leading-relaxed">{t("device_explanation")}</p>
        </div>
      </div>
    </div>
  );
}