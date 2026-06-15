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
    <aside className="w-full h-full bg-bg-surface border-r border-bg-elevated flex flex-col flex-shrink-0 py-6 text-[13px]">
      <nav className="flex-1 flex flex-col gap-2">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'flex items-center gap-3 px-6 py-2.5 transition-all duration-200 w-full text-left border-l-[3px]',
                isActive 
                  ? 'bg-bg-elevated text-text-primary border-accent-primary' 
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated/20 border-transparent'
              )}
            >
              <Icon className={cn('w-[18px] h-[18px]', isActive ? 'text-text-primary' : 'text-text-muted')} />
              <span>{item.label}</span>
              {item.id === 'exceptions' && (
                <span className="ml-auto bg-accent-warning/20 text-accent-warning text-[10px] font-mono px-1.5 py-0.5 rounded">
                  3
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-2">
        <button 
          onClick={() => onTabChange('settings')}
          className={cn(
            'flex items-center gap-3 px-6 py-2.5 transition-all duration-200 w-full text-left border-l-[3px]',
            activeTab === 'settings'
              ? 'bg-bg-elevated text-text-primary border-accent-primary font-semibold' 
              : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated/20 border-transparent'
          )}
        >
          <Settings className={cn('w-[18px] h-[18px]', activeTab === 'settings' ? 'text-text-primary' : 'text-text-muted')} />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}
