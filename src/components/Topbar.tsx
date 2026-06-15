import { Bell, Search, Menu } from 'lucide-react';
import { useState } from 'react';

export function Topbar({ 
  onSearchClick, 
  onToggleSidebar, 
  sidebarOpen 
}: { 
  onSearchClick: () => void; 
  onToggleSidebar: () => void; 
  sidebarOpen: boolean; 
}) {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="h-[60px] bg-bg-surface border-b border-bg-elevated flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-2 w-auto md:w-[240px] font-mono font-bold text-[18px] text-accent-primary tracking-tight shrink-0">
        <button 
          onClick={onToggleSidebar}
          className="p-1.5 hover:bg-bg-elevated rounded transition-all active:scale-95 text-text-muted hover:text-text-primary mr-0.5"
          aria-label={sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
          title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          id="sidebar-toggle-btn"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded bg-accent-primary flex items-center justify-center text-white font-sans shrink-0">L</div>
        <span className="truncate hidden sm:block">GLOBAL LOGISTICS</span>
      </div>

      <div className="flex-1 flex max-w-[280px] sm:max-w-md mx-2 sm:mx-4" onClick={onSearchClick}>
        <div className="w-full bg-bg-elevated rounded flex items-center justify-between p-2 cursor-text text-text-muted text-[12px] hover:ring-1 hover:ring-accent-primary/60 hover:text-text-primary transition-all group" id="topbar-search-trigger">
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-text-muted group-hover:text-accent-primary transition-colors shrink-0" />
            <span className="truncate">
              <span className="hidden md:inline">Search Waybills, Carriers, Cities...</span>
              <span className="md:hidden">Search...</span>
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1 font-mono text-[10px] bg-bg-base px-1.5 py-0.5 rounded border border-bg-elevated/80 text-text-muted shadow-sm select-none shrink-0">
            <span className="text-[9px]">Ctrl</span>
            <span>+</span>
            <span>K</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5 text-[13px] shrink-0">
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative text-[18px] hover:scale-110 transition-transform flex items-center p-1"
          >
            🔔
            <span className="absolute top-0 right-0 w-2 h-2 bg-accent-warning rounded-full border border-bg-surface"></span>
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-72 sm:w-80 bg-bg-surface border border-bg-elevated rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 text-[13px]">
              <div className="flex items-center justify-between px-4 py-3 border-b border-bg-elevated">
                <h3 className="font-medium">Notifications</h3>
                <button className="text-[11px] text-accent-primary hover:underline">Mark all read</button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {[1, 2, 3].map((_, i) => (
                  <div key={i} className="px-4 py-3 border-b border-bg-elevated last:border-0 hover:bg-bg-elevated/50 cursor-pointer transition-colors">
                    <p className="font-medium text-text-primary mb-0.5">Customs Hold: MTC-2026-4829</p>
                    <p className="text-[12px] text-text-muted line-clamp-2">Shipment delayed at Cairo regional hub. Documentation pending.</p>
                    <p className="text-[10px] text-text-muted mt-2 font-mono">15m ago</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right hidden md:flex flex-col justify-center">
            <span className="font-semibold leading-[1.2] text-[12px]">A. Okoro</span>
            <span className="text-[10px] text-text-muted leading-[1.2]">Ops Manager</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#334155] border border-bg-elevated cursor-pointer shrink-0 text-text-muted flex items-center justify-center overflow-hidden">
            <img src="/api/placeholder/32/32" className="w-full h-full object-cover" alt="Avatar"/>
          </div>
        </div>
      </div>
    </header>
  );
}
