import { Bell, Search, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';

export function Topbar({ 
  onSearchClick, 
  onToggleSidebar, 
  sidebarOpen,
  activeTab
}: { 
  onSearchClick: () => void; 
  onToggleSidebar: () => void; 
  sidebarOpen: boolean; 
  activeTab: string;
}) {
  const [showNotifications, setShowNotifications] = useState(false);

  const getPageTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard': return 'Dashboard';
      case 'shipments': return 'Master Manifest';
      case 'carriers': return 'System Dispatches';
      case 'analytics': return 'Analytics Hub';
      case 'exceptions': return 'Incident Log';
      case 'settings': return 'System Config';
      default: return 'Control Tower';
    }
  };

  const notifications = [
    { title: "Customs Hold Alert", body: "Consignment MTC-2026-4829 delayed at Cairo regional hub. Documentation pending.", time: "12m ago", unread: true },
    { title: "Battery SLA Violation", body: "Sendbox vehicle speed deviation flagged on Lagos priority expressway segment.", time: "42m ago", unread: true },
    { title: "Dispatch Confirmed", body: "Waybill MTC-2026-9041 loaded on FedEx air freight node. Flight transit initiated.", time: "2h ago", unread: false },
  ];

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden lg:flex h-[60px] bg-bg-surface border-b border-bg-elevated items-center justify-between px-6 z-20 relative">
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
          <div className="w-8 h-8 rounded bg-accent-primary flex items-center justify-center text-white font-sans shrink-0 font-bold">L</div>
          <span className="truncate">CONTROL TOWER</span>
        </div>

        <div className="flex-1 flex max-w-md mx-6" onClick={onSearchClick}>
          <div className="w-full bg-bg-elevated rounded flex items-center justify-between p-2 cursor-text text-text-muted text-[12px] hover:ring-1 hover:ring-accent-primary/60 hover:text-text-primary transition-all group" id="topbar-search-trigger">
            <div className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-text-muted group-hover:text-accent-primary transition-colors shrink-0" />
              <span className="truncate">Search Waybills, Carriers, Cities...</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-[10px] bg-bg-base px-1.5 py-0.5 rounded border border-bg-elevated/80 text-text-muted shadow-sm select-none shrink-0">
              <span className="text-[9px]">Ctrl</span>
              <span>+</span>
              <span>K</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-5 text-[13px] shrink-0">
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative text-[18px] hover:scale-110 child-glow transition-transform flex items-center p-1.5 hover:bg-bg-elevated rounded"
            >
              🔔
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-warning rounded-full border border-bg-surface"></span>
            </button>
            
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40 hidden lg:block" onClick={() => setShowNotifications(false)} />
                <div className="absolute right-0 mt-3 w-80 bg-bg-surface border border-bg-elevated rounded-lg shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-bg-elevated">
                    <h3 className="font-bold text-xs uppercase tracking-wide">Notifications</h3>
                    <button className="text-[11px] text-accent-primary hover:underline font-bold" onClick={() => setShowNotifications(false)}>Clear</button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-bg-elevated/30">
                    {notifications.map((n, i) => (
                      <div key={i} className="px-4 py-3 hover:bg-bg-elevated/40 cursor-pointer transition-colors flex gap-2.5 items-start">
                        {n.unread && <span className="w-2 h-2 rounded-full bg-accent-warning shrink-0 mt-1.5" />}
                        <div className="flex-1">
                          <p className="font-bold text-text-primary text-xs leading-none mb-1">{n.title}</p>
                          <p className="text-[11px] text-text-muted leading-relaxed font-sans">{n.body}</p>
                          <p className="text-[9px] text-text-muted mt-1.5 font-mono">{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right flex flex-col justify-center">
              <span className="font-semibold leading-[1.2] text-[12px]">A. Okoro</span>
              <span className="text-[10px] text-text-muted leading-[1.2]">Ops Manager</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#334155] border border-bg-elevated cursor-pointer shrink-0 text-text-muted flex items-center justify-center overflow-hidden">
              <img src="/api/placeholder/32/32" className="w-full h-full object-cover" alt="Avatar"/>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile/Tablet Header (0px - 1023px) */}
      <header className="flex lg:hidden h-[56px] bg-bg-surface border-b border-bg-elevated items-center justify-between px-4 relative z-30">
        {/* Left: Hamburger */}
        <button 
          onClick={onToggleSidebar}
          className="p-2 hover:bg-bg-elevated rounded transition-all active:scale-95 text-text-muted hover:text-text-primary h-10 w-10 flex items-center justify-center animate">
          <Menu className="w-6 h-6 text-text-primary" />
        </button>

        {/* Center: Centered page title */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <h1 className="font-sans font-bold text-[15px] text-text-primary tracking-tight whitespace-nowrap uppercase">
            {getPageTitle(activeTab)}
          </h1>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {/* Mobile Search Button */}
          <button 
            onClick={onSearchClick}
            className="p-2 hover:bg-bg-elevated rounded text-text-muted hover:text-text-primary h-10 w-10 flex items-center justify-center"
            aria-label="Open global system search"
          >
            <Search className="w-5 h-5 text-text-primary" />
          </button>

          {/* Bell Notification Spot */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 hover:bg-bg-elevated rounded text-[18px] h-10 w-10 flex items-center justify-center relative"
              aria-label="Notifications center"
            >
              🔔
              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-accent-warning rounded-full border border-bg-surface"></span>
            </button>
            
            {showNotifications && (
              <>
                {/* Mobile Fullscreen slide up Sheet */}
                <div 
                  className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 lg:hidden"
                  onClick={() => setShowNotifications(false)}
                />
                
                <div className="fixed bottom-0 left-0 right-0 max-h-[82vh] bg-bg-surface border-t border-bg-elevated rounded-t-2xl shadow-2xl z-50 flex flex-col animate-in slide-in-from-bottom duration-300 lg:hidden pb-safe">
                  {/* Pull notch */}
                  <div className="w-10 h-1 bg-bg-elevated rounded-full mx-auto my-3 shrink-0" />
                  
                  <div className="flex items-center justify-between px-5 pb-3 border-b border-bg-elevated shrink-0">
                    <h3 className="font-bold text-sm uppercase tracking-wide text-text-primary">Notifications</h3>
                    <div className="flex items-center gap-3">
                      <button className="text-xs text-accent-primary hover:underline font-bold" onClick={() => setShowNotifications(false)}>Clear</button>
                      <button 
                        onClick={() => setShowNotifications(false)}
                        className="p-1 hover:bg-bg-elevated rounded text-text-muted"
                      >
                        <X className="w-5 h-5 text-text-primary" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-bg-elevated/40 pb-6">
                    {notifications.map((n, i) => (
                      <div key={i} className="px-5 py-4 hover:bg-bg-elevated/30 flex gap-3 items-start">
                        {n.unread && <span className="w-2.5 h-2.5 rounded-full bg-accent-warning shrink-0 mt-1.5" />}
                        <div className="flex-1">
                          <p className="font-bold text-text-primary text-xs leading-none mb-1.5">{n.title}</p>
                          <p className="text-[11.5px] text-text-secondary leading-relaxed font-sans">{n.body}</p>
                          <p className="text-[10px] text-text-muted mt-2 font-mono">{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="w-8 h-8 rounded-full bg-[#334155] border border-bg-elevated cursor-pointer shrink-0 text-text-muted flex items-center justify-center overflow-hidden ml-1">
            <img src="/api/placeholder/32/32" className="w-full h-full object-cover" alt="User Profile Avatar" />
          </div>
        </div>
      </header>
    </>
  );
}
