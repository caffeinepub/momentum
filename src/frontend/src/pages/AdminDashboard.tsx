import { useEffect } from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsCallerAdmin } from '@/hooks/useQueries';
import AdminUserDirectory from '@/components/admin/AdminUserDirectory';

interface AdminDashboardProps {
  onBack: () => void;
}

export default function AdminDashboard({ onBack }: AdminDashboardProps) {
  const { data: isAdmin, isLoading: isCheckingAdmin } = useIsCallerAdmin();

  useEffect(() => {
    document.title = 'Admin Dashboard - Momentum';
    return () => {
      document.title = 'Momentum';
    };
  }, []);

  if (isCheckingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="flex justify-center">
            <Shield className="h-16 w-16 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Unauthorized</h1>
            <p className="text-muted-foreground">
              You do not have permission to access the Admin Dashboard. Only administrators can view this page.
            </p>
          </div>
          <Button onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Task Manager
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Manage user roles, tiers, and view user information. Maximum 3 admins allowed.
            </p>
          </div>
          <AdminUserDirectory />
        </div>
      </main>
    </div>
  );
}
