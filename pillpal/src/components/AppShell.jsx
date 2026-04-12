import { Outlet } from 'react-router-dom';
import BottomTabs from '@/components/BottomTabs';

export default function AppShell() {
  return (
    <div className="min-h-screen bg-muted/50 max-w-lg mx-auto relative">
      <main className="pb-20">
        <Outlet />
      </main>
      <BottomTabs />
    </div>
  );
}