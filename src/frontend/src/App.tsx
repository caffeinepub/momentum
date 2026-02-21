import { useState } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import TaskManager from './pages/TaskManager';
import AdminDashboard from './pages/AdminDashboard';
import OfflineIndicator from './components/OfflineIndicator';

type View = 'main' | 'admin';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('main');

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <OfflineIndicator />
      {currentView === 'main' ? (
        <TaskManager onOpenAdminDashboard={() => setCurrentView('admin')} />
      ) : (
        <AdminDashboard onBack={() => setCurrentView('main')} />
      )}
      <Toaster />
    </ThemeProvider>
  );
}
