import React, { useState, useEffect } from 'react';
import { getHostsOverview } from '../services/apiClient';
import type { HostOverview } from '../types/api';
import { HostCard } from '../components/HostCard';
import { useInterval } from '../hooks/useInterval';

const POLLING_INTERVAL = 10000; // 10 seconds

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center space-y-4">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
      <p className="text-muted-foreground">Loading dashboard...</p>
    </div>
  </div>
);

const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
      <svg className="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    </div>
    <h3 className="mb-2 text-lg font-semibold">No hosts found</h3>
    <p className="max-w-md text-muted-foreground">
      No monitored hosts are currently available. Make sure your system monitoring service is running and hosts are properly configured.
    </p>
  </div>
);

const ErrorState: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
      <svg className="h-8 w-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <h3 className="mb-2 text-lg font-semibold">Connection Error</h3>
    <p className="mb-4 max-w-md text-muted-foreground">{error}</p>
    <button
      onClick={onRetry}
      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
    >
      <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      Retry
    </button>
  </div>
);

const StatsCard: React.FC<{ title: string; value: string | number; description: string; icon: React.ReactNode; trend?: { value: number; isPositive: boolean } }> = ({
  title,
  value,
  description,
  icon,
  trend
}) => (
  <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="rounded-lg bg-primary/10 p-2">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
      {trend && (
        <div className={`flex items-center space-x-1 text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
          <svg className={`h-4 w-4 ${trend.isPositive ? 'rotate-0' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
          </svg>
          <span>{Math.abs(trend.value)}%</span>
        </div>
      )}
    </div>
    <p className="mt-2 text-xs text-muted-foreground">{description}</p>
  </div>
);

export const DashboardOverviewPage: React.FC = () => {
  const [hosts, setHosts] = useState<HostOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchHosts = async () => {
    try {
      const data = await getHostsOverview();
      setHosts(data);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch hosts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHosts();
  }, []);

  useInterval(fetchHosts, POLLING_INTERVAL);

  // Calculate stats
  const stats = {
    total: hosts.length,
    online: hosts.filter(h => h.status === 'online').length,
    warning: hosts.filter(h => h.status === 'warning').length,
    offline: hosts.filter(h => h.status === 'offline').length,
    avgCpu: hosts.length > 0 ? hosts.reduce((acc, h) => acc + h.cpuUsage, 0) / hosts.length : 0,
    avgMemory: hosts.length > 0 ? hosts.reduce((acc, h) => acc + h.ramUsage, 0) / hosts.length : 0,
  };

  if (loading && hosts.length === 0) {
    return <LoadingSpinner />;
  }

  if (error && hosts.length === 0) {
    return <ErrorState error={error} onRetry={fetchHosts} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Monitoring Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage your infrastructure in real-time
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <div className="flex items-center text-sm text-muted-foreground">
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
          {error && (
            <div className="flex items-center rounded-full bg-yellow-500/10 px-3 py-1 text-sm text-yellow-600">
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Update failed - showing cached data
            </div>
          )}
          <button
            onClick={fetchHosts}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          >
            <svg className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      {hosts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Hosts"
            value={stats.total}
            description="Monitored systems"
            icon={
              <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            }
          />
          <StatsCard
            title="Online"
            value={stats.online}
            description={`${((stats.online / stats.total) * 100).toFixed(1)}% availability`}
            icon={
              <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatsCard
            title="Avg CPU"
            value={`${stats.avgCpu.toFixed(1)}%`}
            description="Across all hosts"
            icon={
              <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />
          <StatsCard
            title="Avg Memory"
            value={`${stats.avgMemory.toFixed(1)}%`}
            description="Memory utilization"
            icon={
              <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            }
          />
        </div>
      )}

      {/* Hosts Grid */}
      {hosts.length === 0 && !loading ? (
        <EmptyState />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Monitored Hosts</h2>
            <p className="text-sm text-muted-foreground">
              {hosts.length} host{hosts.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hosts.map((host) => (
              <HostCard key={host.id} host={host} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};