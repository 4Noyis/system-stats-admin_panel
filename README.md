# System Stats Admin Panel

**Admin Web Panel (Conceptual - to be fully implemented by the user):**
- Displays an overview of all monitored hosts and their current status.
- Provides detailed views for individual hosts, including historical data charts.

## How it works with Systen Stats Monitoring Project
1.  **Fetches Data:** A React-based Single Page Application (SPA).
    - On load, it fetches an overview of all hosts from the server (`/api/dashboard/hosts/overview`).
    - When a user views a specific host, it fetches detailed metrics (`/api/dashboard/host/:hostId/details`) and historical data for charts (`/api/dashboard/host/:hostId/metrics/:metricName`).
2.  **Visualizes Data:**
    - Displays host summaries in cards.
    - Shows detailed pages with current stats, OS/hardware info, process lists, and time-series charts for CPU, memory, and network usage.
3.  **Polls for Updates:** Periodically re-fetches data from the server API to keep the displayed metrics relatively up-to-date.