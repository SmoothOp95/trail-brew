import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content — offset by sidebar width on desktop */}
      <div className="flex-1 min-w-0 lg:pl-60">
        {/* Mobile top bar — hamburger only */}
        <div className="lg:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-brew-bg/90 backdrop-blur-sm border-b border-brew-border">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
            className="text-brew-text-dim hover:text-brew-text transition-colors"
          >
            <Menu size={22} />
          </button>
          <span className="font-black text-base tracking-tight bg-gradient-to-br from-brew-accent to-[#D4F27A] bg-clip-text text-transparent">
            Trail Brew
          </span>
        </div>

        <Outlet />
      </div>
    </div>
  );
}
