import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { SpendRecord, MonetarySettings } from '@/backend';

interface InsightsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spends: SpendRecord[] | undefined;
  monetarySettings: MonetarySettings | undefined;
}

type TimePeriod = 'daily' | 'weekly' | 'allTime';

export default function InsightsDialog({
  open,
  onOpenChange,
  spends,
  monetarySettings,
}: InsightsDialogProps) {
  const [activeTab, setActiveTab] = useState<'spend' | 'earning' | 'task'>('spend');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('daily');

  const currentBalance = monetarySettings?.totalBalance ? Number(monetarySettings.totalBalance) : 0;

  const chartData = useMemo(() => {
    if (!spends || spends.length === 0) {
      return [];
    }

    const now = Date.now() / 1000;
    const oneDaySeconds = 24 * 60 * 60;
    const oneWeekSeconds = 7 * oneDaySeconds;

    let filteredSpends = spends;

    if (timePeriod === 'daily') {
      const startOfToday = Math.floor(now / oneDaySeconds) * oneDaySeconds;
      filteredSpends = spends.filter(s => Number(s.date) >= startOfToday);
    } else if (timePeriod === 'weekly') {
      const startOfWeek = now - oneWeekSeconds;
      filteredSpends = spends.filter(s => Number(s.date) >= startOfWeek);
    }

    const spendsByDate = new Map<string, number>();
    
    filteredSpends.forEach(spend => {
      const date = new Date(Number(spend.date) * 1000);
      const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const currentTotal = spendsByDate.get(dateKey) || 0;
      spendsByDate.set(dateKey, currentTotal + spend.amount);
    });

    const sortedEntries = Array.from(spendsByDate.entries()).sort((a, b) => {
      const dateA = new Date(a[0]);
      const dateB = new Date(b[0]);
      return dateA.getTime() - dateB.getTime();
    });

    return sortedEntries.map(([date, totalSpent]) => ({
      date,
      spent: totalSpent,
      earned: 0,
    }));
  }, [spends, timePeriod]);

  const totalSpent = useMemo(() => {
    if (!chartData || chartData.length === 0) return 0;
    return chartData.reduce((sum, item) => sum + item.spent, 0);
  }, [chartData]);

  const totalEarned = useMemo(() => {
    return 0;
  }, []);

  const balanceStatus = useMemo(() => {
    if (currentBalance > 100) return 'safe';
    if (currentBalance > 0) return 'warning';
    return 'critical';
  }, [currentBalance]);

  const statusColor = {
    safe: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    critical: 'text-red-600 dark:text-red-400',
  }[balanceStatus];

  const statusBgColor = {
    safe: 'bg-green-100 dark:bg-green-900/30',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30',
    critical: 'bg-red-100 dark:bg-red-900/30',
  }[balanceStatus];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-gradient-to-br from-white/95 via-white/90 to-white/95 dark:from-gray-900/95 dark:via-gray-900/90 dark:to-gray-900/95 border border-border/50 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Momentum Insights
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="spend" className="text-sm font-semibold">
              Spend Insights
            </TabsTrigger>
            <TabsTrigger value="earning" disabled className="text-sm font-semibold opacity-50 cursor-not-allowed">
              Earning Insights
            </TabsTrigger>
            <TabsTrigger value="task" disabled className="text-sm font-semibold opacity-50 cursor-not-allowed">
              Task Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="spend" className="space-y-6">
            <div className="flex gap-2 justify-center mb-4">
              <Button
                variant={timePeriod === 'daily' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimePeriod('daily')}
                className="font-semibold"
              >
                Daily
              </Button>
              <Button
                variant={timePeriod === 'weekly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimePeriod('weekly')}
                className="font-semibold"
              >
                Weekly
              </Button>
              <Button
                variant={timePeriod === 'allTime' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimePeriod('allTime')}
                className="font-semibold"
              >
                All Time
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-card border border-border shadow-sm">
                <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  ${totalSpent.toFixed(2)}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-card border border-border shadow-sm">
                <p className="text-sm text-muted-foreground mb-1">Total Earned</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${totalEarned.toFixed(2)}
                </p>
              </div>

              <div className={`p-4 rounded-lg border border-border shadow-sm ${statusBgColor}`}>
                <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
                <p className={`text-2xl font-bold ${statusColor}`}>
                  ${currentBalance.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="p-6 rounded-lg bg-card border border-border shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Spending vs Earnings</h3>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs"
                      tick={{ fill: 'currentColor' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'currentColor' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => `$${value.toFixed(2)}`}
                    />
                    <Legend />
                    <Bar 
                      dataKey="spent" 
                      fill="hsl(var(--destructive))" 
                      name="Spent"
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar 
                      dataKey="earned" 
                      fill="hsl(var(--primary))" 
                      name="Earned"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  <p>No spending data available for the selected period</p>
                </div>
              )}
            </div>

            <div className={`p-4 rounded-lg border-2 ${
              balanceStatus === 'safe' 
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                : balanceStatus === 'warning'
                ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                : 'border-red-500 bg-red-50 dark:bg-red-900/20'
            }`}>
              <p className={`text-sm font-semibold ${statusColor}`}>
                {balanceStatus === 'safe' && '✓ Your spending is under control'}
                {balanceStatus === 'warning' && '⚠ Approaching zero balance'}
                {balanceStatus === 'critical' && '⚠ Critical: Balance is low or negative'}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="earning" className="space-y-6">
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              <p className="text-center">
                Earning Insights coming soon<br />
                <span className="text-sm">This feature will be available in Phase 2</span>
              </p>
            </div>
          </TabsContent>

          <TabsContent value="task" className="space-y-6">
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              <p className="text-center">
                Task Insights coming soon<br />
                <span className="text-sm">This feature will be available in Phase 2</span>
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
