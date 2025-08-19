# System Stats Admin Panel

A modern React-based web admin panel for monitoring system statistics across multiple hosts. This application provides real-time visualization of system metrics with a sleek dark theme inspired by shadcn/ui design system.

## Description

This admin panel is the frontend component of a comprehensive system monitoring solution that enables real-time tracking and visualization of server infrastructure. The application connects to a Go-based backend service ([system-stats-monitoring](https://github.com/4Noyis/system-stats-monitoring)) to provide enterprise-grade monitoring capabilities.

### **System Architecture**
- **Frontend**: React TypeScript SPA (this repository)
- **Backend**: Go REST API service ([system-stats-monitoring repo](https://github.com/4Noyis/system-stats-monitoring))
- **Communication**: HTTP REST API with JSON data exchange
- **Data Flow**: Real-time polling with automatic refresh cycles

### **Use Cases**
- **DevOps Teams**: Monitor production server health and performance
- **System Administrators**: Track resource utilization across multiple hosts  
- **Infrastructure Management**: Centralized dashboard for server fleet monitoring
- **Performance Analysis**: Historical data visualization for capacity planning
- **Incident Response**: Quick identification of performance bottlenecks and resource issues

### **Key Capabilities**
- **Multi-Host Monitoring**: Centralized view of distributed server infrastructure
- **Real-Time Data**: Live metrics with configurable refresh intervals
- **Historical Analytics**: Time-series data for trend analysis and forecasting
- **Resource Tracking**: CPU, memory, disk, and network utilization monitoring
- **Process Monitoring**: Real-time process list with resource consumption details
- **Status Management**: Automated health checks with visual status indicators

![Dashboard Overview](./dashboard.png)

## Features

### **Dashboard Overview**
- **Host Grid**: Visual cards displaying all monitored hosts with status indicators
- **Real-time Metrics**: Live CPU, memory, disk usage, and network activity
- **Status Monitoring**: Online/offline/warning states with color-coded indicators
- **Quick Stats**: Aggregated metrics across all hosts

### **Detailed Host Monitoring**
- **Performance Charts**: Interactive SVG charts showing historical data
- **System Information**: Comprehensive OS, CPU, memory, and disk details
- **Process Monitoring**: Real-time process list with resource usage
- **Network Activity**: Upload/download speeds with visual indicators

![Host Detail View 1](./host-detail-1.png)

### **Modern UI/UX**
- **Dark Theme**: Professional shadcn/ui inspired design
- **Responsive Layout**: Mobile-first design with Tailwind CSS
- **Real-time Updates**: Automatic polling every 10 seconds
- **Smooth Animations**: Hover effects and transitions

![Host Detail View 2](./host-detail-2.png)

### **Advanced Analytics**
- **Historical Data**: Time-series charts for performance trends
- **Resource Utilization**: Color-coded usage indicators
- **Process Insights**: Top resource-consuming processes
- **Network Monitoring**: Real-time bandwidth usage

![Host Detail View 3](./host-detail-3.png)

## Tech Stack

- **Frontend Framework**: React 19 + TypeScript
- **Build Tool**: Vite 6 with hot reload
- **Styling**: Tailwind CSS 4 with custom design system
- **UI Components**: Custom shadcn/ui inspired components
- **Routing**: React Router DOM for SPA navigation
- **State Management**: React hooks with polling
- **Charts**: Custom SVG-based charts
- **Backend Integration**: REST API with Go backend

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Go backend server from [system-stats-monitoring](https://github.com/berenalp/system-stats-monitoring) repository
- Backend running on `http://localhost:8080` (configurable)

### Complete System Setup

#### 1. **Backend Setup** (Required First)
```bash
# Clone and setup the Go backend
git clone https://github.com/berenalp/system-stats-monitoring.git
cd system-stats-monitoring
# Follow backend setup instructions in its README
go run main.go  # Backend will run on :8080
```

#### 2. **Frontend Setup** (This Repository)
```bash
# Clone the frontend repository
git clone <this-repository-url>
cd system-stats-admin_panel

# Install dependencies
npm install

# Start development server
npm run dev
```
The application will be available at `http://localhost:5173`

#### 3. **Production Build**
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Quick Start (Development)
1. Start the Go backend server first (port 8080)
2. Start the React frontend (port 5173)
3. Open `http://localhost:5173` in your browser

## Architecture

### Project Structure
```
src/
├── components/          # Reusable UI components
│   └── HostCard.tsx    # Host overview cards
├── pages/              # Route components
│   ├── DashboardOverviewPage.tsx
│   └── HostDetailPage.tsx
├── services/           # API integration
│   └── apiClient.ts    # HTTP client with error handling
├── types/              # TypeScript definitions
│   └── api.ts          # API response interfaces
├── hooks/              # Custom React hooks
│   └── useInterval.ts  # Polling hook
└── styles/
    └── index.css       # Global styles and theme
```

### Key Features
- **Real-time Polling**: Automatic data refresh using custom `useInterval` hook
- **Error Handling**: Comprehensive error states with retry functionality  
- **Type Safety**: Full TypeScript coverage matching Go backend models
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Performance Optimized**: Efficient re-renders with React best practices

## Usage

### Dashboard Navigation
1. **Main Dashboard**: View all monitored hosts at a glance
2. **Host Details**: Click any host card to view detailed metrics
3. **Real-time Data**: Metrics update automatically every 10 seconds
4. **Back Navigation**: Easy navigation between views

### API Integration
The frontend connects to the Go backend service ([system-stats-monitoring](https://github.com/berenalp/system-stats-monitoring)):

- **Base URL**: `http://localhost:8080/api/dashboard`
- **Authentication**: None (configurable in backend)
- **Data Format**: JSON with TypeScript interfaces matching Go models

#### API Endpoints:
- `GET /hosts/overview` - Retrieve all monitored hosts with current metrics
- `GET /host/{id}/details` - Get detailed information for a specific host
- `GET /host/{id}/metrics/{metric}` - Fetch historical time-series data
  - Supported metrics: `cpu_usage_percent`, `mem_usage_percent`, `net_upload_bytes_sec`, `net_download_bytes_sec`
  - Query parameters: `range` (1h, 30m, etc.), `aggregate` (30s, 1m, etc.)

#### Error Handling:
- Graceful degradation when backend is unavailable
- Cached data display with error indicators
- Automatic retry mechanisms with exponential backoff

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style
- ESLint configuration for React and TypeScript
- Consistent component patterns and naming
- TypeScript strict mode enabled
- Tailwind CSS for all styling

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request