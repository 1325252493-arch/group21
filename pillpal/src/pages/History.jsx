import { useState, useEffect, useCallback } from "react";
import { supabase, assertNoSupabaseError } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { t } from "@/lib/i18n";
import EventCard from "@/components/EventCard";
import SkeletonCard from "@/components/SkeletonCard";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const filterTypes = ["all", "confirmed_by_device", "confirmed_by_app", "pill_taken", "heartbeat"];

export default function History() {
  const { userId } = useAuth();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const res = await supabase
        .from("pill_event")
        .select("id,user_id,event_time,voltage,event_type,memo")
        .eq("user_id", userId)
        .order("event_time", { ascending: false })
        .limit(100);

      assertNoSupabaseError(res);
      setEvents(res.data || []);
    } catch (e) {
      toast.error(e?.message || "Failed to load events");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  const filtered = filter === "all" ? events : events.filter((e) => e.event_type === filter);

  const getChipLabel = (type) => {
    if (type === "all") return t("all");
    return t(type) || type;
  };

  return (
    <div className="px-4 pt-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-foreground">{t("history")}</h1>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          className="h-12 w-12 rounded-xl"
          disabled={refreshing}
        >
          <RefreshCw className={cn("w-5 h-5", refreshing && "animate-spin")} />
        </Button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        {filterTypes.map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={cn(
              "whitespace-nowrap px-4 py-2 rounded-full text-base font-medium transition-colors shrink-0",
              filter === type ? "bg-teal-600 text-white" : "bg-white text-foreground border border-border hover:bg-muted"
            )}
          >
            {getChipLabel(type)}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonCard count={4} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-xl text-muted-foreground">{t("no_events")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}