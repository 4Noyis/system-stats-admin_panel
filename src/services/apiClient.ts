
import type { HostOverview, HostDetails, MetricPoint } from '../types/api';

const API_BASE_URL = 'http://localhost:8080/api/dashboard'; // Go server URL

async function fetchWithErrorHandling<T>(url: string): Promise<T> {
    const response = await fetch(url)
    if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    return response.json() as Promise<T>;
}

export const getHostsOverview = (): Promise<HostOverview[]> => {
  return fetchWithErrorHandling<HostOverview[]>(`${API_BASE_URL}/hosts/overview`);
};

export const getHostDetails = (hostId: string): Promise<HostDetails> => {
  return fetchWithErrorHandling<HostDetails>(`${API_BASE_URL}/host/${hostId}/details`);
};

export const getHostMetricHistory = (
  hostId: string,
  metricName: 'cpu_usage_percent' | 'mem_usage_percent' | 'net_upload_bytes_sec' | 'net_download_bytes_sec', // Add more as needed
  range: string = '1h', // e.g., '1h', '30m'
  aggregate: string = '30s' // e.g., '30s', '1m'
): Promise<MetricPoint[]> => {
  return fetchWithErrorHandling<MetricPoint[]>(
    `${API_BASE_URL}/host/${hostId}/metrics/${metricName}?range=${range}&aggregate=${aggregate}`
  );
};