import React, { useState, useEffect, useCallback } from "react";
import { Users, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { useT } from "@/lib/LanguageContext";
import { useSettings } from "@/lib/SettingsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function FamilySection() {
  const { userId } = useAuth();
  const { isLarge } = useSettings();
  const t = useT();

  const [relatives, setRelatives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRelative, setEditingRelative] = useState(null);
  const [formData, setFormData] = useState({ name: "", phone: "" });
  const [saving, setSaving] = useState(false);

  const fetchRelatives = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("relatives")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      setRelatives(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchRelatives();
  }, [fetchRelatives]);

  const handleOpenModal = (rel = null) => {
    if (rel) {
      setEditingRelative(rel);
      setFormData({ name: rel.name, phone: rel.phone });
    } else {
      setEditingRelative(null);
      setFormData({ name: "", phone: "" });
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.phone) {
      toast.error(t("failed"));
      return;
    }
    setSaving(true);
    try {
      if (editingRelative) {
        const { error } = await supabase
          .from("relatives")
          .update({ name: formData.name, phone: formData.phone })
          .eq("id", editingRelative.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("relatives")
          .insert([{ ...formData, user_id: userId, relation_type: "Family" }]);
        if (error) throw error;
      }
      setModalOpen(false);
      fetchRelatives();
      toast.success(t("success"));
    } catch (e) {
      toast.error(t("failed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingRelative) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("relatives").delete().eq("id", editingRelative.id);
      if (error) throw error;
      setModalOpen(false);
      fetchRelatives();
      toast.success(t("success"));
    } catch (e) {
      toast.error(t("failed"));
    } finally {
      setSaving(false);
    }
  };

  if (isLarge) {
    return (
      <div className="mt-8 px-4 pb-12">
        <div className="bg-white rounded-[40px] p-8 border-4 border-border shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-10 h-10 text-teal-600" />
              <span className="text-3xl font-black">{t("my_relatives")}</span>
            </div>
            <Button onClick={() => handleOpenModal()} size="icon" className="h-16 w-16 rounded-full bg-teal-600">
              <Plus className="w-10 h-10" />
            </Button>
          </div>
          <div className="space-y-4">
            {relatives.map(r => (
              <div key={r.id} onClick={() => handleOpenModal(r)} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border-2 border-slate-100">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-3xl font-bold text-blue-600">{r.name[0]}</div>
                  <div>
                    <p className="text-3xl font-black">{r.name}</p>
                    <p className="text-xl text-slate-400 font-bold">{r.phone}</p>
                  </div>
                </div>
                <Pencil className="w-8 h-8 text-slate-300" />
              </div>
            ))}
          </div>
        </div>
        <RelativeModal open={modalOpen} setOpen={setModalOpen} formData={formData} setFormData={setFormData} onSave={handleSave} onDelete={handleDelete} saving={saving} editing={!!editingRelative} t={t} />
      </div>
    );
  }

  return (
    <div className="mt-6 px-4 pb-8 border-t pt-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-bold flex items-center gap-2"><Users className="w-4 h-4 text-teal-600" /> {t("my_relatives")}</h4>
        <Button onClick={() => handleOpenModal()} variant="ghost" size="sm" className="text-teal-600 h-auto p-0"><Plus className="w-4 h-4 mr-1" /> {t("add_relative")}</Button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {relatives.map(r => (
          <div key={r.id} onClick={() => handleOpenModal(r)} className="flex-shrink-0 w-24 bg-white border rounded-2xl p-3 flex flex-col items-center gap-1 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-sm font-bold text-teal-600">{r.name[0]}</div>
            <p className="text-[10px] font-bold truncate w-full text-center">{r.name}</p>
          </div>
        ))}
      </div>
      <RelativeModal open={modalOpen} setOpen={setModalOpen} formData={formData} setFormData={setFormData} onSave={handleSave} onDelete={handleDelete} saving={saving} editing={!!editingRelative} t={t} />
    </div>
  );
}

function RelativeModal({ open, setOpen, formData, setFormData, onSave, onDelete, saving, editing, t }) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm mx-auto rounded-3xl p-6">
        <DialogHeader><DialogTitle className="text-2xl font-black">{t("manage_relatives")}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-500 uppercase ml-1">{t("relative_name")}</label>
            <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-14 text-lg rounded-2xl" placeholder={t("relative_name")} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-500 uppercase ml-1">{t("relative_phone")}</label>
            <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="h-14 text-lg rounded-2xl" placeholder={t("relative_phone")} />
          </div>
        </div>
        <DialogFooter className="flex flex-col gap-3">
          <Button onClick={onSave} disabled={saving} className="w-full h-14 text-xl font-black bg-teal-600 rounded-2xl">
            {saving ? <Loader2 className="animate-spin" /> : t("save")}
          </Button>
          {editing && (
            <Button onClick={onDelete} disabled={saving} variant="outline" className="w-full h-14 text-xl font-black text-red-500 border-red-100 rounded-2xl">
              <Trash2 className="w-6 h-6 mr-2" /> {t("delete")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}