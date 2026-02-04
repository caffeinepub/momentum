import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import TaskManager from './pages/TaskManager';
import OfflineIndicator from './components/OfflineIndicator';

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TaskManager />
      <Toaster />
      <OfflineIndicator />
    </ThemeProvider>
  );
}
