

// Matches Go's models.HostOverviewData
export interface HostOverview{
    id: string;
    hostname: string;
    status: 'online'|'offline'|'warning';
    cpuUsage: number;
    ramUsage: number;
    diskUsage: number;
    networkUpload: number;
    networkDownload: number;
    // uptimeSeconds: number;
    lastSeen: string;
}

// Matches Go's models.CPUDetails
export interface CPUDetails{
   cores: number;
   model_name: string; 
}

// Matches Go's models.MemoryDetails
export interface MemoryDetails{
    total: number;
    free: number;
    used: number;
}

// Matches Go's models.RootDiskDetails
export interface DiskDetails{ // Renamed from RootDiskDetails for simplicity on frontend
    path: string;
    total_gb: number;
    used_gb: number;
    free_gb: number;
    usage_percent: number;
}

// Matches Go's models.OSLiteralDetails
export interface OSDetails {
    name: string;
    version: string;
    kernel: string;
    kernelArch: string;
}

// Matches Go's models.ProcessDetail
export interface ProcessDetail {
  pid: number;
  name: string;
  cpuUsage: number;
  memoryUsage: number;
  // username: string; 
}

// Matches Go's models.HostDetailsData
export interface HostDetails {
  id: string;
  hostname: string;
  status: 'online' | 'offline' | 'warning';
  // uptimeSeconds: number; // Assuming we'll add this back
  lastSeen: string; // ISO date string
  cpu: CPUDetails;
  memory: MemoryDetails;
  disk: DiskDetails;
  os: OSDetails;
  processes?: ProcessDetail[];
  cpuUsage: number;
  ramUsage: number;
  networkUpload: number;
  networkDownload: number;
}

// Matches Go's models.MetricPoint
export interface MetricPoint {
  timestamp: string; // Formatted time string like "HH:MM"
  value: number;
}
