import { useState } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import TaskManager from './pages/TaskManager';
import AdminDashboard from './pages/AdminDashboard';
import OfflineIndicator from './components/OfflineIndicator';

type AppView = 'main' | 'admin';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('main');

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {currentView === 'main' && (
        <TaskManager onOpenAdminDashboard={() => setCurrentView('admin')} />
      )}
      {currentView === 'admin' && (
        <AdminDashboard onBack={() => setCurrentView('main')} />
      )}
      <Toaster />
      <OfflineIndicator />
    </ThemeProvider>
  );
}
