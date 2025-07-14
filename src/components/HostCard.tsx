import React from "react";
import { Link } from "react-router-dom";
import type { HostOverview } from "../types/api";

interface HostCardProps {
  host: HostOverview;
}

const formatNetworkSpeed = (bytesPerSecond: number): string => {
  if (bytesPerSecond < 1024) return `${bytesPerSecond.toFixed(1)} B/s`;
  const kbps = bytesPerSecond / 1024;
  if (kbps < 1024) return `${kbps.toFixed(1)} KB/s`;
  const mbps = kbps / 1024;
  return `${mbps.toFixed(1)} MB/s`;
};

const getUsageColor = (percentage: number): string => {
  if (percentage >= 90) return "text-red-500";
  if (percentage >= 75) return "text-yellow-500";
  return "text-green-500";
};

const ProgressBar: React.FC<{ value: number; max?: number; className?: string }> = ({ 
  value, 
  max = 100, 
  className = "" 
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  const color = percentage >= 90 ? "bg-red-500" : percentage >= 75 ? "bg-yellow-500" : "bg-green-500";
  
  return (
    <div className={`w-full bg-gray-100 rounded-full h-2 ${className}`}>
      <div 
        className={`h-2 rounded-full transition-all duration-300 ${color}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: string; percentage?: number; icon: React.ReactNode }> = ({
  label,
  value,
  percentage,
  icon
}) => (
  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
    <div className="flex-shrink-0 text-gray-600">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-900 truncate">{label}</p>
        <span className={`text-sm font-semibold ${percentage !== undefined ? getUsageColor(percentage) : 'text-gray-900'}`}>
          {value}
        </span>
      </div>
      {percentage !== undefined && (
        <ProgressBar value={percentage} className="mt-1" />
      )}
    </div>
  </div>
);

export const HostCard: React.FC<HostCardProps> = ({ host }) => {
  const statusConfig = {
    online: { 
      color: "bg-green-500", 
      textColor: "text-green-700", 
      bgColor: "bg-green-50 border-green-200",
      icon: "🟢"
    },
    warning: { 
      color: "bg-yellow-500", 
      textColor: "text-yellow-700", 
      bgColor: "bg-yellow-50 border-yellow-200",
      icon: "🟡"
    },
    offline: { 
      color: "bg-red-500", 
      textColor: "text-red-700", 
      bgColor: "bg-red-50 border-red-200",
      icon: "🔴"
    }
  };

  const status = statusConfig[host.status as keyof typeof statusConfig] || statusConfig.offline;

  return (
    <Link to={`/host/${host.id}`} className="block group">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 group-hover:border-blue-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{host.hostname}</h3>
                <p className="text-sm text-gray-600">ID: {host.id}</p>
              </div>
            </div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.textColor}`}>
              <span className={`w-2 h-2 rounded-full mr-2 ${status.color}`}></span>
              <span className="capitalize">{host.status}</span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="space-y-3">
            <MetricCard
              label="CPU Usage"
              value={`${host.cpuUsage.toFixed(1)}%`}
              percentage={host.cpuUsage}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              }
            />
            
            <MetricCard
              label="Memory"
              value={`${host.ramUsage.toFixed(1)}%`}
              percentage={host.ramUsage}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              }
            />
            
            <MetricCard
              label="Disk Usage"
              value={`${host.diskUsage.toFixed(1)}%`}
              percentage={host.diskUsage}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              }
            />
          </div>

          {/* Network Stats */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                </svg>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Upload</p>
                  <p className="text-sm font-medium">{formatNetworkSpeed(host.networkUpload)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                </svg>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Download</p>
                  <p className="text-sm font-medium">{formatNetworkSpeed(host.networkDownload)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Last seen: {new Date(host.lastSeen).toLocaleString()}
            </p>
            <div className="flex items-center text-blue-600 group-hover:text-blue-700 transition-colors">
              <span className="text-sm font-medium mr-1">View Details</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};