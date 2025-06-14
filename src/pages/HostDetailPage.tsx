import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getHostDetails, getHostMetricHistory } from '../services/apiClient';
import type { HostDetails, MetricPoint, ProcessDetail } from '../types/api';
import { useInterval } from '../hooks/useInterval';
// import { MetricChart } from '../components/MetricChart'; // You would create this
// import { ProcessList } from '../components/ProcessList'; // You would create this

const DETAIL_POLLING_INTERVAL = 5000; // 5 seconds

// Helper to format uptime (you'd implement this)
// const formatUptimeDetailed = (seconds: number | undefined): string => {
//   if (seconds === undefined) return 'N/A';
//   // Your logic
//   return `${seconds} seconds (formatted)`;
// };

export const HostDetailPage: React.FC = () => {
  const { hostId } = useParams<{ hostId: string }>();
  const [details, setDetails] = useState<HostDetails | null>(null);
  const [cpuHistory, setCpuHistory] = useState<MetricPoint[]>([]);
  const [memHistory, setMemHistory] = useState<MetricPoint[]>([]);
  // Add states for other metric histories (network up/down)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!hostId) return;
    // setLoading(true); // Optionally set loading true for each poll
    try {
      const detailData = await getHostDetails(hostId);
      setDetails(detailData);

      const cpuData = await getHostMetricHistory(hostId, 'cpu_usage_percent');
      setCpuHistory(cpuData);

      const memData = await getHostMetricHistory(hostId, 'mem_usage_percent');
      setMemHistory(memData);
      
      // Fetch network history similarly

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch host details');
      console.error(err);
      if (!details) setDetails(null); // Clear details on error if first load
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [hostId]);

  useInterval(fetchData, DETAIL_POLLING_INTERVAL);

  if (loading && !details) return <p>Loading host details for {hostId}...</p>;
  if (error && !details) return <p className="text-red-500">Error loading host {hostId}: {error}</p>;
  if (!details) return <p>Host {hostId} not found or data unavailable.</p>;

  // Basic display - you'd use shadcn/ui components for better layout
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-2">{details.hostname} ({details.id})</h1>
      <p className={
          details.status === 'online' ? 'text-green-600' :
          details.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
        }>
        Status: {details.status} (Last Seen: {new Date(details.lastSeen).toLocaleString()})
      </p>
      {/* <p>Uptime: {formatUptimeDetailed(details.uptimeSeconds)}</p> */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">System Info</h2>
          <p>OS: {details.os.name} {details.os.version}</p>
          <p>Kernel: {details.os.kernel} ({details.os.kernelArch})</p>
          <p>CPU Model: {details.cpu.model_name} ({details.cpu.cores} cores)</p>
          <p>Total RAM: {details.memory.total.toFixed(1)} GB</p>
          <p>Disk (/): {details.disk.usage_percent.toFixed(1)}% used ({details.disk.used_gb.toFixed(1)}GB / {details.disk.total_gb.toFixed(1)}GB)</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Current Usage</h2>
          <p>CPU Usage: {details.cpuUsage.toFixed(1)}%</p>
          <p>RAM Usage: {details.ramUsage.toFixed(1)}% ({details.memory.used.toFixed(1)} GB used)</p>
          {/* Add network usage display */}
        </div>
      </div>
      
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">CPU Usage History (Last Hour)</h2>
        {/* <MetricChart data={cpuHistory} label="CPU Usage %" /> */}
        <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
          {JSON.stringify(cpuHistory, null, 2)}
        </pre>
      </div>
      <div className="mt-4">
        <h2 className="text-xl font-semibold mb-2">Memory Usage History (Last Hour)</h2>
        {/* <MetricChart data={memHistory} label="Memory Usage %" /> */}
        <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
          {JSON.stringify(memHistory, null, 2)}
        </pre>
      </div>

      {details.processes && details.processes.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Top Processes</h2>
          {/* <ProcessList processes={details.processes} /> */}
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
            {JSON.stringify(details.processes, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};