import React, { useState, useEffect, useCallback } from "react";
import { Plus, ChevronRight, Stethoscope, Loader2 } from "lucide-react";
import { useT } from "@/lib/LanguageContext";
import { useSettings } from "@/lib/SettingsContext";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function Other() {
  const t = useT();
  const { isLarge } = useSettings();
  const { userId } = useAuth();
  const nav = useNavigate();

  const [diseases, setDiseases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Fetch all custom diseases for this user
  const fetchDiseases = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("custom_diseases")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setDiseases(data || []);
    } catch (e) {
      console.error(e);
      toast.error(t("failed"));
    } finally {
      setLoading(false);
    }
  }, [userId, t]);

  useEffect(() => {
    fetchDiseases();
  }, [fetchDiseases]);

  // Handle adding a new disease type
  const handleAddDisease = async () => {
    if (!userId || !newName.trim()) return;
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from("custom_diseases")
        .insert([{ 
          user_id: userId, 
          name: newName.trim(),
          icon: "💊" // Default icon
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success(t("success"));
      setNewName("");
      setModalOpen(false);
      
      if (data) nav(`/disease/${data.id}`);
    } catch (e) {
      toast.error(t("failed"));
    } finally {
      setIsSaving(false);
    }
  };

  // Shared Header Section
  const Header = () => (
    <div className="flex justify-between items-center mb-6">
      <h1 className={cn("font-black text-teal-700 flex items-center gap-3", isLarge ? "text-4xl" : "text-2xl")}>
        <Stethoscope className={isLarge ? "w-10 h-10" : "w-6 h-6"} /> 
        {t('tab_general')}
      </h1>
      <Button 
        onClick={() => setModalOpen(true)} 
        size={isLarge ? "icon" : "sm"} 
        className={cn("bg-teal-600 text-white shadow-lg", isLarge ? "h-16 w-16 rounded-full" : "rounded-xl")}
      >
        <Plus className={isLarge ? "w-10 h-10" : "w-4 h-4"} />
        {!isLarge && <span className="ml-1">{t('add_disease')}</span>}
      </Button>
    </div>
  );

  return (
    <div className={cn("px-4 pt-4 pb-24 space-y-6", isLarge && "text-center")}>
      <Header />

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin w-10 h-10 text-teal-600" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {diseases.map((disease) => (
            <Card 
              key={disease.id} 
              onClick={() => nav(`/disease/${disease.id}`)}
              className={cn(
                "cursor-pointer transition-all hover:ring-4 hover:ring-teal-500/20 active:scale-[0.98]",
                isLarge ? "rounded-[40px] border-4 p-4" : "rounded-2xl"
              )}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn("bg-teal-50 rounded-2xl flex items-center justify-center", isLarge ? "w-24 h-24 text-5xl" : "w-12 h-12 text-2xl")}>
                    {disease.icon || '💊'}
                  </div>
                  <div className="text-left">
                    <p className={cn("font-black text-slate-900", isLarge ? "text-4xl" : "text-lg")}>{disease.name}</p>
                    <p className={cn("text-slate-400 font-bold", isLarge ? "text-xl" : "text-xs")}>{t('basic_info')}</p>
                  </div>
                </div>
                <ChevronRight className={cn("text-slate-300", isLarge ? "w-10 h-10" : "w-5 h-5")} />
              </CardContent>
            </Card>
          ))}

          {diseases.length === 0 && (
            <div className={cn("py-20 border-4 border-dashed border-slate-200 rounded-[40px] text-slate-400 font-bold", isLarge ? "text-3xl" : "text-sm")}>
              {t('no_data')}
            </div>
          )}
        </div>
      )}

      {/* Add Disease Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className={cn("max-w-sm mx-auto", isLarge ? "rounded-[40px] p-8" : "rounded-2xl")}>
          <DialogHeader>
            <DialogTitle className={cn("font-black", isLarge ? "text-3xl" : "text-xl")}>{t('add_disease')}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input 
              value={newName} 
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t('disease_name')}
              className={cn("font-bold", isLarge ? "h-20 text-2xl rounded-2xl border-4" : "h-12 rounded-xl")}
            />
          </div>
          <DialogFooter>
            <Button 
              onClick={handleAddDisease} 
              disabled={isSaving} 
              className={cn("w-full bg-teal-600 text-white font-black shadow-lg", isLarge ? "h-20 text-2xl rounded-2xl" : "h-12 rounded-xl")}
            >
              {isSaving ? <Loader2 className="animate-spin" /> : t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Utility to handle class merging
function cn(...inputs) {
  return inputs.filter(Boolean).join(" ");
}