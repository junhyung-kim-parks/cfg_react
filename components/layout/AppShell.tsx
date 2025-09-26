import { Outlet } from 'react-router-dom';
import { TopHeader } from './TopHeader';
import { RouteSidebar } from './RouteSidebar';

export function AppShell() {
  console.log('AppShell: Rendering app shell...');
  
  return (
    <div className="min-h-screen bg-background flex">
      <RouteSidebar />
      <div className="flex-1 flex flex-col">
        <TopHeader />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}