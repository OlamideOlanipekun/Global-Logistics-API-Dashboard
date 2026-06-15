import { Calendar, LayoutDashboard, Package, Truck, Activity, AlertTriangle, Settings, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';

export type TabKey = 'dashboard' | 'shipments' | 'carriers' | 'analytics' | 'exceptions' | 'settings';

interface SidebarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'shipments', label: 'Shipments', icon: Package },
  { id: 'carriers', label: 'Carriers', icon: Truck },
  { id: 'analytics', label: 'Analytics', icon: Activity },
  { id: 'exceptions', label: 'Exceptions', icon: AlertTriangle },
] as const;

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="w-full h-full bg-bg-surface border-r border-bg-elevated flex flex-col py-6 text-[13px]">
      {/* Brand logo specifically for Sidebar inside desktop context */}
      <div className="px-6 mb-6 pb-4 border-b border-bg-elevated/40 lg:flex hidden items-center gap-2">
        <div className="w-7 h-7 rounded bg-accent-primary flex items-center justify-center text-white font-sans font-extrabold text-xs">L</div>
        <span className="font-mono font-bold text-sm text-text-primary tracking-wider">LOGI-CORE</span>
      </div>

      <nav className="flex-1 flex flex-col gap-1.5 px-2 lg:px-0">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              title={item.label}
              className={cn(
                'flex items-center gap-3 transition-all duration-200 w-full text-left',
                'lg:px-6 lg:py-2.5 lg:border-l-[3px] lg:justify-start lg:rounded-none',
                'justify-center p-3 rounded-lg border-l-0',
                isActive 
                  ? 'bg-bg-elevated text-text-primary lg:border-accent-primary lg:bg-bg-elevated' 
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated/20 lg:border-transparent'
              )}
            >
              <Icon className={cn('w-[18px] h-[18px] shrink-0', isActive ? 'text-accent-primary lg:text-text-primary' : 'text-text-muted')} />
              <span className="hidden lg:inline">{item.label}</span>
              {item.id === 'exceptions' && (
                <span className="ml-auto bg-accent-warning/20 text-accent-warning text-[10px] font-mono px-1.5 py-0.5 rounded hidden lg:inline">
                  3
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-1.5 px-2 lg:px-0">
        <button 
          onClick={() => onTabChange('settings')}
          title="Settings"
          className={cn(
            'flex items-center gap-3 transition-all duration-200 w-full text-left',
            'lg:px-6 lg:py-2.5 lg:border-l-[3px] lg:justify-start lg:rounded-none',
            'justify-center p-3 rounded-lg border-l-0',
            activeTab === 'settings'
              ? 'bg-bg-elevated text-text-primary lg:border-accent-primary font-semibold' 
              : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated/20 lg:border-transparent'
          )}
        >
          <Settings className={cn('w-[18px] h-[18px] shrink-0', activeTab === 'settings' ? 'text-accent-primary lg:text-text-primary' : 'text-text-muted')} />
          <span className="hidden lg:inline">Settings</span>
        </button>
      </div>
    </aside>
  );
}
