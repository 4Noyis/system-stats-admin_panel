// src/pages/HostDetailPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom'; // Added Link for a back button
import { getHostDetails, getHostMetricHistory } from '../services/apiClient';
import type { HostDetails, MetricPoint, ProcessDetail } from '../types/api'; // Assuming ProcessDetail is also in api.ts
import { useInterval } from '../hooks/useInterval';

// Placeholder components - replace with your actual chart and list components
const MetricChart: React.FC<{ data: MetricPoint[]; title: string; yAxisLabel: string }> = ({ data, title, yAxisLabel }) => (
  <div>
    <h3 className="text-lg font-medium mb-1">{title}</h3>
    <div className="bg-gray-100 p-2 rounded text-xs overflow-x-auto h-40 border">
      {data.length > 0 ? <pre>{JSON.stringify(data, null, 2)}</pre> : <p className="text-gray-500">No data available.</p>}
    </div>
    <p className="text-xs text-gray-500 text-right">{yAxisLabel}</p>
  </div>
);

const ProcessList: React.FC<{ processes: ProcessDetail[] }> = ({ processes }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PID</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPU %</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mem %</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {processes.map((proc) => (
          <tr key={proc.pid}>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{proc.pid}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 truncate max-w-xs">{proc.name}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{proc.cpuUsage?.toFixed(1)}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{proc.memoryUsage?.toFixed(1)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);


const DETAIL_POLLING_INTERVAL = 7000; // 7 seconds, adjust as needed

// Helper for formatting network speed (from HostCard, can be moved to a utils file)
const formatNetworkSpeed = (bytesPerSecond: number | undefined): string => {
  if (bytesPerSecond === undefined || bytesPerSecond === null) return 'N/A';
  if (bytesPerSecond < 1024) return `${bytesPerSecond.toFixed(1)} B/s`;
  const kbps = bytesPerSecond / 1024;
  if (kbps < 1024) return `${kbps.toFixed(1)} KB/s`;
  const mbps = kbps / 1024;
  return `${mbps.toFixed(1)} MB/s`;
};

// Helper to format uptime (you'd implement this properly when uptimeSeconds is re-added)
// const formatUptimeDetailed = (seconds: number | undefined): string => {
//   if (seconds === undefined) return 'N/A';
//   if (seconds < 60) return `${seconds}s`;
//   if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
//   const h = Math.floor(seconds / 3600);
//   const m = Math.floor((seconds % 3600) / 60);
//   const s = seconds % 60;
//   return `${h}h ${m}m ${s}s`;
// };

export const HostDetailPage: React.FC = () => {
  const { hostId } = useParams<{ hostId: string }>();
  const [details, setDetails] = useState<HostDetails | null>(null);
  const [cpuHistory, setCpuHistory] = useState<MetricPoint[]>([]);
  const [memHistory, setMemHistory] = useState<MetricPoint[]>([]);
  const [netUpHistory, setNetUpHistory] = useState<MetricPoint[]>([]);
  const [netDownHistory, setNetDownHistory] = useState<MetricPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!hostId) {
      setError("Host ID is missing.");
      setLoading(false);
      return;
    }

    // For subsequent polls, don't show full page loading, but maybe subtle indicators
    // if (!details) setLoading(true); // Only set full loading if no details yet

    try {
      // Fetch all data in parallel
      const [
        detailData,
        cpuData,
        memData,
        netUpData,
        netDownData
      ] = await Promise.all([
        getHostDetails(hostId),
        getHostMetricHistory(hostId, 'cpu_usage_percent', '1h', '30s'),
        getHostMetricHistory(hostId, 'mem_usage_percent', '1h', '30s'),
        getHostMetricHistory(hostId, 'net_upload_bytes_sec', '1h', '30s'),
        getHostMetricHistory(hostId, 'net_download_bytes_sec', '1h', '30s'),
      ]);

      setDetails(detailData);
      setCpuHistory(cpuData);
      setMemHistory(memData);
      setNetUpHistory(netUpData);
      setNetDownHistory(netDownData);
      setError(null); // Clear previous errors on successful fetch
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch host data';
      setError(errorMessage);
      console.error(`Error fetching data for host ${hostId}:`, err);
      // Optionally clear data if fetch fails catastrophically, or keep stale data
      // if (!details) setDetails(null); 
    } finally {
      setLoading(false); // Set loading false after all fetches complete or fail
    }
  }, [hostId]); // Removed 'details' from dependency array to avoid loop with polling if details is part of condition

  useEffect(() => {
    fetchData(); // Initial fetch
  }, [fetchData]); // fetchData is memoized with useCallback

  useInterval(fetchData, DETAIL_POLLING_INTERVAL);

  // ----- Render Logic -----

  if (loading && !details) { // Initial loading state
    return (
      <div className="container mx-auto p-4 text-center">
        <p>Loading host details for {hostId}...</p>
        {/* You can add a spinner component here */}
      </div>
    );
  }

  if (error && !details) { // Error during initial load
    return (
      <div className="container mx-auto p-4 text-center text-red-500">
        <p>Error loading host {hostId}: {error}</p>
        <Link to="/" className="text-blue-500 hover:underline mt-4 inline-block">Back to Dashboard</Link>
      </div>
    );
  }

  if (!details) { // Host not found or data still unavailable after initial load attempt
    return (
      <div className="container mx-auto p-4 text-center">
        <p>Host {hostId} not found or data is currently unavailable.</p>
        <Link to="/" className="text-blue-500 hover:underline mt-4 inline-block">Back to Dashboard</Link>
      </div>
    );
  }

  // If we reach here, 'details' object is available
  return (
    <div className="container mx-auto p-4 space-y-8">
      <div>
        <Link to="/" className="text-blue-500 hover:underline mb-4 inline-block">← Back to Dashboard</Link>
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">{details.hostname} <span className="text-lg text-gray-500">({details.id})</span></h1>
            {error && <p className="text-sm text-red-500 ml-4">Note: Last update failed. Showing stale data. Error: {error}</p>}
        </div>
        <p className={`capitalize font-medium ${
            details.status === 'online' ? 'text-green-600' :
            details.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
          }`}>
          Status: {details.status} (Last Seen: {new Date(details.lastSeen).toLocaleString()})
        </p>
        {/* <p>Uptime: {formatUptimeDetailed(details.uptimeSeconds)}</p> */}
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* OS Info Card */}
        <div className="bg-card text-card-foreground p-4 shadow rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Operating System</h2>
          <p><strong>Name:</strong> {details.os?.name || 'N/A'}</p>
          <p><strong>Version:</strong> {details.os?.version || 'N/A'}</p>
          <p><strong>Kernel:</strong> {details.os?.kernel || 'N/A'}</p>
          <p><strong>Architecture:</strong> {details.os?.kernelArch || 'N/A'}</p>
        </div>

        {/* CPU Info Card */}
        <div className="bg-card text-card-foreground p-4 shadow rounded-lg">
          <h2 className="text-xl font-semibold mb-3">CPU</h2>
          <p><strong>Model:</strong> {details.cpu?.model_name || 'N/A'}</p>
          <p><strong>Cores:</strong> {details.cpu?.cores ?? 'N/A'}</p>
          <p><strong>Current Usage:</strong> {(details.cpuUsage ?? 0).toFixed(1)}%</p>
        </div>
        
        {/* Memory Info Card */}
        <div className="bg-card text-card-foreground p-4 shadow rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Memory</h2>
          <p><strong>Total:</strong> {(details.memory?.total ?? 0).toFixed(1)} GB</p>
          <p><strong>Used:</strong> {(details.memory?.used ?? 0).toFixed(1)} GB ({(details.ramUsage ?? 0).toFixed(1)}%)</p>
          <p><strong>Available:</strong> {(details.memory?.free ?? 0).toFixed(1)} GB</p>
        </div>

        {/* Disk Info Card */}
        <div className="bg-card text-card-foreground p-4 shadow rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Disk (/)</h2>
          <p><strong>Total:</strong> {(details.disk?.total_gb ?? 0).toFixed(1)} GB</p>
          <p><strong>Used:</strong>  {(details.disk?.usage_percent ?? 0).toFixed(1)}%</p>
          <p><strong>Free:</strong> {(details.disk?.free_gb ?? 0).toFixed(1)} GB</p>
        </div>

        {/* Network Info Card */}
        <div className="bg-card text-card-foreground p-4 shadow rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Network</h2>
          <p><strong>Upload:</strong> {formatNetworkSpeed(details.networkUpload)}</p>
          <p><strong>Download:</strong> {formatNetworkSpeed(details.networkDownload)}</p>
        </div>
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetricChart data={cpuHistory} title="CPU Usage History (Last Hour)" yAxisLabel="CPU Usage (%)" />
        <MetricChart data={memHistory} title="Memory Usage History (Last Hour)" yAxisLabel="Memory Usage (%)" />
        <MetricChart data={netUpHistory} title="Network Upload History (Last Hour)" yAxisLabel="Upload (KB/s or MB/s)" />
        <MetricChart data={netDownHistory} title="Network Download History (Last Hour)" yAxisLabel="Download (KB/s or MB/s)" />
      </div>

      {/* Processes Section */}
      {details.processes && details.processes.length > 0 ? (
        <div>
          <h2 className="text-2xl font-semibold mb-3">High Usage Processes</h2>
          <ProcessList processes={details.processes} />
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-semibold mb-3">Processes</h2>
          <p>No high-usage processes reported recently or data is loading.</p>
        </div>
      )}
    </div>
  );
};