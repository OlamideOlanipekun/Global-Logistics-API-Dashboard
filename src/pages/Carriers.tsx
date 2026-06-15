import React, { useState, useMemo } from 'react';
import { MOCK_CARRIERS, MOCK_SHIPMENTS } from '../mockData';
import { Shipment, ShipmentStatus } from '../types';
import { 
  Truck, 
  TrendingUp, 
  TrendingDown, 
  Star, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Send, 
  Sparkles, 
  ArrowRight, 
  MapPin, 
  Layers, 
  Clock, 
  ShieldCheck, 
  X, 
  AlertCircle 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Cell, 
  LineChart, 
  Line, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

// Enriching carriers with custom high-fidelity profiles
const CARRIER_PROFILES: { 
  [key: string]: { 
    specialization: string; 
    rating: number; 
    fleet: string; 
    hubs: string[]; 
    email: string;
    contact: string;
  } 
} = {
  'dhl': {
    specialization: 'Priority air express & cross-border freighting',
    rating: 4.8,
    fleet: '85 Dedicated Boeing Jets, 2,500 Courier Wagons',
    hubs: ['Lagos (LOS)', 'Cairo (CAI)', 'Johannesburg (JNB)'],
    email: 'ops.africa@dhl.com',
    contact: '+234 (1) 270 3001'
  },
  'fedex': {
    specialization: 'International express parcel & dry-ice shipping',
    rating: 4.7,
    fleet: '65 Cargo Aircraft, 1,400 Express Heavy Trucks',
    hubs: ['Dakar (DKR)', 'Casablanca (CMN)', 'Nairobi (NBO)'],
    email: 'africa.freight@fedex.com',
    contact: '+254 20 6902000'
  },
  'ucp-logistics': {
    specialization: 'Maritime ocean containers & breakbulk cargo',
    rating: 4.5,
    fleet: '34 Container Liners, 450 Port Shunti Trucks',
    hubs: ['Dakar (DKR)', 'Accra (ACC)', 'Mombasa (MBA)'],
    email: 'marine.desk@ucplogistics.com',
    contact: '+27 11 800 2111'
  },
  'kobo360': {
    specialization: 'Digital high-volume asset-light freight network',
    rating: 4.6,
    fleet: '18,500 Contracted Dry Van Ports & Flatbeds',
    hubs: ['Lagos (LOS)', 'Nairobi (NBO)', 'Kigali (KGL)'],
    email: 'nigeria.dispatches@kobo360.com',
    contact: '+234 818 640 0000'
  },
  'sendbox': {
    specialization: 'Social commerce, parcel pool & last-mile logistics',
    rating: 4.3,
    fleet: '3,200 Dispatch Couriers, 42 Regional Depots',
    hubs: ['Lagos (LOS)', 'Accra (ACC)', 'Nairobi (NBO)'],
    email: 'support@sendbox.co',
    contact: '+234 1 888 3444'
  }
};

export function Carriers() {
  const [selectedId, setSelectedId] = useState<string>('dhl');
  const [search, setSearch] = useState('');
  const [slaFilter, setSlaFilter] = useState<'all' | 'exceptional' | 'warning'>('all');
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>(['dhl', 'fedex']);
  
  // Custom interactive dispatches simulation states
  const [isSignalling, setIsSignalling] = useState(false);
  const [signalSuccess, setSignalSuccess] = useState(false);
  const [signalCarrier, setSignalCarrier] = useState('');
  
  // Custom toast notification structure
  const [toast, setToast] = useState<{ msg: string; visible: boolean; type: 'success' | 'info' }>({
    msg: '',
    visible: false,
    type: 'success'
  });

  const launchIndicatorToast = (message: string, styleType: 'success' | 'info' = 'success') => {
    setToast({ msg: message, visible: true, type: styleType });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 4500);
  };

  // Retrieve current active shipments for all carriers dynamically from the global dataset
  const carrierShipmentStats = useMemo(() => {
    const statsMap: { 
      [key: string]: { 
        active: number; 
        total: number; 
        delayed: number; 
        delivered: number; 
        shipmentList: Shipment[] 
      } 
    } = {};

    MOCK_CARRIERS.forEach(c => {
      statsMap[c.id] = { active: 0, total: 0, delayed: 0, delivered: 0, shipmentList: [] };
    });

    MOCK_SHIPMENTS.forEach(s => {
      // Find carrier ID based on match
      const matchingCarrier = MOCK_CARRIERS.find(c => 
        s.carrier.toLowerCase() === c.name.toLowerCase() || 
        s.carrier.toLowerCase().includes(c.name.toLowerCase())
      );
      if (matchingCarrier) {
        const stats = statsMap[matchingCarrier.id];
        stats.total += 1;
        stats.shipmentList.push(s);
        if (s.status === 'delivered') {
          stats.delivered += 1;
        } else if (s.status === 'delayed' || s.status === 'flagged') {
          stats.delayed += 1;
          stats.active += 1;
        } else {
          stats.active += 1;
        }
      }
    });

    return statsMap;
  }, []);

  // Filtered Carriers
  const filteredCarriers = useMemo(() => {
    return MOCK_CARRIERS.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
      
      let matchesSLA = true;
      if (slaFilter === 'exceptional') {
        matchesSLA = c.onTimeRate >= 90;
      } else if (slaFilter === 'warning') {
        matchesSLA = c.onTimeRate < 90;
      }
      
      return matchesSearch && matchesSLA;
    });
  }, [search, slaFilter]);

  // Handle selected carrier
  const selected = useMemo(() => {
    return MOCK_CARRIERS.find(c => c.id === selectedId) || MOCK_CARRIERS[0];
  }, [selectedId]);

  // Compute dynamic corridors served by current selected carrier
  const topCorridors = useMemo(() => {
    if (!selected) return [];
    const shipmentsMap = carrierShipmentStats[selected.id]?.shipmentList || [];
    const routeCounts: { [key: string]: number } = {};
    
    shipmentsMap.forEach(s => {
      const route = `${s.origin.city} → ${s.destination.city}`;
      routeCounts[route] = (routeCounts[route] || 0) + 1;
    });

    return Object.entries(routeCounts)
      .map(([route, count]) => ({ route, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [selected, carrierShipmentStats]);

  // Generate responsive monthly SLA charts based on carrier SLA stats
  const monthlySlaTrends = useMemo(() => {
    if (!selected) return [];
    const base = selected.onTimeRate;
    return [
      { name: 'Jan', StandardSLA: 90, ActualSLA: base - 2 },
      { name: 'Feb', StandardSLA: 90, ActualSLA: base - 1 },
      { name: 'Mar', StandardSLA: 90, ActualSLA: base + 1 },
      { name: 'Apr', StandardSLA: 90, ActualSLA: base - 3 },
      { name: 'May', StandardSLA: 90, ActualSLA: base + 2 },
      { name: 'Jun', StandardSLA: 90, ActualSLA: base },
    ];
  }, [selected]);

  // Dual comparison series mapping
  const comparisonChartData = useMemo(() => {
    const activeCompareCarriers = MOCK_CARRIERS.filter(c => compareIds.includes(c.id));
    return [
      { metric: 'On-Time SLA (%)', ...activeCompareCarriers.reduce((acc, curr) => ({ ...acc, [curr.name]: curr.onTimeRate }), {}) },
      { metric: 'Avg Transit (Days * 10)', ...activeCompareCarriers.reduce((acc, curr) => ({ ...acc, [curr.name]: curr.avgTransitDays * 10 }), {}) },
    ];
  }, [compareIds]);

  // Toggle selection inside compare list
  const handleToggleCompare = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering basic selection row
    if (compareIds.includes(id)) {
      if (compareIds.length <= 1) {
        launchIndicatorToast("You must select at least one carrier to compare.", "info");
        return;
      }
      setCompareIds(prev => prev.filter(item => item !== id));
    } else {
      if (compareIds.length >= 3) {
        launchIndicatorToast("You can compare up to three logistics partners simultaneously.", "info");
        return;
      }
      setCompareIds(prev => [...prev, id]);
    }
  };

  // Dispatch ping alert simulation
  const handleSimulatePing = (carrierName: string) => {
    setSignalCarrier(carrierName);
    setIsSignalling(true);
    setSignalSuccess(false);

    setTimeout(() => {
      setIsSignalling(false);
      setSignalSuccess(true);
      launchIndicatorToast(`Automated Dispatch Gateway Handshake completed with ${carrierName}. Telemetries reconciled.`, 'success');
      setTimeout(() => setSignalSuccess(false), 3000);
    }, 1200);
  };

  // Compare mode automatic winner calculation
  const getWinner = (metric: 'sla' | 'speed') => {
    const activeList = MOCK_CARRIERS.filter(c => compareIds.includes(c.id));
    if (activeList.length === 0) return null;
    if (metric === 'sla') {
      return [...activeList].sort((a, b) => b.onTimeRate - a.onTimeRate)[0];
    } else {
      // lower is better for avgTransitDays
      return [...activeList].sort((a, b) => a.avgTransitDays - b.avgTransitDays)[0];
    }
  };

  const slaWinner = getWinner('sla');
  const speedWinner = getWinner('speed');

  return (
    <div className="p-6 max-w-[1600px] mx-auto animate-in fade-in duration-500 relative pb-16">
      
      {/* Header and Core Aggregate KPIs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-text-primary flex items-center gap-2">
            <span>Carrier Command Network</span>
            <span className="text-[10px] font-mono font-semibold bg-accent-primary/10 text-accent-primary px-2 py-0.5 rounded uppercase tracking-wider">Gateway Active</span>
          </h1>
          <p className="text-xs text-text-muted mt-0.5 font-mono">Consolidated operational telemetry & real-time performance audits.</p>
        </div>

        {/* Global toggles */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            id="toggle-compare-mode"
            onClick={() => setIsCompareMode(!isCompareMode)}
            className={cn(
              "flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 border rounded-md text-xs font-semibold select-none active:scale-95 transition-all",
              isCompareMode 
                ? "bg-accent-primary text-bg-base border-accent-primary font-bold shadow-lg shadow-accent-primary/20" 
                : "bg-bg-surface border-bg-elevated hover:bg-bg-elevated/40 text-text-primary"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isCompareMode ? "Exit Comparison" : "Compare Carriers"}</span>
          </button>

          <div className="hidden lg:flex items-center gap-1 bg-bg-surface border border-bg-elevated p-1 rounded-md text-xs font-mono text-text-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-success animate-pulse inline-block ml-1"></span>
            <span className="px-1">SLA Benchmark: 90%</span>
          </div>
        </div>
      </div>

      {/* Aggregate Overview statistics strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-bg-surface border border-bg-elevated rounded-lg p-3.5 flex items-center gap-3 hover:-translate-y-0.5 transition-transform duration-200">
          <div className="p-2.5 rounded bg-accent-primary/10 text-accent-primary">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">Total Carriers</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-mono font-bold text-text-primary">{MOCK_CARRIERS.length}</span>
              <span className="text-[9px] text-text-muted font-semibold">Contracted</span>
            </div>
          </div>
        </div>

        <div className="bg-bg-surface border border-bg-elevated rounded-lg p-3.5 flex items-center gap-3 hover:-translate-y-0.5 transition-transform duration-200">
          <div className="p-2.5 rounded bg-accent-success/15 text-accent-success">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">Network SLA</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-mono font-bold text-accent-success">
                {(MOCK_CARRIERS.reduce((acc, c) => acc + c.onTimeRate, 0) / MOCK_CARRIERS.length).toFixed(1)}%
              </span>
              <span className="text-[9px] text-text-muted font-semibold">On-Time Avg</span>
            </div>
          </div>
        </div>

        <div className="bg-bg-surface border border-bg-elevated rounded-lg p-3.5 flex items-center gap-3 hover:-translate-y-0.5 transition-transform duration-200">
          <div className="p-2.5 rounded bg-accent-warning/15 text-accent-warning">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">Network Shipments</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-mono font-bold text-text-primary">
                {MOCK_CARRIERS.reduce((acc, c) => acc + c.totalShipments, 0).toLocaleString()}
              </span>
              <span className="text-[9px] text-text-muted font-semibold">Total dispatch</span>
            </div>
          </div>
        </div>

        <div className="bg-bg-surface border border-bg-elevated rounded-lg p-3.5 flex items-center gap-3 hover:-translate-y-0.5 transition-transform duration-200">
          <div className="p-2.5 rounded bg-blue-500/10 text-blue-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">Transit Lead Time</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-mono font-bold text-text-primary">
                {(MOCK_CARRIERS.reduce((acc, c) => acc + c.avgTransitDays, 0) / MOCK_CARRIERS.length).toFixed(1)}d
              </span>
              <span className="text-[9px] text-text-muted font-semibold">Continental Mean</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Query Filters and Controls */}
      <div className="bg-bg-surface border border-bg-elevated rounded-lg p-3.5 mb-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 font-sans">
        
        {/* Search Input field */}
        <div className="relative w-full md:flex-1 md:max-w-md">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            id="carrier-search-input"
            type="text"
            placeholder="Search operational carriers (DHL, FedEx)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-bg-elevated/40 border border-bg-elevated rounded-md py-1.5 pl-9 pr-8 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-all"
          />
          {search && (
            <button 
              id="clear-search-btn"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
              title="Clear search query"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* SLA Filtration switches */}
        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 justify-end">
          <span className="text-[11px] font-mono text-text-muted uppercase font-semibold">Audit Level:</span>
          <div className="bg-bg-elevated/50 border border-bg-elevated p-1 rounded-md flex items-center shadow-inner text-xs">
            <button 
              id="filter-sla-all"
              onClick={() => setSlaFilter('all')}
              className={cn(
                "px-2.5 py-1 rounded transition-colors font-medium",
                slaFilter === 'all' ? "bg-bg-surface text-accent-primary font-bold shadow-sm" : "text-text-muted hover:text-text-primary"
              )}
            >
              All
            </button>
            <button 
              id="filter-sla-exceptional"
              onClick={() => setSlaFilter('exceptional')}
              className={cn(
                "px-2.5 py-1 rounded transition-colors font-medium flex items-center gap-1",
                slaFilter === 'exceptional' ? "bg-bg-surface text-accent-success font-bold shadow-sm" : "text-text-muted hover:text-text-primary"
              )}
              title="On-time delivery rates above 90%"
            >
              <ShieldCheck className="w-3 h-3 text-accent-success" />
              <span>Outstanding (&ge;90%)</span>
            </button>
            <button 
              id="filter-sla-warning"
              onClick={() => setSlaFilter('warning')}
              className={cn(
                "px-2.5 py-1 rounded transition-colors font-medium flex items-center gap-1",
                slaFilter === 'warning' ? "bg-bg-surface text-accent-warning font-bold shadow-sm" : "text-text-muted hover:text-text-primary"
              )}
              title="On-time delivery rates below 90%"
            >
              <AlertTriangle className="w-3 h-3 text-accent-warning" />
              <span>Watchlist (&lt;90%)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main split work surface */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Left Hand: Carrier Cards List */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {filteredCarriers.map(c => {
            const isSel = selectedId === c.id;
            const profile = CARRIER_PROFILES[c.id];
            const loadStats = carrierShipmentStats[c.id] || { active: 0, total: 0, delayed: 0 };
            const isCheckedForCompare = compareIds.includes(c.id);

            return (
              <div 
                key={c.id}
                id={`carrier-card-${c.id}`}
                onClick={() => setSelectedId(c.id)}
                className={cn(
                  "bg-bg-surface border rounded-xl p-4 cursor-pointer transition-all duration-200 relative group flex flex-col justify-between h-56",
                  isSel 
                    ? "border-accent-primary ring-1 ring-accent-primary/60 bg-accent-primary/[0.01]" 
                    : "border-bg-elevated hover:border-accent-primary/40 hover:-translate-y-0.5 hover:shadow-md"
                )}
              >
                {/* Header detail */}
                <div>
                  <div className="flex items-start justify-between gap-1.5 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center transition-colors border",
                        isSel ? "bg-accent-primary/10 border-accent-primary/30 text-accent-primary" : "bg-bg-elevated border-bg-elevated text-text-muted group-hover:text-text-primary"
                      )}>
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[14px] text-text-primary tracking-tight font-display flex items-center gap-1">
                          <span>{c.name}</span>
                          {c.onTimeRate >= 90 && <ShieldCheck className="w-3.5 h-3.5 text-accent-success" title="High SLA Certified" />}
                        </h3>
                        <p className="text-[10px] text-text-muted uppercase font-mono tracking-wider">
                          {profile?.specialization.split(' & ')[0] || "Regional Freight Carrier"}
                        </p>
                      </div>
                    </div>

                    {/* Compare Selection Checkbox indicator block */}
                    {isCompareMode ? (
                      <button 
                        id={`btn-compare-check-${c.id}`}
                        onClick={(e) => handleToggleCompare(c.id, e)}
                        className={cn(
                          "px-2 py-1 rounded text-[10px] font-mono font-bold border transition-all active:scale-90",
                          isCheckedForCompare 
                            ? "bg-accent-primary text-bg-base border-accent-primary" 
                            : "bg-bg-surface text-text-muted border-bg-elevated hover:border-accent-primary hover:text-accent-primary"
                        )}
                      >
                        {isCheckedForCompare ? "✓ COMPARING" : "+ COMPARE"}
                      </button>
                    ) : (
                      <div className="flex items-center gap-0.5 text-accent-warning bg-accent-warning/5 px-2 py-0.5 rounded border border-accent-warning/10">
                        <Star className="w-3 h-3 fill-accent-warning" />
                        <span className="font-mono font-bold text-[10px]">{profile?.rating || "4.5"}</span>
                      </div>
                    )}
                  </div>

                  {/* Core Numeric Indicators */}
                  <div className="grid grid-cols-3 gap-2.5 text-left mb-3.5 bg-bg-elevated/20 p-2 rounded-lg border border-bg-elevated/30">
                    <div>
                      <p className="text-[9px] font-mono text-text-muted uppercase tracking-wider">Global SLA</p>
                      <p className={cn(
                        "font-mono text-sm leading-none font-bold mt-1", 
                        c.onTimeRate >= 90 ? "text-accent-success" : "text-accent-warning"
                      )}>
                        {c.onTimeRate}%
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] font-mono text-text-muted uppercase tracking-wider">Transit Lead</p>
                      <p className="font-mono text-sm leading-none font-bold text-text-primary mt-1">
                        {c.avgTransitDays} Days
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] font-mono text-text-muted uppercase tracking-wider">Dispatched</p>
                      <p className="font-mono text-sm leading-none font-bold text-text-primary mt-1">
                        {c.totalShipments.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer status bar details */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[11px] text-text-muted">
                    <span className="flex items-center gap-1 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-primary"></span>
                      <span>{loadStats.active} Active Cargoes</span>
                    </span>
                    
                    {loadStats.delayed > 0 && (
                      <span className="text-accent-warning font-mono flex items-center gap-1 text-[10px] bg-accent-warning/5 px-1.5 py-0.5 rounded border border-accent-warning/10">
                        <AlertTriangle className="w-3 h-3 text-accent-warning" />
                        <span>{loadStats.delayed} Warned</span>
                      </span>
                    )}
                  </div>

                  {/* Visual tracking progress standard bar */}
                  <div className="w-full bg-bg-elevated h-1 rounded-full overflow-hidden block">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-1000", 
                        c.onTimeRate >= 90 ? "bg-accent-success" : "bg-accent-warning"
                      )}
                      style={{ width: `${c.onTimeRate}%` }}
                    />
                  </div>
                </div>

                {/* Inspect micro hover badge */}
                <span className="absolute bottom-2.5 right-3 opacity-0 group-hover:opacity-100 text-[10px] font-mono text-accent-primary font-bold transition-opacity">
                  Inspect Console &rarr;
                </span>
                
              </div>
            );
          })}

          {filteredCarriers.length === 0 && (
            <div className="col-span-2 text-center py-16 text-text-muted bg-bg-surface border border-bg-elevated rounded-xl">
              <div className="max-w-xs mx-auto flex flex-col items-center">
                <Truck className="w-8 h-8 opacity-40 mb-3 text-text-muted" />
                <h3 className="text-sm font-semibold text-text-primary">No matching logistics partners</h3>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  Could not find any contracted carriers matching "<strong>{search}</strong>" with current SLA filter.
                </p>
                <button 
                  id="reset-carrier-filters-btn"
                  onClick={() => { setSearch(''); setSlaFilter('all'); }}
                  className="mt-4 px-3 py-1.5 border border-bg-elevated bg-bg-elevated/40 hover:bg-bg-elevated text-text-primary text-xs rounded transition-all active:scale-95 font-mono"
                >
                  Reset Filtering Criteria
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Hand Sticky Detail or Comparison Screen */}
        <div className="w-full lg:w-[420px] flex-shrink-0">
          
          {isCompareMode ? (
            /* COMPARISON VIEW MATRIX PANEL */
            <div className="bg-bg-surface border border-bg-elevated rounded-xl p-5 shadow-sm sticky top-6 animate-in slide-in-from-right-4 duration-300 w-full flex flex-col gap-6">
              <div>
                <h2 className="text-base font-bold font-display text-text-primary tracking-tight">Partner Comparison Matrix</h2>
                <p className="text-[11px] text-text-muted font-mono mt-0.5">Analysing {compareIds.length} concurrently selected nodes.</p>
              </div>

              {/* Side by side stats block */}
              <div className="flex flex-col gap-3 font-mono text-xs">
                {MOCK_CARRIERS.filter(c => compareIds.includes(c.id)).map(c => {
                  const profile = CARRIER_PROFILES[c.id];
                  const hasBestSLA = slaWinner?.id === c.id;
                  const hasBestSpeed = speedWinner?.id === c.id;

                  return (
                    <div 
                      key={c.id} 
                      id={`compare-cell-${c.id}`}
                      className="border border-bg-elevated/70 rounded-lg p-3 bg-bg-elevated/10 relative flex flex-col gap-2.5"
                    >
                      <div className="flex justify-between items-center border-b border-bg-elevated/50 pb-1.5">
                        <span className="font-bold text-text-primary text-[13px]">{c.name}</span>
                        <div className="flex items-center gap-1.5">
                          {hasBestSLA && (
                            <span className="bg-accent-success/15 text-accent-success text-[10px] px-1.5 py-0.5 rounded font-bold border border-accent-success/10 flex items-center gap-0.5">
                              🥇 Best SLA
                            </span>
                          )}
                          {hasBestSpeed && (
                            <span className="bg-blue-500/10 text-blue-400 text-[10px] px-1.5 py-0.5 rounded font-bold border border-blue-500/10 flex items-center gap-0.5">
                              ⚡ Fastest
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-text-muted">On-Time SLA:</span>
                          <strong className="block text-text-primary mt-0.5">{c.onTimeRate}%</strong>
                        </div>
                        <div>
                          <span className="text-text-muted">Avg Speed:</span>
                          <strong className="block text-text-primary mt-0.5">{c.avgTransitDays} Days</strong>
                        </div>
                        <div>
                          <span className="text-text-muted">Rating:</span>
                          <strong className="block text-text-primary mt-0.5">⭐ {profile?.rating || '4.5'}</strong>
                        </div>
                        <div>
                          <span className="text-text-muted">Fleet Scale:</span>
                          <strong className="block text-text-primary mt-0.5 truncate max-w-[140px]" title={profile?.fleet}>
                            {profile?.fleet.split(',')[0]}
                          </strong>
                        </div>
                      </div>

                      <div className="bg-bg-surface/60 border border-bg-elevated/40 p-2 rounded text-[10px] font-sans text-text-muted italic">
                        "{profile?.specialization || 'Broad spectrum inland cargo services.'}"
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Graphical analytics inside compare pane */}
              <div className="flex flex-col gap-2.5">
                <span className="text-[10px] font-mono text-text-muted uppercase font-bold tracking-wider">Metrics Side-by-Side</span>
                <div className="h-44 bg-bg-base/30 rounded-lg p-2 border border-bg-elevated/50">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonChartData}>
                      <XAxis dataKey="metric" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#131929', borderColor: '#1C2539', borderRadius: '6px', fontSize: '11px' }} 
                        itemStyle={{ color: '#F1F5F9' }} 
                      />
                      {MOCK_CARRIERS.filter(c => compareIds.includes(c.id)).map((c, i) => {
                        const colors = ['#3B82F6', '#10B981', '#F59E0B'];
                        return (
                          <Bar 
                            key={c.id} 
                            dataKey={c.name} 
                            fill={colors[i % colors.length]} 
                            radius={[2, 2, 0, 0]} 
                          />
                        );
                      })}
                      <Legend verticalAlign="bottom" height={24} iconSize={8} wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Compare tips */}
              <div className="bg-accent-primary/5 border border-accent-primary/20 rounded-lg p-3 text-[11px] text-text-muted leading-relaxed">
                <p><strong>Route Optimization:</strong> Combined analytics favor shifting high-priority pharmaceutical cargo to <strong>{slaWinner?.name || 'highest performer'}</strong> based on historical SLA safety margins.</p>
              </div>

            </div>
          ) : (
            /* STANDARD ENHANCED CARRIER AUDIT/INSIGHTS PANEL */
            selected && (
              <div className="bg-bg-surface border border-bg-elevated rounded-xl p-5 shadow-sm sticky top-6 animate-in slide-in-from-right-4 duration-300 w-full flex flex-col gap-5">
                
                {/* Header Information and rating summary */}
                <div className="flex items-start justify-between border-b border-bg-elevated pb-4">
                  <div>
                    <h2 className="text-base font-bold font-display text-text-primary tracking-tight leading-tight flex items-center gap-1.5">
                      <span>{selected.name}</span>
                      <span className="w-2 h-2 rounded-full bg-accent-success inline-block" title="Online Telemetry Stream"></span>
                    </h2>
                    <p className="text-[11px] font-mono text-text-muted mt-1 uppercase tracking-wide">
                      {CARRIER_PROFILES[selected.id]?.specialization || 'Broad spectrum inland cargo services.'}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-[10px] font-mono font-bold uppercase text-accent-primary bg-accent-primary/10 px-2 py-0.5 rounded">
                      Tier 1 Partner
                    </span>
                    <div className="flex items-center gap-0.5 text-accent-warning mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={cn(
                          "w-3.5 h-3.5",
                          i < Math.floor(CARRIER_PROFILES[selected.id]?.rating || 4.5) ? "fill-accent-warning text-accent-warning" : "text-bg-elevated"
                        )} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sub-Aggregate Operational stats */}
                <div className="grid grid-cols-2 gap-3.5 font-mono text-xs text-center">
                  <div className="bg-bg-base border border-bg-elevated rounded-lg p-3 group hover:border-accent-primary/50 transition-colors">
                    <p className="text-[10px] text-text-muted mb-1 uppercase">SLA Milestone Deviation</p>
                    <div className="flex items-center justify-center gap-1.5 text-accent-success font-bold text-[14px]">
                      <TrendingUp className="w-4 h-4 text-accent-success" />
                      <span>+2.4% MoM</span>
                    </div>
                  </div>

                  <div className="bg-bg-base border border-bg-elevated rounded-lg p-3 group hover:border-accent-warning/50 transition-colors">
                    <p className="text-[10px] text-text-muted mb-1 uppercase">SLA Breaches (YTD)</p>
                    <div className="flex items-center justify-center gap-1.5 text-accent-warning font-bold text-[14px]">
                      <TrendingDown className="w-4 h-4 text-accent-warning" />
                      <span>12 Incidents</span>
                    </div>
                  </div>
                </div>

                {/* SLA performance line chart visualizer */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-text-muted uppercase font-bold tracking-wider">Historical SLA Trend (6m)</span>
                    <span className="text-[10px] font-mono text-accent-success font-semibold flex items-center gap-0.5">
                      Target: 90%
                    </span>
                  </div>
                  <div className="h-44 bg-bg-base/30 rounded-lg p-2 border border-bg-elevated/50">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlySlaTrends} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                        <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} domain={[50, 100]} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#131929', borderColor: '#1C2539', borderRadius: '6px', fontSize: '11px' }} 
                          itemStyle={{ color: '#F1F5F9' }} 
                        />
                        <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" vertical={false} />
                        <Line type="monotone" dataKey="ActualSLA" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} name="MoM SLA" />
                        <Line type="monotone" dataKey="StandardSLA" stroke="#F59E0B" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Target" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Primary Hub Corridors and Fleet Assets */}
                <div className="flex flex-col gap-2 bg-bg-base p-3.5 rounded-lg border border-bg-elevated">
                  <div className="flex items-center justify-between border-b border-bg-elevated/40 pb-2">
                    <span className="text-[10px] font-mono text-text-muted uppercase font-bold tracking-wider flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-accent-primary" />
                      <span>Key Port Corridors Served</span>
                    </span>
                    <span className="text-[9px] font-semibold text-accent-primary">Flow Count</span>
                  </div>
                  
                  {topCorridors.length > 0 ? (
                    <div className="flex flex-col gap-2 pt-1 font-mono text-xs">
                      {topCorridors.map((tc, index) => (
                        <div key={index} className="flex justify-between items-center text-text-primary text-[11px]">
                          <span className="font-medium">{tc.route}</span>
                          <span className="bg-bg-elevated text-text-muted px-2 py-0.5 rounded font-bold">{tc.count} dispatches</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px] text-text-muted font-mono italic">No current dispatches routed in active index.</span>
                  )}

                  <div className="border-t border-bg-elevated/40 pt-2.5 mt-1 flex flex-col gap-1 text-[11px]">
                    <span className="text-text-muted font-sans font-semibold">Active Fleet Assets:</span>
                    <span className="font-mono text-text-primary text-[11.5px] leading-relaxed">
                      🚒 {CARRIER_PROFILES[selected.id]?.fleet || "All standard cargo containers, intercity haulages."}
                    </span>
                  </div>
                </div>

                {/* Active shipments from database for this specific carrier */}
                <div className="flex flex-col gap-2.5">
                  <span className="text-[10px] font-mono text-text-muted uppercase font-bold tracking-wider">Live Waybills Carried ({carrierShipmentStats[selected.id]?.active || 0})</span>
                  
                  <div className="max-h-36 overflow-y-auto flex flex-col gap-2 pr-1.5 scrollbar-thin">
                    {(carrierShipmentStats[selected.id]?.shipmentList || [])
                      .filter(s => s.status !== 'delivered' && s.status !== 'failed')
                      .slice(0, 4)
                      .map(s => {
                        return (
                          <div 
                            key={s.id} 
                            className="bg-bg-base/60 border border-bg-elevated rounded p-2 flex justify-between items-center font-mono text-[11px] hover:border-accent-primary/40 transition-colors"
                          >
                            <div className="flex flex-col">
                              <span className="font-bold text-text-primary">{s.id}</span>
                              <span className="text-[9px] text-text-muted">{s.origin.city} &rarr; {s.destination.city}</span>
                            </div>
                            <span className={cn(
                              "px-1.5 py-0.5 rounded text-[8px] uppercase font-bold",
                              s.status === 'delayed' || s.status === 'flagged' ? 'bg-accent-warning/10 text-accent-warning' : 'bg-accent-primary/10 text-accent-primary'
                            )}>
                              {s.status.replace('_', ' ')}
                            </span>
                          </div>
                        );
                    })}
                    {(carrierShipmentStats[selected.id]?.shipmentList || []).filter(s => s.status !== 'delivered' && s.status !== 'failed').length === 0 && (
                      <span className="text-[11px] text-text-muted font-sans italic py-2 text-center bg-bg-base/30 border border-dashed border-bg-elevated rounded">
                        No active live cargo waybills currently registering.
                      </span>
                    )}
                  </div>
                </div>

                {/* Operational Contact Desk & Alert Handshake Tool */}
                <div className="border-t border-bg-elevated pt-4 mt-1 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex flex-col">
                      <span className="text-text-muted text-[10px] uppercase font-bold">In-Region Ops Desk</span>
                      <a href={`mailto:${CARRIER_PROFILES[selected.id]?.email}`} className="text-accent-primary hover:underline font-bold mt-0.5">
                        {CARRIER_PROFILES[selected.id]?.email || "ops@logistics.com"}
                      </a>
                    </div>
                    <span className="text-text-primary text-[11px] font-semibold">
                      {CARRIER_PROFILES[selected.id]?.contact || "Not Registered"}
                    </span>
                  </div>

                  {/* Simulator action buttons */}
                  <div className="flex gap-2">
                    <button 
                      id={`btn-signal-ops-${selected.id}`}
                      disabled={isSignalling}
                      onClick={() => handleSimulatePing(selected.name)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-2 px-3.5 rounded text-[12px] font-semibold transition-all select-none active:scale-95 h-9",
                        isSignalling 
                          ? "bg-bg-elevated text-text-muted cursor-not-allowed" 
                          : "bg-text-primary text-bg-base hover:bg-text-secondary shadow-md font-bold"
                      )}
                    >
                      {isSignalling ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-text-muted" />
                      ) : (
                        <Send className="w-3.5 h-3.5 text-bg-base" />
                      )}
                      <span>{isSignalling ? "Reconciling..." : "Signal Flight Desk"}</span>
                    </button>
                  </div>
                </div>

              </div>
            )
          )}

        </div>

      </div>

      {/* Floating System-Wide Action Toast Notification */}
      <div 
        id="system-action-toast"
        className={cn(
          "fixed bottom-6 right-6 bg-bg-surface border text-[13px] px-4 py-3.5 rounded-lg shadow-2xl flex items-center gap-3.5 transition-all duration-300 z-50",
          toast.type === 'info' ? "border-accent-primary text-accent-primary" : "border-accent-success text-accent-success",
          toast.visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"
        )}
      >
        {toast.type === 'info' ? (
          <AlertCircle className="w-5 h-5 text-accent-primary shrink-0" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-accent-success shrink-0" />
        )}
        <span className="font-medium text-text-primary">{toast.msg}</span>
      </div>

    </div>
  );
}
