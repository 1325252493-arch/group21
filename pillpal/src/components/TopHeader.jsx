import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, Globe } from 'lucide-react';
import { useLang, useT } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { useSettings } from '@/lib/SettingsContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  FONT_SCALE_LARGE, 
  FONT_SCALE_NORMAL, 
  updateUserSettings 
} from '@/api/userSettings';

export default function TopHeader() {
  const navigate = useNavigate();
  const t = useT();
  const { userId } = useAuth();
  const { isLarge, updateFontScale } = useSettings();
  const { lang, setLang } = useLang();

  const handleModeChange = async (mode) => {
    const nextScale = mode === "elderly" ? FONT_SCALE_LARGE : FONT_SCALE_NORMAL;
    updateFontScale(nextScale);
    if (userId) {
      try {
        await updateUserSettings(userId, { font_scale: nextScale });
      } catch (e) {
        console.error("Failed to save font settings", e);
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between h-16 max-w-lg mx-auto px-4">
        {/* Mode Toggle Group */}
        <div className="flex bg-muted rounded-lg p-1">
          <button
            onClick={() => handleModeChange("elderly")}
            className={cn(
              "px-3 py-1.5 text-[10px] font-semibold rounded-md transition-all",
              isLarge ? "bg-white shadow-sm text-teal-600" : "text-muted-foreground"
            )}
          >
            {t('large')}
          </button>
          <button
            onClick={() => handleModeChange("standard")}
            className={cn(
              "px-3 py-1.5 text-[10px] font-semibold rounded-md transition-all",
              !isLarge ? "bg-white shadow-sm text-teal-600" : "text-muted-foreground"
            )}
          >
            {t('normal')}
          </button>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-1">
          {/* Language Switcher */}
          <div className="flex bg-slate-100 rounded-lg p-1 mr-1">
            <button 
              onClick={() => setLang("en")} 
              className={cn("px-2 py-1 text-[10px] font-bold rounded-md transition-all", lang === "en" ? "bg-white shadow-sm text-teal-600" : "text-slate-400")}
            >
              EN
            </button>
            <button 
              onClick={() => setLang("zh")} 
              className={cn("px-2 py-1 text-[10px] font-bold rounded-md transition-all", lang === "zh" ? "bg-white shadow-sm text-teal-600" : "text-slate-400")}
            >
              中
            </button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="text-slate-600 relative h-10 w-10"
            onClick={() => navigate('/history')}
            title={t('history')}
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-600 h-10 w-10"
            onClick={() => navigate('/profile')}
            title={t('profile')}
          >
            <User className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}