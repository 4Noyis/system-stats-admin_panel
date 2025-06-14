import React, { useState, useEffect } from 'react';
import { getHostsOverview } from '../services/apiClient';
import type { HostOverview } from '../types/api';
import { HostCard } from '../components/HostCard';
import { useInterval } from '../hooks/useInterval'; // Custom polling hook

const POLLING_INTERVAL = 10000; // 10 seconds

export const DashboardOverviewPage: React.FC = () => {
  const [hosts, setHosts] = useState<HostOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHosts = async () => {
    try {
      // setLoading(true); // Optionally set loading true for each poll
      const data = await getHostsOverview();
      setHosts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch hosts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHosts(); // Initial fetch
  }, []);

  useInterval(fetchHosts, POLLING_INTERVAL); // Periodic polling

  if (loading && hosts.length === 0) return <p>Loading dashboard...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">System Monitoring Dashboard</h1>
      {hosts.length === 0 && !loading && <p>No hosts found or server not reachable.</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {hosts.map((host) => (
          <HostCard key={host.id} host={host} />
        ))}
      </div>
    </div>
  );
};