import { Outlet } from 'react-router-dom';
import BottomTabs from '@/components/BottomTabs';
import TopHeader from '@/components/TopHeader';
import FamilySection from '@/components/FamilySection';

export default function AppShell() {
  return (
    <div className="min-h-screen bg-muted/50 max-w-lg mx-auto relative flex flex-col">
      <TopHeader />
      
      <main className="flex-1 pb-24">
        <Outlet />
        {/* The FamilySection is now global and synced across all pages */}
        <FamilySection />
      </main>
      
      <BottomTabs />
    </div>
  );
}