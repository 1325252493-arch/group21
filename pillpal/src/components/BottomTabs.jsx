import { Link, useLocation } from 'react-router-dom';
import { Bell, Clock, Cpu, User } from 'lucide-react';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const tabs = [
  { path: '/', icon: Bell, labelKey: 'reminders' },
  { path: '/history', icon: Clock, labelKey: 'history' },
  { path: '/device', icon: Cpu, labelKey: 'device' },
  { path: '/profile', icon: User, labelKey: 'profile' },
];

export default function BottomTabs() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors",
                isActive ? "text-teal-600" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("w-6 h-6", isActive && "stroke-[2.5]")} />
              <span className={cn(
                "text-sm font-medium",
                isActive && "font-semibold"
              )}>
                {t(tab.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}