import { useEffect, useState } from 'react';
import { Shield, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useIsCallerAdmin } from '@/hooks/useQueries';
import AdminUserDirectory from '@/components/admin/AdminUserDirectory';
import TierSettings from '@/components/admin/TierSettings';
import StorageMonitoring from '@/components/admin/StorageMonitoring';

interface AdminDashboardProps {
  onBack: () => void;
}

export default function AdminDashboard({ onBack }: AdminDashboardProps) {
  const { data: isAdmin, isLoading: isCheckingAdmin } = useIsCallerAdmin();
  const [activeTab, setActiveTab] = useState('users');

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
        <div className="max-w-lg w-full space-y-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Shield className="h-16 w-16 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Unauthorized</h1>
              <p className="text-muted-foreground">
                You do not have permission to access the Admin Dashboard.
              </p>
            </div>
          </div>

          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-amber-900 dark:text-amber-100 text-sm font-semibold">
              Need admin access?
            </AlertTitle>
            <AlertDescription className="text-xs text-amber-900 dark:text-amber-100 space-y-2 mt-2">
              <p>If you're setting up this app for the first time on live production:</p>
              <ol className="list-decimal list-inside space-y-1 ml-1">
                <li>Log out of the application</li>
                <li>Open the URL with your admin bootstrap token:
                  <br />
                  <code className="bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded text-[11px] block mt-1">
                    https://your-app.com/?caffeineAdminToken=YOUR_TOKEN
                  </code>
                </li>
                <li>Log in with Internet Identity</li>
                <li>You'll be granted admin privileges automatically</li>
              </ol>
              <p className="text-[11px] italic mt-2 pt-2 border-t border-amber-200 dark:border-amber-800">
                Note: The bootstrap token only works when there are zero admins in the system. If an admin already exists, they must promote you manually.
              </p>
            </AlertDescription>
          </Alert>

          <div className="flex justify-center">
            <Button onClick={onBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Task Manager
            </Button>
          </div>
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="tier-settings">Tier Settings</TabsTrigger>
            <TabsTrigger value="storage">Storage</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Manage user roles, tiers, and view user information. Maximum 3 admins allowed.
              </p>
            </div>
            <AdminUserDirectory />
          </TabsContent>

          <TabsContent value="tier-settings" className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Configure tier limits for tasks, custom lists, and routines. Set to Unlimited to remove restrictions.
              </p>
            </div>
            <TierSettings />
          </TabsContent>

          <TabsContent value="storage" className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Monitor canister storage usage and track growth. The 4GB limit applies to stable memory.
              </p>
            </div>
            <StorageMonitoring />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
