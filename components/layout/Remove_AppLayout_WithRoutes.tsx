import { Routes, Route } from 'react-router-dom';
import { TopHeader } from './TopHeader';
import { Sidebar } from './Sidebar';
import { HomePage } from '../../pages/HomePage';
import { FormsPage } from '../../pages/FormsPage';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopHeader />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/forms" element={<FormsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}