import { Calendar, Moon, Sun, Shield, User } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import TestDatePicker from './TestDatePicker';
import { toast } from 'sonner';

interface HeaderProps {
  testDate?: Date | null;
  onOpenAdminDashboard?: () => void;
  onOpenUserInfo?: () => void;
  onResetNewDay?: () => void;
  isResetting?: boolean;
  onTestDateChange?: (date: Date | null) => void;
}

export default function Header({ 
  testDate, 
  onOpenAdminDashboard, 
  onOpenUserInfo,
  onResetNewDay,
  isResetting = false,
  onTestDateChange
}: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: userProfile } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const displayDate = testDate || new Date();
  const formattedDate = displayDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleResetClick = () => {
    if (onResetNewDay) {
      onResetNewDay();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <img src="/assets/Momentum.png" alt="Momentum" className="h-8 w-8" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Momentum
            </span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formattedDate}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onResetNewDay && (
            <Button
              onClick={handleResetClick}
              disabled={isResetting}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              {isResetting ? 'Resetting...' : 'Reset New Day'}
            </Button>
          )}

          {testDate && onTestDateChange && (
            <TestDatePicker selectedDate={testDate} onDateChange={onTestDateChange} />
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {onOpenAdminDashboard && (
            <Button variant="ghost" size="icon" onClick={onOpenAdminDashboard}>
              <Shield className="h-5 w-5" />
              <span className="sr-only">Admin Dashboard</span>
            </Button>
          )}

          {isAuthenticated && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {userProfile && (
                  <div className="px-2 py-1.5 text-sm font-medium">
                    {userProfile.name || 'User'}
                  </div>
                )}
                {onOpenUserInfo && (
                  <DropdownMenuItem onClick={onOpenUserInfo}>
                    Account Info
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
