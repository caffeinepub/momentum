import { useState, useMemo } from 'react';
import { Shield, ShieldOff, Loader2, Search, Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useAdminUserList, usePromoteToAdmin, useRemoveAdmin, useSetUserTier } from '@/hooks/useQueries';
import { getUserTierLabel, getAllTiers } from '@/lib/userTier';
import { UserTier } from '@/backend';
import { toast } from 'sonner';

interface AdminDashboardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAGE_SIZE = 25;

export default function AdminDashboardDialog({ open, onOpenChange }: AdminDashboardDialogProps) {
  const { data: users, isLoading } = useAdminUserList();
  const promoteToAdmin = usePromoteToAdmin();
  const removeAdmin = useRemoveAdmin();
  const setUserTier = useSetUserTier();
  const [processingPrincipal, setProcessingPrincipal] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedPrincipal, setCopiedPrincipal] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!searchQuery.trim()) return users;

    const query = searchQuery.toLowerCase();
    return users.filter((user) => {
      const principalStr = user.principal.toString().toLowerCase();
      const username = user.profile?.name?.toLowerCase() || '';
      
      return (
        principalStr.includes(query) ||
        username.includes(query)
      );
    });
  }, [users, searchQuery]);

  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  useMemo(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handlePromote = async (principalId: string) => {
    setProcessingPrincipal(principalId);
    try {
      await promoteToAdmin.mutateAsync(principalId as any);
      toast.success('User promoted to admin successfully');
    } catch (error: any) {
      console.error('Failed to promote user:', error);
      const errorMessage = error?.message || 'Failed to promote user';
      if (errorMessage.includes('Maximum number of admins')) {
        toast.error('Cannot promote: Maximum of 3 admins reached');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setProcessingPrincipal(null);
    }
  };

  const handleDemote = async (principalId: string) => {
    setProcessingPrincipal(principalId);
    try {
      await removeAdmin.mutateAsync(principalId as any);
      toast.success('Admin privileges removed successfully');
    } catch (error: any) {
      console.error('Failed to remove admin:', error);
      const errorMessage = error?.message || 'Failed to remove admin';
      if (errorMessage.includes('Cannot remove last remaining admin')) {
        toast.error('Cannot demote: At least one admin must remain');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setProcessingPrincipal(null);
    }
  };

  const handleTierChange = async (principalId: string, newTier: UserTier) => {
    setProcessingPrincipal(principalId);
    try {
      await setUserTier.mutateAsync({ targetUser: principalId as any, newTier });
      toast.success('User tier updated successfully');
    } catch (error: any) {
      console.error('Failed to update tier:', error);
      toast.error('Failed to update user tier');
    } finally {
      setProcessingPrincipal(null);
    }
  };

  const truncatePrincipal = (principal: string) => {
    if (principal.length <= 20) return principal;
    return `${principal.slice(0, 10)}...${principal.slice(-8)}`;
  };

  const handleCopyPrincipal = async (principal: string) => {
    try {
      await navigator.clipboard.writeText(principal);
      setCopiedPrincipal(principal);
      setTimeout(() => setCopiedPrincipal(null), 2000);
    } catch (error) {
      console.error('Failed to copy principal:', error);
      toast.error('Failed to copy principal ID');
    }
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const allTiers = getAllTiers();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Dashboard
          </DialogTitle>
          <DialogDescription>
            Manage user roles, tiers, and view user information. Maximum 3 admins allowed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or principal ID..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[450px] pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'No users found matching your search' : 'No users found'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Principal ID</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.map((user) => {
                    const principalStr = user.principal.toString();
                    const isProcessing = processingPrincipal === principalStr;
                    const isCopied = copiedPrincipal === principalStr;
                    
                    return (
                      <TableRow key={principalStr}>
                        <TableCell className="font-medium">
                          {user.profile?.name || <span className="text-muted-foreground italic">No name</span>}
                        </TableCell>
                        <TableCell className="text-sm">
                          {user.profile?.email || <span className="text-muted-foreground italic">No email</span>}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          <div className="flex items-center gap-2">
                            <span>{truncatePrincipal(principalStr)}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleCopyPrincipal(principalStr)}
                            >
                              {isCopied ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={user.profile?.tier || UserTier.basic}
                            onValueChange={(value) => handleTierChange(principalStr, value as UserTier)}
                            disabled={isProcessing || setUserTier.isPending}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {allTiers.map((tier) => (
                                <SelectItem key={tier.value} value={tier.value}>
                                  {tier.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {user.isAdmin ? (
                            <Badge className="gap-1">
                              <Shield className="h-3 w-3" />
                              Admin
                            </Badge>
                          ) : (
                            <Badge variant="secondary">User</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {user.isAdmin ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDemote(principalStr)}
                              disabled={isProcessing || removeAdmin.isPending}
                              className="gap-2"
                            >
                              {isProcessing ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <ShieldOff className="h-3 w-3" />
                              )}
                              Demote
                            </Button>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handlePromote(principalStr)}
                              disabled={isProcessing || promoteToAdmin.isPending}
                              className="gap-2"
                            >
                              {isProcessing ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Shield className="h-3 w-3" />
                              )}
                              Promote
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </ScrollArea>

          {filteredUsers.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="text-sm font-medium px-3">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
