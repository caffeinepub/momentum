import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail } from 'lucide-react';
import type { UserProfile } from '@/backend';
import { toast } from 'sonner';

interface UserInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userProfile: UserProfile | null | undefined;
  onSaveProfile: (profile: UserProfile) => Promise<void>;
  isSavingProfile: boolean;
}

export default function UserInfoDialog({
  open,
  onOpenChange,
  userProfile,
  onSaveProfile,
  isSavingProfile,
}: UserInfoDialogProps) {
  const [profileEmail, setProfileEmail] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setProfileEmail(userProfile.email || '');
    }
  }, [userProfile]);

  const validateEmail = (email: string): boolean => {
    if (!email.trim()) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSaveProfile = async () => {
    if (!userProfile || !onSaveProfile) return;

    if (!profileEmail.trim()) {
      toast.error('Email address is required');
      return;
    }

    if (!validateEmail(profileEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      await onSaveProfile({
        ...userProfile,
        email: profileEmail.trim(),
      });
      setIsEditingProfile(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error('Failed to update profile');
    }
  };

  if (!userProfile) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md backdrop-blur-lg bg-white/90 dark:bg-gray-900/90">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <User className="h-6 w-6 text-primary" />
            Account
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name" className="text-sm">Name</Label>
            <Input
              id="profile-name"
              value={userProfile.name}
              disabled
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-email" className="text-sm">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="profile-email"
                type="email"
                placeholder="your.email@example.com"
                value={profileEmail}
                onChange={(e) => {
                  setProfileEmail(e.target.value);
                  setIsEditingProfile(true);
                }}
                disabled={isSavingProfile}
                className="pl-9"
              />
            </div>
            {profileEmail && !validateEmail(profileEmail) && (
              <p className="text-xs text-destructive">Please enter a valid email address</p>
            )}
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setIsEditingProfile(false);
              setProfileEmail(userProfile.email || '');
              onOpenChange(false);
            }}
            disabled={isSavingProfile}
          >
            Cancel
          </Button>
          {isEditingProfile && (
            <Button
              onClick={handleSaveProfile}
              disabled={isSavingProfile || !validateEmail(profileEmail)}
            >
              {isSavingProfile ? 'Saving...' : 'Save'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
