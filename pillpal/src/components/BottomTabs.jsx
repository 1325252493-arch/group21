import { Link, useLocation } from 'react-router-dom';
import { Bell, Activity, Heart, Smile, Wind, ClipboardList } from 'lucide-react';
import { useT } from '@/lib/LanguageContext';
import { cn } from '@/lib/utils';

// Define the navigation tabs
const tabs = [
 { path: '/', icon: Bell, labelKey: 'tab_normal' },
 { path: '/diabetes', icon: Activity, labelKey: 'tab_diabetes' },
 { path: '/heart', icon: Heart, labelKey: 'tab_heart' },
 { path: '/mood', icon: Smile, labelKey: 'tab_mood' },
 { path: '/respiratory', icon: Wind, labelKey: 'tab_respiratory' },
 { path: '/general', icon: ClipboardList, labelKey: 'tab_general' }, // This leads to Other.jsx
];

export default function BottomTabs() {
 const location = useLocation();
 const t = useT();

 return (
 <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border safe-area-bottom">
 <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1">
 {tabs.map((tab) => {
 // Check if current path matches or starts with the tab path (for sub-pages like /disease/:id)
 const isActive = location.pathname === tab.path || (tab.path !== '/' && location.pathname.startsWith(tab.path));
 const Icon = tab.icon;
 
 return (
 <Link
 key={tab.path}
 to={tab.path}
 className={cn(
 "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
 isActive ? "text-teal-600" : "text-muted-foreground"
 )}
 >
 <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} />
 <span className={cn(
 "text-[10px] font-medium leading-none",
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