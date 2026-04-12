import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Globe } from "lucide-react";
import { t, getLang, setLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";

export default function Profile() {
  const nav = useNavigate();
  const { userId, phone, logout } = useAuth();

  const [currentLang, setCurrentLang] = useState(getLang());

  const avatarLetter = useMemo(() => {
    const s = (phone || "").trim();
    return s ? s[0] : "?";
  }, [phone]);

  const toggleLang = (next) => {
    if (next === currentLang) return;
    setLang(next);
    setCurrentLang(next);
    // simplest reliable approach: refresh once so all components re-read t()
    window.location.reload();
  };

  const handleLogout = () => {
    logout();
    nav("/login", { replace: true });
  };

  return (
    <div className="px-4 pt-4 pb-24">
      <h1 className="text-2xl font-bold text-foreground mb-5">{t("profile")}</h1>

      {/* User Info */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-border mb-4">
        <div className="flex items-center gap-4 mb-5">
          <div className="h-16 w-16 rounded-full bg-teal-100 flex items-center justify-center">
            <span className="text-2xl font-bold text-teal-700">{avatarLetter}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xl font-semibold text-foreground truncate">{phone || "—"}</p>
            <p className="text-base text-muted-foreground truncate">{t("phone_number")}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center py-2">
            <span className="text-lg text-muted-foreground">{t("phone")}</span>
            <span className="text-lg font-medium text-foreground">{phone || "—"}</span>
          </div>

          <div className="flex justify-between items-center py-2">
            <span className="text-lg text-muted-foreground">{t("user_id")}</span>
            <span className="text-sm font-mono text-muted-foreground truncate max-w-[180px]">{userId || "—"}</span>
          </div>
        </div>
      </div>

      {/* Language Toggle */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-border mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-6 h-6 text-teal-600" />
            <span className="text-lg font-medium">{t("language")}</span>
          </div>

          <div className="flex bg-muted rounded-xl overflow-hidden">
            <button
              onClick={() => toggleLang("en")}
              className={cn(
                "px-5 py-2.5 text-base font-medium transition-colors",
                currentLang === "en" ? "bg-teal-600 text-white" : "text-foreground"
              )}
            >
              EN
            </button>
            <button
              onClick={() => toggleLang("zh")}
              className={cn(
                "px-5 py-2.5 text-base font-medium transition-colors",
                currentLang === "zh" ? "bg-teal-600 text-white" : "text-foreground"
              )}
            >
              中文
            </button>
          </div>
        </div>
      </div>

      {/* Logout */}
      <Button
        onClick={handleLogout}
        variant="outline"
        className="w-full h-14 text-lg rounded-xl border-destructive text-destructive hover:bg-destructive/5"
      >
        <LogOut className="w-5 h-5 mr-2" />
        {t("logout")}
      </Button>
    </div>
  );
}