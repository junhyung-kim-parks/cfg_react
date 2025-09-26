import { TopHeader } from './components/layout/TopHeader';
import { Sidebar } from './components/layout/Sidebar';
import { HomePage } from './pages/HomePage';

export default function SimpleApp() {
  console.log('SimpleApp: Rendering simple app without router...');
  
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopHeader />
        <main className="flex-1 overflow-auto">
          <HomePage />
        </main>
      </div>
    </div>
  );
}