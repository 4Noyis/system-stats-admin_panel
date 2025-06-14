import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { DashboardOverviewPage } from './pages/DashboardOverviewPage';
import { HostDetailPage } from './pages/HostDetailPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background text-foreground"> {/* Example shadcn/tailwind classes */}
        <nav className="bg-card p-4 shadow-md">
          <Link to="/" className="text-xl font-bold hover:text-primary">System Monitor</Link>
          {/* Add other nav links if needed */}
        </nav>
        <main>
          <Routes>
            <Route path="/" element={<DashboardOverviewPage />} />
            <Route path="/host/:hostId" element={<HostDetailPage />} />
            {/* You can add a 404 Not Found route here */}
          </Routes>
        </main>
        <footer className="text-center p-4 mt-8 border-t">
          System Stats Monitoring Panel
        </footer>
      </div>
    </Router>
  );
}

export default App;
