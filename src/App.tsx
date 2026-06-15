import { useState, useEffect } from 'react';
import { Sidebar, TabKey } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { GlobalSearch } from './components/GlobalSearch';
import { Dashboard } from './pages/Dashboard';
import { Shipments } from './pages/Shipments';
import { Carriers } from './pages/Carriers';
import { Analytics } from './pages/Analytics';
import { Exceptions } from './pages/Exceptions';
import { Settings } from './pages/Settings';
import { cn } from './lib/utils';
import { LayoutDashboard, Package, Truck, AlertTriangle, Settings as SettingsIcon } from 'lucide-react';

const MOB_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'shipments', label: 'Shipments', icon: Package },
  { id: 'carriers', label: 'Carriers', icon: Truck },
  { id: 'exceptions', label: 'Alerts', icon: AlertTriangle },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
] as const;

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [globalSearchId, setGlobalSearchId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Monitor screensize to implement elegant mobile drawer adaptation
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false); // Collapsed by default on mobile platforms
      } else {
        setSidebarOpen(true); // Open by default on desktop viewports
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Simulate initial load sequence
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Global hotkey
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-bg-base flex flex-col items-center justify-center gap-4 text-text-primary">
        <div className="w-12 h-12 border-4 border-bg-elevated border-t-accent-primary rounded-full animate-spin"></div>
        <p className="font-mono text-sm text-text-muted animate-pulse tracking-widest uppercase">Initializing Kibuti API...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-bg-base text-text-primary font-sans text-[13px] pb-[60px] md:pb-0">
      {/* Topbar Header */}
      <div className="h-[60px] flex-shrink-0 z-10 relative">
        <Topbar 
          onSearchClick={() => setShowSearch(true)} 
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
      </div>
      
      {/* Main Body - Sidebar + Content Area */}
      <div className="flex flex-1 overflow-hidden relative min-w-0">
        
        {/* Soft Dim-Out Backdrop on Mobile Drawer Open */}
        {isMobile && sidebarOpen && (
          <div 
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 transition-opacity duration-300 animate-in fade-in"
          />
        )}

        {/* Animated Sidebar Container (traditional desktop or slide-out drawer on mobile) */}
        <div 
          className={cn(
            "transition-all duration-300 ease-in-out bg-bg-surface flex-shrink-0",
            isMobile 
              ? "fixed inset-y-0 left-0 w-[240px] h-full z-40 border-r border-bg-elevated shadow-2xl" 
              : "relative h-full border-r border-r-bg-elevated/40"
          )}
          style={{ 
            width: isMobile ? '240px' : (sidebarOpen ? '220px' : '0px'),
            transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none'
          }}
        >
          <Sidebar activeTab={activeTab} onTabChange={(tab) => {
            setActiveTab(tab);
            if (isMobile) {
              setSidebarOpen(false); // Clean drawer-auto-close on selection on mobile
            }
          }} />
        </div>
        
        {/* Scrollable Page Content Container */}
        <main className="flex-1 overflow-y-auto w-full relative min-w-0 bg-bg-base">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'shipments' && <Shipments initialSelectedId={globalSearchId} onClearSelection={() => setGlobalSearchId(null)} />}
          {activeTab === 'carriers' && <Carriers />}
          {activeTab === 'analytics' && <Analytics />}
          {activeTab === 'exceptions' && <Exceptions />}
          {activeTab === 'settings' && <Settings />}
        </main>
      </div>

      {/* Floating Bottom Navigation Bar for Thumbs-Only Access on Mobile Viewports */}
      <div className="fixed bottom-0 left-0 right-0 h-[60px] bg-bg-surface/90 backdrop-blur-md border-t border-bg-elevated/65 flex md:hidden items-center justify-around px-2 z-20 shadow-[0_-4px_24px_rgba(0,0,0,0.15)]">
        {MOB_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 py-1 px-2.5 transition-all text-center rounded-lg relative",
                isActive 
                  ? "text-accent-primary font-bold scale-105" 
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              <div className={cn(
                "p-1 rounded-md transition-colors",
                isActive ? "bg-accent-primary/10" : ""
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
              {item.id === 'exceptions' && (
                <span className="absolute top-1.5 right-3 w-4 h-4 rounded-full bg-accent-warning text-bg-base text-[9px] font-mono font-bold flex items-center justify-center shadow-sm">
                  3
                </span>
              )}
            </button>
          );
        })}
      </div>

      {showSearch && (
        <GlobalSearch 
          onClose={() => setShowSearch(false)} 
          onSelectResult={(shipment) => {
            setActiveTab('shipments');
            setGlobalSearchId(shipment.id);
          }}
        />
      )}
    </div>
  );
}

