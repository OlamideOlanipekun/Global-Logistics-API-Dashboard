import { useState, useEffect } from 'react';
import { MOCK_SHIPMENTS } from '../mockData';
import { Shipment, ShipmentStatus } from '../types';
import { Package, Clock, AlertTriangle, TrendingDown, Eye, Activity, Wifi } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { ShipmentDrawer } from '../components/ShipmentDrawer';

function KpiCard({ title, value, subtext, trend, isWarning }: any) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const duration = 1000;
    const frames = 60;
    const increment = value / frames;
    const interval = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(interval);
      } else {
        setCount(start);
      }
    }, duration / frames);
    return () => clearInterval(interval);
  }, [value]);

  return (
    <div className="bg-bg-surface border border-bg-elevated rounded-lg p-5 flex flex-col justify-between min-h-[110px] transition-all hover:border-bg-elevated/80">
      <div className="text-[11px] text-text-muted uppercase tracking-[0.05em] font-mono mb-2">{title}</div>
      <div className="flex flex-row justify-between items-end gap-2 flex-wrap mt-auto">
        <div className={cn("text-2xl font-mono font-bold leading-none", isWarning ? "text-accent-warning" : "text-text-primary")}>
          {typeof value === 'number' && Number.isInteger(value) ? Math.floor(count).toLocaleString() : count.toFixed(1)}
          {title.includes('Rate') && '%'}
        </div>
        <div className={cn("text-[11px] leading-tight shrink-0 font-medium", trend > 0 ? "text-accent-success" : "text-accent-danger")}>
          {subtext} {trend > 0 ? '↑' : trend < 0 ? '↓' : ''}
        </div>
      </div>
    </div>
  );
}

function AfricaMap({ shipments }: { shipments: Shipment[] }) {
  // Rough bounding box for Africa
  const MIN_LNG = -20;
  const MAX_LNG = 55;
  const MIN_LAT = -35;
  const MAX_LAT = 40;

  const [hoveredData, setHoveredData] = useState<Shipment | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const getXY = (lat: number, lng: number, width=500, height=300) => {
    const x = ((lng - MIN_LNG) / (MAX_LNG - MIN_LNG)) * width;
    const y = ((MAX_LAT - lat) / (MAX_LAT - MIN_LAT)) * height;
    return { x, y };
  };

  const getStatusColor = (status: ShipmentStatus) => {
    switch(status) {
      case 'in_transit': return '#3B82F6';
      case 'delayed': return '#F59E0B';
      case 'delivered': return '#10B981';
      case 'failed': return '#EF4444';
      default: return '#64748B';
    }
  };

  return (
    <div 
      className="relative w-full h-full bg-[#1C2539]/30 rounded-[4px] overflow-hidden flex items-center justify-center p-2 group"
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
      onMouseLeave={() => setHoveredData(null)}
    >
      <svg viewBox="0 0 500 300" className="w-full h-full z-10" strokeLinecap="round" strokeLinejoin="round">
        {/* Simple Africa Polygon Silhouette */}
        <path d="M 140,80 Q 180,80 220,70 Q 260,60 290,80 Q 340,110 350,150 Q 370,200 310,240 Q 270,260 260,280 Q 240,260 200,190 Q 160,160 100,160 Q 70,140 70,110 Z" fill="rgba(28,37,57,0.5)" stroke="#1E293B" strokeWidth="1" strokeOpacity="1"/>

        {/* Selected Routes */}
        {shipments.slice(0, 15).map((s, i) => {
          const start = getXY(s.origin.lat, s.origin.lng);
          const end = getXY(s.destination.lat, s.destination.lng);
          const controlPointsX = (start.x + end.x) / 2;
          const controlPointsY = Math.min(start.y, end.y) - 50;
          return (
            <g key={s.id}>
              {/* Invisible thicker path for easier hovering */}
              <path 
                d={`M ${start.x} ${start.y} Q ${controlPointsX} ${controlPointsY} ${end.x} ${end.y}`} 
                fill="none" 
                stroke="transparent" 
                strokeWidth="16"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredData(s)}
              />
              <path 
                d={`M ${start.x} ${start.y} Q ${controlPointsX} ${controlPointsY} ${end.x} ${end.y}`} 
                fill="none" 
                stroke={getStatusColor(s.status)} 
                strokeWidth={hoveredData?.id === s.id ? "4" : "2"}
                strokeOpacity={hoveredData?.id === s.id ? "1" : "0.6"}
                className={hoveredData?.id === s.id ? "" : "animate-pulse pointer-events-none"}
                style={{ animationDelay: `${i * 200}ms`, animationDuration: '3s' }}
              />
              <circle cx={start.x} cy={start.y} r="2" fill="#64748B" className="pointer-events-none"/>
              <circle cx={end.x} cy={end.y} r="3" fill={getStatusColor(s.status)} className="pointer-events-none"/>
            </g>
          );
        })}
      </svg>

      {/* Floating Tooltip */}
      {hoveredData && (
        <div 
          className="absolute z-30 pointer-events-none bg-bg-surface border border-bg-elevated px-4 py-3 rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-150"
          style={{ left: mousePos.x + 16, top: mousePos.y + 16 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono font-medium text-accent-primary">{hoveredData.id}</span>
            <span className="px-1.5 py-0.5 rounded bg-bg-elevated text-[10px] uppercase text-text-muted">{hoveredData.carrier}</span>
          </div>
          <div className="font-display font-bold mb-1">
            {hoveredData.origin.city} → {hoveredData.destination.city}
          </div>
          <div className="text-xs text-text-muted flex gap-3">
            <span>Status: <strong className="capitalize text-text-primary">{hoveredData.status.replace('_', ' ')}</strong></span>
            <span>ETA: <strong className="font-mono text-text-primary">{format(new Date(hoveredData.eta), 'MM/dd')}</strong></span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 text-[10px] text-text-muted flex gap-3 z-20 font-mono">
        <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-accent-primary"></div>In Transit</div>
        <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-accent-warning"></div>Delayed</div>
      </div>
    </div>
  );
}

function LiveFeed({ shipments, onSelectShipment }: { shipments: Shipment[]; onSelectShipment: (id: string) => void }) {
  const [events, setEvents] = useState<{id: string, sId: string, timestamp: string, type: string, location: string, status: ShipmentStatus}[]>([]);

  useEffect(() => {
    // Collect all mock events
    const all = shipments.flatMap(s => s.events.map(e => ({...e, sId: s.id, status: s.status, id: s.id+e.timestamp})));
    all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Simulate real-time by taking first 10, then unshifting
    setEvents(all.slice(0, 10));

    const interval = setInterval(() => {
      setEvents(prev => {
        const next = Math.floor(Math.random() * 20);
        const nw = all[next];
        // Ensure no dupe id in tiny list
        if(prev.some(p => p.id === nw.id)) return prev;
        return [nw, ...prev].slice(0, 10);
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [shipments]);

  return (
    <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 relative pr-1.5">
      {events.map((e, index) => {
        let borderStyle = 'border-l-[3px] border-text-muted bg-bg-elevated/40';
        let statusTagColor = 'bg-bg-elevated text-text-muted';
        let statusLabel = 'Unknown';
        
        if (e.status === 'in_transit') {
          borderStyle = 'border-l-[3px] border-accent-primary bg-accent-primary/5 hover:bg-accent-primary/10';
          statusTagColor = 'bg-accent-primary/15 text-accent-primary';
          statusLabel = 'In Transit';
        } else if (e.status === 'delayed') {
          borderStyle = 'border-l-[3px] border-accent-warning bg-accent-warning/5 hover:bg-accent-warning/10';
          statusTagColor = 'bg-accent-warning/15 text-accent-warning';
          statusLabel = 'Delayed';
        } else if (e.status === 'delivered') {
          borderStyle = 'border-l-[3px] border-accent-success bg-accent-success/5 hover:bg-accent-success/10';
          statusTagColor = 'bg-accent-success/15 text-accent-success';
          statusLabel = 'Delivered';
        } else if (e.status === 'flagged') {
          borderStyle = 'border-l-[3px] border-accent-warning bg-accent-warning/10 hover:bg-accent-warning/15 border-accent-warning';
          statusTagColor = 'bg-accent-warning/20 text-accent-warning border border-accent-warning/30';
          statusLabel = 'Flagged';
        } else if (e.status === 'failed') {
          borderStyle = 'border-l-[3px] border-accent-danger bg-accent-danger/5 hover:bg-accent-danger/10';
          statusTagColor = 'bg-accent-danger/15 text-accent-danger';
          statusLabel = 'Failed';
        }

        return (
          <div 
            key={e.id + index} 
            onClick={() => onSelectShipment(e.sId)}
            className={cn(
              "p-3 rounded border border-bg-elevated/40 transition-all duration-200 ease-out flex flex-col gap-1.5 hover:translate-x-1 cursor-pointer group hover:shadow-md relative overflow-hidden",
              borderStyle
            )}
            title={`View logistics waybill ${e.sId}`}
          >
            {/* Inspect hover indicator */}
            <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-accent-primary font-mono font-semibold">
              <span>Inspect</span>
              <Eye className="w-3.5 h-3.5 animate-pulse" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  {index === 0 && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-primary opacity-75"></span>
                  )}
                  <span className={cn(
                    "relative inline-flex rounded-full h-2 w-2",
                    e.status === 'in_transit' ? 'bg-accent-primary' :
                    e.status === 'delayed' ? 'bg-accent-warning' :
                    e.status === 'delivered' ? 'bg-accent-success' : 
                    e.status === 'flagged' ? 'bg-accent-warning' : 'bg-accent-danger'
                  )}></span>
                </span>
                <span className="font-mono text-[11px] font-bold text-text-primary group-hover:text-accent-primary transition-colors">
                  {e.sId}
                </span>
              </div>
              <span className="font-mono text-[9px] text-text-muted pr-14 group-hover:pr-0 transition-all duration-200">
                {format(new Date(e.timestamp), 'HH:mm:ss')}
              </span>
            </div>

            <div className="text-[12px] text-text-primary font-medium pr-10">
              {e.type}
            </div>

            <div className="flex items-center justify-between text-[11px] text-text-muted mt-0.5">
              <span>📍 {e.location}</span>
              <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-mono font-medium uppercase tracking-[0.05em]", statusTagColor)}>
                {statusLabel}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Dashboard() {
  const [shipments, setShipments] = useState<Shipment[]>(MOCK_SHIPMENTS);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeCount = shipments.filter(s => s.status === 'in_transit').length;
  const delivered = shipments.filter(s => s.status === 'delivered').length;
  const delayed = shipments.filter(s => s.status === 'delayed' || s.status === 'flagged').length;
  const onTimeRate = (delivered / (delivered + delayed)) * 100 || 87.3;

  const handleSelectShipment = (id: string) => {
    setSelectedId(id);
  };

  const handleFlag = (id: string) => {
    setShipments(prev => prev.map(s => s.id === id ? { ...s, status: 'flagged' as const } : s));
  };

  const selectedShipment = shipments.find(s => s.id === selectedId) || null;

  return (
    <div className="p-6 flex flex-col gap-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto relative pb-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in y-translate-4 duration-300">
        <KpiCard 
          title="Total Active Shipments" value={1284} subtext="+84" trend={5.2}
        />
        <KpiCard 
          title="On-Time Delivery Rate" value={87.3} subtext="+2.4%" trend={1.4}
        />
        <KpiCard 
          title="Delayed Shipments" value={163} subtext="+12 vs Prev" trend={-2.1} isWarning={true}
        />
        <KpiCard 
          title="Avg. Transit Time" value={4.2} subtext="-0.5d" trend={-0.8}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5 min-h-[340px] lg:h-[340px]">
        <div className="bg-bg-surface border border-bg-elevated rounded-lg p-4 relative flex flex-col h-[340px] lg:h-full">
          <div className="text-[11px] font-mono text-text-muted mb-3 uppercase flex justify-between">
            <span>Route Visibility: Africa Hubs</span>
            <span className="text-accent-primary font-bold">LIVE LAYER</span>
          </div>
          <div className="flex-1 rounded min-h-0 relative">
            <AfricaMap shipments={shipments} />
          </div>
        </div>
        <div className="bg-bg-surface border border-bg-elevated rounded-lg p-4 flex flex-col min-h-[250px] h-[340px] lg:h-full">
          <div className="text-[11px] font-mono text-text-muted mb-3 uppercase flex justify-between items-center bg-transparent">
            <span>Live Event Feed</span>
            <span className="text-accent-success font-bold flex items-center gap-1 text-[10px] animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-success"></span>
              STREAMING
            </span>
          </div>
          <div className="flex-1 min-h-0 flex flex-col">
            <LiveFeed shipments={shipments} onSelectShipment={handleSelectShipment} />
          </div>
        </div>
      </div>
      
      <div className="bg-bg-surface border border-bg-elevated rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-bg-elevated sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-[11px] font-mono text-text-muted uppercase font-normal tracking-wide">Tracking ID</th>
                <th className="px-4 py-3 text-[11px] font-mono text-text-muted uppercase font-normal tracking-wide">Route</th>
                <th className="px-4 py-3 text-[11px] font-mono text-text-muted uppercase font-normal tracking-wide hidden md:table-cell">Carrier</th>
                <th className="px-4 py-3 text-[11px] font-mono text-text-muted uppercase font-normal tracking-wide">Status</th>
                <th className="px-4 py-3 text-[11px] font-mono text-text-muted uppercase font-normal tracking-wide hidden sm:table-cell">ETA</th>
                <th className="px-4 py-3 text-[11px] font-mono text-text-muted uppercase font-normal tracking-wide hidden md:table-cell">Weight</th>
                <th className="px-4 py-3 text-[11px] font-mono text-text-muted uppercase font-normal tracking-wide border-l border-transparent">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shipments.slice(0, 10).map((s) => (
                 <tr 
                   key={s.id} 
                   onClick={() => handleSelectShipment(s.id)}
                   className="border-b border-bg-elevated hover:bg-bg-elevated/40 transition-colors cursor-pointer group"
                 >
                   <td className="px-4 py-2.5 font-mono text-[12px] text-text-primary group-hover:text-accent-primary font-bold transition-colors">{s.id}</td>
                   <td className="px-4 py-2.5 font-mono text-[12px]">{s.origin.city} → {s.destination.city}</td>
                   <td className="px-4 py-2.5 font-mono text-[12px] text-text-muted hidden md:table-cell">{s.carrier}</td>
                   <td className="px-4 py-2.5">
                     <span className={cn(
                        "px-2 py-[2px] rounded-full text-[10px] font-semibold uppercase",
                        s.status === 'in_transit' ? 'bg-accent-primary/15 text-accent-primary' :
                        s.status === 'delivered' ? 'bg-accent-success/15 text-accent-success' :
                        s.status === 'delayed' ? 'bg-accent-warning/15 text-accent-warning' :
                        s.status === 'flagged' ? 'bg-accent-warning/15 text-accent-warning border border-accent-warning' :
                        'bg-accent-danger/15 text-accent-danger'
                      )}>
                        {s.status.replace('_', ' ')}
                      </span>
                   </td>
                   <td className="px-4 py-2.5 font-mono text-[12px] hidden sm:table-cell">{format(new Date(s.eta), 'MMM dd, yyyy')}</td>
                   <td className="px-4 py-2.5 font-mono text-[12px] text-text-muted hidden md:table-cell">{s.weight}kg</td>
                   <td className="px-4 py-2.5 text-[12px] text-text-muted group-hover:text-text-primary transition-colors">
                     <span className="flex items-center gap-1 font-sans text-xs">
                       View <Eye className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                     </span>
                   </td>
                 </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ShipmentDrawer 
        shipment={selectedShipment} 
        onClose={() => setSelectedId(null)} 
        onFlag={handleFlag} 
      />
    </div>
  );
}
