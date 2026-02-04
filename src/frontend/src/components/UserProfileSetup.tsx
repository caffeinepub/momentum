import { useState } from 'react';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useSaveCallerUserProfile } from '@/hooks/useQueries';
import { UserTier } from '@/backend';
import { toast } from 'sonner';

export default function UserProfileSetup() {
  const [name, setName] = useState('');
  const saveProfile = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    try {
      await saveProfile.mutateAsync({ 
        name: name.trim(),
        earningsEnabled: true,
        tier: UserTier.basic,
      });
      toast.success('Profile created successfully');
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error('Failed to create profile');
    }
  };

  return (
    <Card className="w-full max-w-md mx-4">
      <CardHeader className="text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 mx-auto mb-4">
          <User className="h-8 w-8 text-primary-foreground" />
        </div>
        <CardTitle className="text-2xl">Welcome to Momentum</CardTitle>
        <CardDescription>
          Let's set up your profile to get started
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saveProfile.isPending}
              autoFocus
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={saveProfile.isPending || !name.trim()}
          >
            {saveProfile.isPending ? 'Creating Profile...' : 'Continue'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
