import { useState, useMemo } from 'react';
import { Database, HardDrive, Users, ListChecks, Calendar, Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useGetOverallStorageMetrics, useGetAllUserStorageBreakdowns } from '@/hooks/useQueries';

const PAGE_SIZE = 50;

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatCycles(cycles: bigint): string {
  const num = Number(cycles);
  if (num >= 1_000_000_000_000) return `${(num / 1_000_000_000_000).toFixed(2)}T`;
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  return num.toLocaleString();
}

export default function StorageMonitoring() {
  const { data: metrics, isLoading: metricsLoading } = useGetOverallStorageMetrics();
  const { data: userBreakdowns, isLoading: breakdownsLoading } = useGetAllUserStorageBreakdowns();
  const [copiedPrincipal, setCopiedPrincipal] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const CANISTER_LIMIT_BYTES = 4 * 1024 * 1024 * 1024; // 4GB

  const totalMemoryUsed = metrics
    ? Number(metrics.estimatedStableMemoryBytes) + Number(metrics.estimatedHeapMemoryBytes)
    : 0;

  const usagePercentage = (totalMemoryUsed / CANISTER_LIMIT_BYTES) * 100;

  const getProgressColorClass = () => {
    if (usagePercentage >= 90) return 'bg-destructive';
    if (usagePercentage >= 75) return 'bg-amber-500';
    return 'bg-primary';
  };

  const sortedBreakdowns = useMemo(() => {
    if (!userBreakdowns) return [];
    return [...userBreakdowns].sort((a, b) => Number(b.estimatedSizeBytes) - Number(a.estimatedSizeBytes));
  }, [userBreakdowns]);

  const totalPages = Math.ceil(sortedBreakdowns.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const paginatedBreakdowns = sortedBreakdowns.slice(startIndex, endIndex);

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
    }
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  if (metricsLoading || breakdownsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading storage metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Memory Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(totalMemoryUsed)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Stable: {formatBytes(Number(metrics?.estimatedStableMemoryBytes || 0))} | 
              Heap: {formatBytes(Number(metrics?.estimatedHeapMemoryBytes || 0))}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Number(metrics?.totalUsers || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Routines</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Number(metrics?.totalRoutines || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Number(metrics?.totalTasks || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all users</p>
          </CardContent>
        </Card>
      </div>

      {/* Storage Usage Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Storage Usage
          </CardTitle>
          <CardDescription>
            Current usage relative to 4GB canister limit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {formatBytes(totalMemoryUsed)} / {formatBytes(CANISTER_LIMIT_BYTES)}
              </span>
              <span className={`font-semibold ${
                usagePercentage >= 90 ? 'text-destructive' : 
                usagePercentage >= 75 ? 'text-amber-600' : 
                'text-primary'
              }`}>
                {usagePercentage.toFixed(2)}%
              </span>
            </div>
            <div className="relative w-full h-3 bg-secondary rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${getProgressColorClass()}`}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Normal usage: Below 75%</p>
            <p>• Warning: 75-89% (consider optimization)</p>
            <p>• Critical: 90%+ (plan for horizontal scaling)</p>
          </div>
        </CardContent>
      </Card>

      {/* Per-User Storage Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Per-User Storage Breakdown</CardTitle>
          <CardDescription>
            Users sorted by storage usage (largest first)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Principal ID</TableHead>
                    <TableHead className="text-right">Routines</TableHead>
                    <TableHead className="text-right">Tasks</TableHead>
                    <TableHead className="text-right">Est. Size</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBreakdowns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No user data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedBreakdowns.map((breakdown) => {
                      const principalStr = breakdown.principal.toString();
                      const isCopied = copiedPrincipal === principalStr;
                      
                      return (
                        <TableRow key={principalStr}>
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
                          <TableCell className="text-right">
                            {Number(breakdown.routineCount)}
                          </TableCell>
                          <TableCell className="text-right">
                            {Number(breakdown.taskCount)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatBytes(Number(breakdown.estimatedSizeBytes))}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>

          {sortedBreakdowns.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4 mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(endIndex, sortedBreakdowns.length)} of {sortedBreakdowns.length} users
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
        </CardContent>
      </Card>
    </div>
  );
}
