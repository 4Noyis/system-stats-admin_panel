// src/pages/HostDetailPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom'; // Added Link for a back button
import { getHostDetails, getHostMetricHistory } from '../services/apiClient';
import type { HostDetails, MetricPoint, ProcessDetail } from '../types/api'; // Assuming ProcessDetail is also in api.ts
import { useInterval } from '../hooks/useInterval';

const MetricChart: React.FC<{ data: MetricPoint[]; title: string; yAxisLabel: string; color?: string }> = ({ 
  data, 
  title, 
  yAxisLabel,
  color = "rgb(59, 130, 246)" // blue-500
}) => {
  const maxValue = Math.max(...data.map(d => d.value), 0);
  const minValue = Math.min(...data.map(d => d.value), 0);
  const range = Math.max(maxValue - minValue, 1);
  
  // Create SVG path for the line chart
  const createPath = (points: MetricPoint[]) => {
    if (points.length === 0) return "";
    
    const width = 400;
    const height = 200;
    const padding = 20;
    
    const pathData = points.map((point, index) => {
      const x = padding + (index / (points.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((point.value - minValue) / range) * (height - 2 * padding);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    
    return pathData;
  };

  const formatValue = (value: number) => {
    if (yAxisLabel.includes('%')) return `${value.toFixed(1)}%`;
    if (yAxisLabel.includes('B/s') || yAxisLabel.includes('KB/s') || yAxisLabel.includes('MB/s')) {
      if (value < 1024) return `${value.toFixed(1)} B/s`;
      const kb = value / 1024;
      if (kb < 1024) return `${kb.toFixed(1)} KB/s`;
      const mb = kb / 1024;
      return `${mb.toFixed(1)} MB/s`;
    }
    return value.toFixed(1);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="text-sm text-gray-600">
          {data.length > 0 && (
            <>
              Current: {formatValue(data[data.length - 1]?.value || 0)}
              {data.length > 1 && (
                <span className="ml-2">
                  Max: {formatValue(maxValue)}
                </span>
              )}
            </>
          )}
        </div>
      </div>
      
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-gray-600">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p>No data available</p>
          </div>
        </div>
      ) : (
        <div className="relative">
          <svg
            viewBox="0 0 400 200"
            className="w-full h-48 border border-gray-200 rounded bg-gray-50"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.1"/>
              </pattern>
            </defs>
            <rect width="400" height="200" fill="url(#grid)" />
            
            {/* Area under the curve */}
            <defs>
              <linearGradient id={`gradient-${title.replace(/\s+/g, '-')}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                <stop offset="100%" stopColor={color} stopOpacity="0.05" />
              </linearGradient>
            </defs>
            
            {data.length > 0 && (
              <>
                {/* Area fill */}
                <path
                  d={`${createPath(data)} L 380 180 L 20 180 Z`}
                  fill={`url(#gradient-${title.replace(/\s+/g, '-')})`}
                />
                
                {/* Line */}
                <path
                  d={createPath(data)}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                
                {/* Data points */}
                {data.map((point, index) => {
                  const x = 20 + (index / (data.length - 1)) * 360;
                  const y = 180 - ((point.value - minValue) / range) * 160;
                  return (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r="3"
                      fill={color}
                      className="opacity-75 hover:opacity-100 transition-opacity"
                    >
                      <title>{`${point.timestamp}: ${formatValue(point.value)}`}</title>
                    </circle>
                  );
                })}
              </>
            )}
          </svg>
          
          {/* X-axis labels */}
          {data.length > 0 && (
            <div className="flex justify-between mt-2 px-5 text-xs text-gray-500">
              <span>{data[0]?.timestamp}</span>
              {data.length > 2 && (
                <span>{data[Math.floor(data.length / 2)]?.timestamp}</span>
              )}
              <span>{data[data.length - 1]?.timestamp}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ProcessList: React.FC<{ processes: ProcessDetail[] }> = ({ processes }) => {
  const getUsageColor = (percentage: number): string => {
    if (percentage >= 80) return "text-red-600 bg-red-50";
    if (percentage >= 60) return "text-yellow-600 bg-yellow-50";
    return "text-green-600 bg-green-50";
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">High Usage Processes</h3>
        <p className="text-sm text-gray-600">Top processes by resource utilization</p>
      </div>
      
      {processes.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2-2m0 0V5a2 2 0 012-2h14a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-gray-600">No high-usage processes detected</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Process Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPU Usage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Memory Usage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {processes.map((proc, index) => (
                <tr key={proc.pid} className="hover:bg-gray-100 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono text-gray-900">{proc.pid}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-xs" title={proc.name}>
                          {proc.name}
                        </p>
                        <p className="text-xs text-gray-500">Process #{index + 1}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUsageColor(proc.cpuUsage || 0)}`}>
                        {proc.cpuUsage?.toFixed(1) || '0.0'}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUsageColor(proc.memoryUsage || 0)}`}>
                        {proc.memoryUsage?.toFixed(1) || '0.0'}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};


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

  const statusConfig = {
    online: { 
      color: "bg-green-500", 
      textColor: "text-green-700", 
      bgColor: "bg-green-50 border-green-200"
    },
    warning: { 
      color: "bg-yellow-500", 
      textColor: "text-yellow-700", 
      bgColor: "bg-yellow-50 border-yellow-200"
    },
    offline: { 
      color: "bg-red-500", 
      textColor: "text-red-700", 
      bgColor: "bg-red-50 border-red-200"
    }
  };

  const status = statusConfig[details.status as keyof typeof statusConfig] || statusConfig.offline;

  const InfoCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <div className="p-2 bg-blue-100 rounded-lg mr-3">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="space-y-2 text-sm">
        {children}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-start md:justify-between md:space-y-0">
        <div className="flex-1">
          <Link to="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
          
          <div className="flex items-center space-x-4 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{details.hostname}</h1>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${status.bgColor} ${status.textColor}`}>
              <span className={`w-2 h-2 rounded-full mr-2 ${status.color}`}></span>
              <span className="capitalize">{details.status}</span>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <span>ID: {details.id}</span>
            <span>•</span>
            <span>Last seen: {new Date(details.lastSeen).toLocaleString()}</span>
          </div>
        </div>
        
        {error && (
          <div className="flex items-center text-sm text-yellow-600 bg-yellow-50 border border-yellow-200 px-3 py-2 rounded-md">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Update failed - showing cached data
          </div>
        )}
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <InfoCard 
          title="Operating System" 
          icon={
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          }
        >
          <div className="flex justify-between"><span className="text-gray-600">Name:</span><span className="font-medium">{details.os?.name || 'N/A'}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Version:</span><span className="font-medium">{details.os?.version || 'N/A'}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Kernel:</span><span className="font-medium">{details.os?.kernel || 'N/A'}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Architecture:</span><span className="font-medium">{details.os?.kernelArch || 'N/A'}</span></div>
        </InfoCard>

        <InfoCard 
          title="CPU" 
          icon={
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        >
          <div className="flex justify-between"><span className="text-gray-600">Model:</span><span className="font-medium truncate" title={details.cpu?.model_name}>{details.cpu?.model_name || 'N/A'}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Cores:</span><span className="font-medium">{details.cpu?.cores ?? 'N/A'}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Current Usage:</span><span className={`font-medium ${(details.cpuUsage ?? 0) >= 80 ? 'text-red-600' : (details.cpuUsage ?? 0) >= 60 ? 'text-yellow-600' : 'text-green-600'}`}>{(details.cpuUsage ?? 0).toFixed(1)}%</span></div>
        </InfoCard>
        
        <InfoCard 
          title="Memory" 
          icon={
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
          }
        >
          <div className="flex justify-between"><span className="text-gray-600">Total:</span><span className="font-medium">{(details.memory?.total ?? 0).toFixed(1)} GB</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Used:</span><span className="font-medium">{(details.memory?.used ?? 0).toFixed(1)} GB</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Available:</span><span className="font-medium">{(details.memory?.free ?? 0).toFixed(1)} GB</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Usage:</span><span className={`font-medium ${(details.ramUsage ?? 0) >= 80 ? 'text-red-600' : (details.ramUsage ?? 0) >= 60 ? 'text-yellow-600' : 'text-green-600'}`}>{(details.ramUsage ?? 0).toFixed(1)}%</span></div>
        </InfoCard>

        <InfoCard 
          title="Disk Storage" 
          icon={
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
          }
        >
          <div className="flex justify-between"><span className="text-gray-600">Path:</span><span className="font-medium">{details.disk?.path || '/'}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Total:</span><span className="font-medium">{(details.disk?.total_gb ?? 0).toFixed(1)} GB</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Free:</span><span className="font-medium">{(details.disk?.free_gb ?? 0).toFixed(1)} GB</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Usage:</span><span className={`font-medium ${(details.disk?.usage_percent ?? 0) >= 80 ? 'text-red-600' : (details.disk?.usage_percent ?? 0) >= 60 ? 'text-yellow-600' : 'text-green-600'}`}>{(details.disk?.usage_percent ?? 0).toFixed(1)}%</span></div>
        </InfoCard>

        <InfoCard 
          title="Network Activity" 
          icon={
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
          }
        >
          <div className="flex justify-between">
            <span className="text-gray-600 flex items-center">
              <svg className="w-3 h-3 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
              Upload:
            </span>
            <span className="font-medium">{formatNetworkSpeed(details.networkUpload)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 flex items-center">
              <svg className="w-3 h-3 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
              Download:
            </span>
            <span className="font-medium">{formatNetworkSpeed(details.networkDownload)}</span>
          </div>
        </InfoCard>
      </div>
      
      {/* Charts Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">Performance Metrics</h2>
          <p className="text-sm text-gray-600">Last hour</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MetricChart 
            data={cpuHistory} 
            title="CPU Usage" 
            yAxisLabel="CPU Usage (%)" 
            color="rgb(59, 130, 246)" 
          />
          <MetricChart 
            data={memHistory} 
            title="Memory Usage" 
            yAxisLabel="Memory Usage (%)" 
            color="rgb(168, 85, 247)" 
          />
          <MetricChart 
            data={netUpHistory} 
            title="Network Upload" 
            yAxisLabel="Upload (B/s)" 
            color="rgb(34, 197, 94)" 
          />
          <MetricChart 
            data={netDownHistory} 
            title="Network Download" 
            yAxisLabel="Download (B/s)" 
            color="rgb(249, 115, 22)" 
          />
        </div>
      </div>

      {/* Processes Section */}
      <div className="space-y-4">
        <ProcessList processes={details.processes || []} />
      </div>
    </div>
  );
};