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
import { 
  LayoutDashboard, 
  Package, 
  Truck, 
  Activity, 
  AlertTriangle, 
  Settings as SettingsIcon,
  X,
  LogOut,
  User,
  ExternalLink
} from 'lucide-react';

const MOB_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'shipments', label: 'Shipments', icon: Package },
  { id: 'carriers', label: 'Carriers', icon: Truck },
  { id: 'analytics', label: 'Analytics', icon: Activity },
  { id: 'exceptions', label: 'Exceptions', icon: AlertTriangle },
] as const;

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [globalSearchId, setGlobalSearchId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [deviceClass, setDeviceClass] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Monitor screensize to implement elegant mobile layout adaptation
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDeviceClass('mobile');
        setSidebarOpen(false);
      } else if (width < 1024) {
        setDeviceClass('tablet');
        setSidebarOpen(true); // Left icon-rail is shown
      } else {
        setDeviceClass('desktop');
        setSidebarOpen(true); // Full sidebar open
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
    }, 1200);
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
        <p className="font-mono text-sm text-text-muted animate-pulse tracking-widest uppercase">Initializing Logi-Core Systems...</p>
      </div>
    );
  }

  const isMobile = deviceClass === 'mobile';
  const isTablet = deviceClass === 'tablet';

  const handleMobileHamburger = () => {
    if (isMobile) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      setSidebarOpen(!sidebarOpen);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-bg-base text-text-primary font-sans text-[13px] relative">
      {/* Topbar Header */}
      <div className="h-[56px] lg:h-[60px] flex-shrink-0 z-10 relative">
        <Topbar 
          onSearchClick={() => setShowSearch(true)} 
          sidebarOpen={sidebarOpen}
          onToggleSidebar={handleMobileHamburger}
          activeTab={activeTab}
        />
      </div>
      
      {/* Main Body - Sidebar + Content Area */}
      <div className="flex flex-1 overflow-hidden relative min-w-0">
        
        {/* Left Sidebar Frame (For Tablet and Desktop only) */}
        {!isMobile && (
          <div 
            className={cn(
              "transition-all duration-300 ease-in-out bg-bg-surface flex-shrink-0 relative h-full border-r border-bg-elevated/40",
              isTablet ? "w-[56px]" : (sidebarOpen ? "w-[240px]" : "w-0 overflow-hidden")
            )}
          >
            <Sidebar 
              activeTab={activeTab} 
              onTabChange={(tab) => {
                setActiveTab(tab);
              }} 
            />
          </div>
        )}

        {/* Full-Screen Hamburger Drawer Overlay (Mobile Spec Only) */}
        {isMobile && (
          <>
            {/* Backdrop shim overlay */}
            <div 
              className={cn(
                "fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity duration-300 pointer-events-none opacity-0",
                mobileMenuOpen && "opacity-100 pointer-events-auto"
              )}
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Slide-out Menu Panel (280px wide) */}
            <div 
              className={cn(
                "fixed inset-y-0 left-0 w-[280px] h-full bg-bg-surface z-50 border-r border-bg-elevated",
                "shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-out",
                mobileMenuOpen ? "transform translate-x-0" : "transform -translate-x-full"
              )}
            >
              {/* Overlay Top bar with Logo & X Close trigger */}
              <div className="p-4 border-b border-bg-elevated flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-accent-primary flex items-center justify-center text-white font-extrabold text-sm">L</div>
                  <div>
                    <span className="font-mono font-bold text-xs tracking-wider text-accent-primary block leading-none">LOGI-CORE</span>
                    <span className="text-[9px] text-text-muted">OPS DRAWER</span>
                  </div>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 hover:bg-bg-elevated rounded-full text-text-muted hover:text-text-primary"
                  aria-label="Close navigation drawer"
                >
                  <X className="w-5 h-5 text-text-primary" />
                </button>
              </div>

              {/* Side Nav Menu with Badges */}
              <nav className="flex-1 py-4 px-3 flex flex-col gap-1 overflow-y-auto">
                {MOB_ITEMS.map((item) => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors font-medium",
                        isActive 
                          ? "bg-bg-elevated text-text-primary font-bold shadow-sm" 
                          : "text-text-muted hover:text-text-primary hover:bg-bg-elevated/40"
                      )}
                    >
                      <Icon className={cn("w-[18px] h-[18px]", isActive ? "text-accent-primary" : "text-text-muted")} />
                      <span className="text-sm">{item.label}</span>
                      {item.id === 'exceptions' && (
                        <span className="ml-auto bg-accent-warning/20 text-accent-warning text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                          3
                        </span>
                      )}
                    </button>
                  );
                })}

                <div className="h-px bg-bg-elevated/60 my-2" />

                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setMobileMenuOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors font-medium",
                    activeTab === 'settings'
                      ? "bg-bg-elevated text-text-primary font-bold shadow-sm"
                      : "text-text-muted hover:text-text-primary hover:bg-bg-elevated/40"
                  )}
                >
                  <SettingsIcon className={cn("w-[18px] h-[18px]", activeTab === 'settings' ? "text-accent-primary" : "text-text-muted")} />
                  <span className="text-sm">Settings</span>
                </button>
              </nav>

              {/* User profile card footer */}
              <div className="p-4 border-t border-bg-elevated bg-bg-base/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#334155] border border-bg-elevated overflow-hidden">
                    <img src="/api/placeholder/32/32" className="w-full h-full object-cover" alt="User Profile Image" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs leading-none">A. Okoro</h4>
                    <p className="text-[10px] text-text-muted mt-0.5 font-mono">Ops Manager</p>
                  </div>
                </div>
                <button 
                  onClick={() => alert("Closing secure session ...")}
                  className="p-1.5 hover:bg-bg-elevated rounded-md text-text-muted hover:text-accent-danger transition-colors"
                  title="Sign out of Logi-Core"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Scrollable Page Content Container */}
        {/* Main padding bottom for mobile is added here so it NEVER overlaps with the bottom bar */}
        <main className="flex-1 overflow-y-auto w-full relative min-w-0 bg-bg-base pb-[72px] md:pb-0">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'shipments' && <Shipments initialSelectedId={globalSearchId} onClearSelection={() => setGlobalSearchId(null)} />}
          {activeTab === 'carriers' && <Carriers />}
          {activeTab === 'analytics' && <Analytics />}
          {activeTab === 'exceptions' && <Exceptions />}
          {activeTab === 'settings' && <Settings />}
        </main>
      </div>

      {/* Floating Bottom Navigation Bar for Thumbs-Only Access on Mobile Viewports */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 h-[56px] bg-bg-surface border-t border-[rgba(255,255,255,0.08)] flex items-center justify-around px-2 z-40 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_24px_rgba(0,0,0,0.30)]">
          {MOB_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="flex flex-col items-center justify-center flex-1 h-full py-1 relative"
                aria-label={`Open page ${item.label}`}
              >
                <div className={cn(
                  "p-1 rounded-md transition-colors",
                  isActive ? "text-accent-primary" : "text-text-muted"
                )}>
                  {isActive ? (
                    <div className="flex flex-col items-center gap-[1px]">
                      <Icon className="w-5 h-5 text-accent-primary" />
                      <span className="text-[9px] font-sans font-extrabold text-accent-primary leading-tight select-none">
                        {item.label}
                      </span>
                    </div>
                  ) : (
                    <Icon className="w-5 h-5 text-text-muted" />
                  )}
                </div>

                {item.id === 'exceptions' && (
                  <span className="absolute top-1.5 right-[22%] w-4 h-4 rounded-full bg-accent-warning text-bg-base text-[9px] font-mono font-bold flex items-center justify-center shadow-md">
                    3
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

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

