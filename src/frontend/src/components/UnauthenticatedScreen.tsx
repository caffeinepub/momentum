import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Users, Info, ShieldCheck, Copy, CheckCheck } from 'lucide-react';
import { useGetRegisteredUserCount } from '@/hooks/useQueries';
import { useState, useEffect } from 'react';
import { getUrlParameter } from '@/utils/urlParams';

interface UnauthenticatedScreenProps {
  onLogin: () => void;
  isLoggingIn: boolean;
}

export default function UnauthenticatedScreen({ onLogin, isLoggingIn }: UnauthenticatedScreenProps) {
  const { data: userCount, isLoading: isLoadingCount, isError } = useGetRegisteredUserCount();
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check if admin token is present in URL
    const token = getUrlParameter('caffeineAdminToken');
    if (token) {
      setAdminToken(token);
    }
  }, []);

  const adminBootstrapUrl = adminToken 
    ? `${window.location.origin}${window.location.pathname}?caffeineAdminToken=${adminToken}`
    : null;

  const handleCopyUrl = async () => {
    if (adminBootstrapUrl) {
      try {
        await navigator.clipboard.writeText(adminBootstrapUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy URL:', err);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-full max-w-[280px] aspect-[4/3] flex items-center justify-center">
              <img 
                src="/assets/Momentum.png" 
                alt="Momentum Logo" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Momentum
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Focus on what matters. Every day.
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Organize tasks with the Eisenhower Matrix
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Build daily routines and track streaks
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Optional earnings system to stay motivated
              </p>
            </div>
          </div>

          {adminBootstrapUrl && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
              <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-xs text-green-900 dark:text-green-100 space-y-3">
                <p className="font-semibold text-sm">🎉 Admin Bootstrap URL Ready!</p>
                <p className="font-medium">Follow these steps to become admin:</p>
                <ol className="list-decimal list-inside space-y-1.5 ml-1">
                  <li>Copy the URL below</li>
                  <li>Open it in your browser</li>
                  <li>Log in with Internet Identity</li>
                  <li>You'll be granted admin access permanently</li>
                </ol>
                
                <div className="mt-3 space-y-2">
                  <p className="font-medium text-[11px]">Your Admin Bootstrap URL:</p>
                  <div className="relative">
                    <div className="bg-green-100 dark:bg-green-900/40 p-3 rounded-md border border-green-200 dark:border-green-800 break-all text-[10px] font-mono pr-10">
                      {adminBootstrapUrl}
                    </div>
                    <button
                      onClick={handleCopyUrl}
                      className="absolute top-2 right-2 p-1.5 rounded hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                      title="Copy URL"
                    >
                      {copied ? (
                        <CheckCheck className="h-4 w-4 text-green-700 dark:text-green-300" />
                      ) : (
                        <Copy className="h-4 w-4 text-green-700 dark:text-green-300" />
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-[11px] italic mt-2 text-green-800 dark:text-green-200">
                  ⚠️ Keep this URL secure! After your first login, the token will be stored securely and you won't need it again.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {!adminBootstrapUrl && (
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
              <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-xs text-blue-900 dark:text-blue-100 space-y-2">
                <p className="font-medium">First-time admin setup for live deployment:</p>
                <ol className="list-decimal list-inside space-y-1 ml-1">
                  <li>Open the URL with the <code className="bg-blue-100 dark:bg-blue-900/40 px-1 py-0.5 rounded text-[11px]">caffeineAdminToken</code> parameter</li>
                  <li>Log in with Internet Identity</li>
                  <li>You'll be granted admin access automatically</li>
                </ol>
                <p className="text-[11px] italic mt-2">
                  Example: <code className="bg-blue-100 dark:bg-blue-900/40 px-1 py-0.5 rounded">https://your-app.com/?caffeineAdminToken=YOUR_TOKEN</code>
                </p>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button
              onClick={onLogin}
              disabled={isLoggingIn}
              className="w-full h-12 text-base font-medium"
              size="lg"
            >
              {isLoggingIn ? 'Logging in...' : 'Log in with Internet Identity'}
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              Secure, password-free login. Your data is private.
            </p>

            {!isError && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <Users className="h-4 w-4 text-muted-foreground/70" />
                <p className="text-xs text-muted-foreground/70">
                  {isLoadingCount ? (
                    'Loading...'
                  ) : userCount !== undefined ? (
                    `${userCount.toString()} registered users`
                  ) : (
                    'Loading...'
                  )}
                </p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        type="button"
                        className="inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full"
                        aria-label="User count information"
                      >
                        <Info className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-muted-foreground/90 transition-colors" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[260px] text-center">
                      <p className="text-xs">
                        This count represents unique Internet Identity principals. Logging in with the same Internet Identity anchor will not increase this number.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
