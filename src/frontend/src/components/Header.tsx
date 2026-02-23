import { LogOut, User, Shield, RotateCcw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { useGetCallerUserProfile, useIsCallerAdmin } from '@/hooks/useQueries';
import { getUserTierLabel } from '@/lib/userTier';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ThemeToggle from './ThemeToggle';
import TestDatePicker from './TestDatePicker';
import { toast } from 'sonner';

interface HeaderProps {
  onOpenAdminDashboard: () => void;
  testDate?: Date | null;
  onTestDateChange?: (date: Date | null) => void;
  showTestDatePicker?: boolean;
  onResetNewDay?: () => void;
  isResettingDay?: boolean;
}

export default function Header({ 
  onOpenAdminDashboard, 
  testDate, 
  onTestDateChange,
  showTestDatePicker = false,
  onResetNewDay,
  isResettingDay = false,
}: HeaderProps) {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: isAdmin } = useIsCallerAdmin();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
      toast.success('Logged out successfully');
    } else {
      try {
        await login();
        toast.success('Logged in successfully');
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        } else {
          toast.error('Failed to log in');
        }
      }
    }
  };

  // Full date format for larger screens
  const displayDate = testDate || new Date();
  const fullDate = displayDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Shortened date format for smaller screens (e.g., "Mon, Jan 1")
  const shortDate = displayDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-2 sm:px-4 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg overflow-hidden">
            <img 
              src="/assets/Momentum.png" 
              alt="Momentum Logo" 
              className="h-full w-full object-contain"
            />
          </div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight">Momentum</h1>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex-shrink-0">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">
              <span className="hidden lg:inline">{fullDate}</span>
              <span className="lg:hidden">{shortDate}</span>
            </p>
          </div>
          
          {/* TEST-ONLY: Date picker for routine testing - hidden on mobile */}
          {showTestDatePicker && onTestDateChange && (
            <div className="hidden md:block">
              <TestDatePicker 
                selectedDate={testDate || null} 
                onDateChange={onTestDateChange}
              />
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <ThemeToggle />
          
          {isAuthenticated && onResetNewDay && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetNewDay}
              disabled={isResettingDay}
              className="gap-2"
            >
              <RotateCcw className={`h-4 w-4 ${isResettingDay ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Start New Day</span>
            </Button>
          )}
          
          {isAuthenticated && isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenAdminDashboard}
              className="gap-2"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </Button>
          )}
          
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full h-8 w-8 sm:h-9 sm:w-9">
                  <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {userProfile?.name || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      Tier: {getUserTierLabel(userProfile?.tier)}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleAuth} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={handleAuth}
              disabled={isLoggingIn}
              variant="default"
              size="sm"
              className="gap-2"
            >
              {isLoggingIn ? 'Logging in...' : 'Log in'}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
