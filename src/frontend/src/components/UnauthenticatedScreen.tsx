import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

interface UnauthenticatedScreenProps {
  onLogin: () => void;
  isLoggingIn: boolean;
}

export default function UnauthenticatedScreen({ onLogin, isLoggingIn }: UnauthenticatedScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg overflow-hidden">
              <img 
                src="/assets/logo1.png" 
                alt="Momentum Logo" 
                className="h-full w-full object-contain"
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
