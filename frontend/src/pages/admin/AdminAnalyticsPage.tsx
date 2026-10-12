import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { dashboardService } from '@/services/dashboardService';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';

const COLORS = ['#173058', '#2C5391', '#B8862F', '#C25A2C', '#B23A3A'];

export default function AdminAnalyticsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: dashboardService.getAnalytics,
  });

  if (isLoading) return <LoadingState label="Loading analytics…" />;
  if (error || !data) return <ErrorState message={(error as Error)?.message ?? 'Failed to load'} onRetry={() => refetch()} />;

  const byType = Object.entries((data.emergenciesByType as Record<string, number>) ?? {}).map(([name, value]) => ({ name, value }));
  const byPriority = Object.entries((data.emergenciesByPriority as Record<string, number>) ?? {}).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl text-navy-950">Analytics</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-navy-900/10 bg-white p-5">
          <h2 className="text-sm font-medium uppercase tracking-wide text-navy-500">Emergencies by type</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byType}>
                <CartesianGrid strokeDasharray="3 3" stroke="#17305814" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#173058" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-navy-900/10 bg-white p-5">
          <h2 className="text-sm font-medium uppercase tracking-wide text-navy-500">Emergencies by priority</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byPriority} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {byPriority.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-navy-900/10 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-navy-500">Completed emergencies</p>
          <p className="mt-1 font-display text-2xl text-navy-950">{String(data.completedCount ?? 0)}</p>
        </div>
        <div className="rounded-lg border border-navy-900/10 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-navy-500">Cancelled emergencies</p>
          <p className="mt-1 font-display text-2xl text-navy-950">{String(data.cancelledCount ?? 0)}</p>
        </div>
      </div>
    </div>
  );
}
