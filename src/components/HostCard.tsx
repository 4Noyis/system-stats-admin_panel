import React from "react";
import { Link } from "react-router-dom";
import type { HostOverview } from "../types/api";

interface HostCardProps{
    host:HostOverview;
}

// Helper to format uptime (you'd implement this)
// const formatUptime = (seconds: number | undefined): string => {
//   if (seconds === undefined) return 'N/A';
//   // Your logic to convert seconds to "X days Yh Zm"
//   const d = Math.floor(seconds / (3600*24));
//   // ... more logic
//   return `${d}d ...`;
// };

const formatNetworkSpeed = (bytesPerSecond: number): string => {
  if (bytesPerSecond < 1024) return `${bytesPerSecond.toFixed(1)} B/s`;
  const kbps = bytesPerSecond / 1024;
  if (kbps < 1024) return `${kbps.toFixed(1)} KB/s`;
  const mbps = kbps / 1024;
  return `${mbps.toFixed(1)} MB/s`;
}

export const HostCard: React.FC<HostCardProps> = ({ host }) => {
  // Determine status color based on host.status (Tailwind classes)
  const statusColor =
    host.status === 'online' ? 'bg-green-500' :
    host.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="border p-4 rounded-lg shadow-md bg-card text-card-foreground"> {/* Example shadcn/tailwind classes */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xl font-semibold">{host.hostname}</h3>
        <div className="flex items-center">
          <span className={`w-3 h-3 rounded-full mr-2 ${statusColor}`}></span>
          <span className="capitalize">{host.status}</span>
        </div>
      </div>
      <p>CPU: {host.cpuUsage.toFixed(1)}%</p>
      <p>RAM: {host.ramUsage.toFixed(1)}%</p>
      <p>Disk: {host.diskUsage.toFixed(1)}%</p>
      <p>Net Up: {formatNetworkSpeed(host.networkUpload)}</p>
      <p>Net Down: {formatNetworkSpeed(host.networkDownload)}</p>
      {/* <p>Uptime: {formatUptime(host.uptimeSeconds)}</p> */}
      <p>Last Seen: {new Date(host.lastSeen).toLocaleString()}</p>
      <Link to={`/host/${host.id}`} className="text-blue-500 hover:underline mt-2 inline-block">
        View Details
      </Link>
    </div>
  );
};