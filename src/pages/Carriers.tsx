import React, { useState, useMemo, useEffect } from 'react';
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
  AlertCircle,
  ChevronDown,
  ChevronUp
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
  
  const [isSignalling, setIsSignalling] = useState(false);
  const [signalSuccess, setSignalSuccess] = useState(false);
  const [signalCarrier, setSignalCarrier] = useState('');
  
  const [isMobile, setIsMobile] = useState(false);

  // Responsive tracker hook
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const selected = useMemo(() => {
    return MOCK_CARRIERS.find(c => c.id === selectedId) || MOCK_CARRIERS[0];
  }, [selectedId]);

  const topCorridorsForSelected = (carrierId: string) => {
    const shipmentsMap = carrierShipmentStats[carrierId]?.shipmentList || [];
    const routeCounts: { [key: string]: number } = {};
    
    shipmentsMap.forEach(s => {
      const route = `${s.origin.city} → ${s.destination.city}`;
      routeCounts[route] = (routeCounts[route] || 0) + 1;
    });

    return Object.entries(routeCounts)
      .map(([route, count]) => ({ route, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  };

  const monthlySlaTrendsForSelected = (ratingRate: number) => {
    return [
      { name: 'Jan', StandardSLA: 90, ActualSLA: ratingRate - 2 },
      { name: 'Feb', StandardSLA: 90, ActualSLA: ratingRate - 1 },
      { name: 'Mar', StandardSLA: 90, ActualSLA: ratingRate + 1 },
      { name: 'Apr', StandardSLA: 90, ActualSLA: ratingRate - 3 },
      { name: 'May', StandardSLA: 90, ActualSLA: ratingRate + 2 },
      { name: 'Jun', StandardSLA: 90, ActualSLA: ratingRate },
    ];
  };

  const comparisonChartData = useMemo(() => {
    const activeCompareCarriers = MOCK_CARRIERS.filter(c => compareIds.includes(c.id));
    return [
      { metric: 'On-Time SLA (%)', ...activeCompareCarriers.reduce((acc, curr) => ({ ...acc, [curr.name]: curr.onTimeRate }), {}) },
      { metric: 'Avg Transit (Days * 10)', ...activeCompareCarriers.reduce((acc, curr) => ({ ...acc, [curr.name]: curr.avgTransitDays * 10 }), {}) },
    ];
  }, [compareIds]);

  const handleToggleCompare = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (compareIds.includes(id)) {
      if (compareIds.length <= 1) {
        launchIndicatorToast("Choose at least one node to compare.", "info");
        return;
      }
      setCompareIds(prev => prev.filter(item => item !== id));
    } else {
      if (compareIds.length >= 3) {
        launchIndicatorToast("You can compare up to three logistics nodes.", "info");
        return;
      }
      setCompareIds(prev => [...prev, id]);
    }
  };

  const handleSimulatePing = (carrierName: string) => {
    setSignalCarrier(carrierName);
    setIsSignalling(true);
    setSignalSuccess(false);

    setTimeout(() => {
      setIsSignalling(false);
      setSignalSuccess(true);
      launchIndicatorToast(`Handshake approved with ${carrierName}. Flow resolved.`, 'success');
      setTimeout(() => setSignalSuccess(false), 3000);
    }, 1200);
  };

  const getWinner = (metric: 'sla' | 'speed') => {
    const activeList = MOCK_CARRIERS.filter(c => compareIds.includes(c.id));
    if (activeList.length === 0) return null;
    if (metric === 'sla') {
      return [...activeList].sort((a, b) => b.onTimeRate - a.onTimeRate)[0];
    } else {
      return [...activeList].sort((a, b) => a.avgTransitDays - b.avgTransitDays)[0];
    }
  };

  const slaWinner = getWinner('sla');
  const speedWinner = getWinner('speed');

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto animate-in fade-in duration-500 relative pb-16">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-display tracking-tight text-text-primary flex items-center gap-2">
            <span>Carrier Command Network</span>
          </h1>
          <p className="text-[11px] text-text-muted mt-0.5 font-mono">Consolidated operational telemetry & real-time performance audits.</p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto h-9">
          <button
            onClick={() => setIsCompareMode(!isCompareMode)}
            className={cn(
              "flex-1 md:flex-none h-full flex items-center justify-center gap-1.5 px-4 border rounded-lg text-xs font-bold transition-all",
              isCompareMode 
                ? "bg-accent-primary text-bg-base border-accent-primary" 
                : "bg-bg-surface border-bg-elevated hover:bg-bg-elevated text-text-primary"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isCompareMode ? "Exit Comparison" : "Compare Carriers"}</span>
          </button>
        </div>
      </div>

      {/* Aggregate metrics line */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="bg-bg-surface border border-bg-elevated rounded-lg p-3 flex items-center gap-3">
          <div className="p-2 rounded bg-accent-primary/10 text-accent-primary">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] font-mono text-text-muted uppercase">Nodes</span>
            <span className="text-sm font-mono font-bold block leading-none mt-1">{MOCK_CARRIERS.length} agency</span>
          </div>
        </div>

        <div className="bg-bg-surface border border-bg-elevated rounded-lg p-3 flex items-center gap-3">
          <div className="p-2 rounded bg-accent-success/10 text-accent-success">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] font-mono text-text-muted uppercase">Global SLA</span>
            <span className="text-sm font-mono font-bold text-accent-success block leading-none mt-1">
              {(MOCK_CARRIERS.reduce((acc, c) => acc + c.onTimeRate, 0) / MOCK_CARRIERS.length).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="bg-bg-surface border border-bg-elevated rounded-lg p-3 flex items-center gap-3">
          <div className="p-2 rounded bg-accent-warning/15 text-accent-warning">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] font-mono text-text-muted uppercase">Load Capacity</span>
            <span className="text-sm font-mono font-bold block leading-none mt-1">
              {MOCK_CARRIERS.reduce((acc, c) => acc + c.totalShipments, 0).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="bg-bg-surface border border-bg-elevated rounded-lg p-3 flex items-center gap-3">
          <div className="p-2 rounded bg-blue-500/10 text-blue-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] font-mono text-text-muted uppercase">Transit Mean</span>
            <span className="text-sm font-mono font-bold block leading-none mt-1">
              {(MOCK_CARRIERS.reduce((acc, c) => acc + c.avgTransitDays, 0) / MOCK_CARRIERS.length).toFixed(1)} days
            </span>
          </div>
        </div>
      </div>

      {/* Primary Query Filters and Controls */}
      <div className="bg-bg-surface border border-bg-elevated rounded-xl p-3.5 mb-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative w-full md:flex-1 md:max-w-md h-9">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search operational carriers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-full bg-bg-elevated/40 border border-bg-elevated rounded-lg pl-9 pr-8 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-all"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* SLA Filtration switches */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto shrink-0 select-none no-scrollbar h-9">
          {['all', 'exceptional', 'warning'].map((filterVal) => {
            let label = 'All';
            let activeColor = "border-accent-primary bg-accent-primary/10 text-accent-primary font-bold";
            if (filterVal === 'exceptional') {
              label = 'Outstanding (≥90%)';
              activeColor = "border-accent-success bg-accent-success/15 text-accent-success font-bold";
            } else if (filterVal === 'warning') {
              label = 'Watchlist (<90%)';
              activeColor = "border-accent-warning bg-accent-warning/15 text-accent-warning font-bold";
            }

            return (
              <button
                key={filterVal}
                onClick={() => setSlaFilter(filterVal as any)}
                className={cn(
                  "px-3 h-full border rounded-lg text-xs font-semibold whitespace-nowrap active:scale-95 transition-all focus:outline-none shrink-0",
                  slaFilter === filterVal ? activeColor : "bg-bg-surface border-bg-elevated text-text-secondary"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* WORKSPACE AREA */}
      {isMobile ? (
        /* MOBILE VIEWPORT: ACCORDION LIST ONLY */
        <div className="flex flex-col gap-3.5 w-full">
          
          {isCompareMode && (
            /* Inline Compare Summary inside mobile list first */
            <div className="bg-bg-surface border border-bg-elevated p-4 rounded-xl flex flex-col gap-3">
              <span className="text-[10px] font-mono text-text-muted uppercase font-bold">Compare Node Matrix ({compareIds.length})</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {MOCK_CARRIERS.map(c => {
                  const check = compareIds.includes(c.id);
                  return (
                    <button 
                      key={c.id} 
                      onClick={(e) => handleToggleCompare(c.id, e)}
                      className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-mono border transition-all",
                        check ? "bg-accent-primary text-bg-base border-accent-primary" : "bg-bg-elevated border-transparent text-text-muted"
                      )}
                    >
                      {c.name} {check ? '✓' : '+'}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {filteredCarriers.map(c => {
            const isSel = selectedId === c.id;
            const profile = CARRIER_PROFILES[c.id];
            const loadStats = carrierShipmentStats[c.id] || { active: 0, total: 0, delayed: 0 };
            const isCheckedForCompare = compareIds.includes(c.id);

            return (
              <div 
                key={c.id}
                className={cn(
                  "bg-bg-surface border rounded-xl overflow-hidden transition-all duration-300",
                  isSel ? "border-accent-primary ring-1 ring-accent-primary/60" : "border-bg-elevated"
                )}
              >
                {/* Accordion trigger line card head */}
                <div 
                  onClick={() => setSelectedId(isSel ? '' : c.id)}
                  className="p-4 flex items-center justify-between gap-2.5 cursor-pointer hover:bg-bg-elevated/20 active:bg-bg-elevated/30"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center border shrink-0",
                      isSel ? "bg-accent-primary/10 border-accent-primary/20 text-accent-primary" : "bg-bg-elevated border-bg-elevated"
                    )}>
                      <Truck className="w-4 h-4 text-text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-text-primary leading-none flex items-center gap-1 font-display">
                        <span>{c.name}</span>
                        {c.onTimeRate >= 90 && <ShieldCheck className="w-3.5 h-3.5 text-accent-success" />}
                      </h3>
                      <span className="text-[9px] font-mono text-text-muted mt-1 uppercase block leading-none">SLA: {c.onTimeRate}%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isCompareMode && (
                      <button 
                        onClick={(e) => handleToggleCompare(c.id, e)}
                        className={cn(
                          "px-2 py-1 rounded text-[9px] font-mono font-bold border transition-all shrink-0",
                          isCheckedForCompare ? "bg-accent-primary text-bg-base border-accent-primary" : "border-bg-elevated text-text-muted"
                        )}
                      >
                        {isCheckedForCompare ? "✓ COMPARING" : "+ COMPARE"}
                      </button>
                    )}
                    {isSel ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                  </div>
                </div>

                {/* Accordion detail pane content */}
                <AnimatePresence>
                  {isSel && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="border-t border-bg-elevated/40 bg-bg-elevated/10 p-4 space-y-4"
                    >
                      <p className="text-[11px] text-text-muted italic leading-relaxed">
                        "{profile?.specialization}."
                      </p>

                      {/* Small parameters block */}
                      <div className="grid grid-cols-2 gap-2 text-center text-[11px] font-mono bg-bg-surface p-2.5 rounded-lg border border-bg-elevated/40">
                        <div className="flex flex-col items-center border-r border-[#cbd5e1]/10">
                          <span className="text-[9px] text-text-muted uppercase">Avg Transit</span>
                          <span className="font-bold text-text-primary mt-0.5">{c.avgTransitDays} Days</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-[9px] text-text-muted uppercase">Contracts</span>
                          <span className="font-bold text-text-primary mt-0.5">{c.totalShipments.toLocaleString()} total</span>
                        </div>
                      </div>

                      {/* SLA Trends line chart optimized (smaller container) */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-mono text-text-muted uppercase font-bold block">MoM SLA Deviation Chart (6 months)</span>
                        <div className="h-[135px] bg-bg-surface rounded-lg p-2 border border-bg-elevated/60">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={monthlySlaTrendsForSelected(c.onTimeRate)} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                              <XAxis dataKey="name" stroke="#64748B" fontSize={8} tickLine={false} axisLine={false} />
                              <YAxis stroke="#64748B" fontSize={8} tickLine={false} axisLine={false} domain={[50, 100]} />
                              <RechartsTooltip contentStyle={{ backgroundColor: '#131929', borderColor: '#1F2937', fontSize: '9px' }} />
                              <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" vertical={false} />
                              <Line type="monotone" dataKey="ActualSLA" stroke="#10B981" strokeWidth={2} dot={{ r: 2 }} name="SLA" />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Corridors List */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-mono text-text-muted uppercase font-bold block">Top Hub CorridorsServed</span>
                        <div className="bg-bg-surface p-3 rounded-lg border border-bg-elevated/65 flex flex-col gap-1.5 font-mono text-[11px]">
                          {topCorridorsForSelected(c.id).map((tc, index) => (
                            <div key={index} className="flex justify-between items-center text-text-primary">
                              <span>{tc.route}</span>
                              <span className="font-bold">{tc.count} cargos</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Ping Alert Signal button element */}
                      <button 
                        disabled={isSignalling}
                        onClick={() => handleSimulatePing(c.name)}
                        className="w-full h-10 flex items-center justify-center gap-1.5 bg-text-primary text-bg-base hover:bg-text-secondary text-xs font-bold rounded-lg transition-all select-none active:scale-95 shrink-0 shadow-sm"
                      >
                        {isSignalling ? (
                          <RefreshCw className="w-4 h-4 animate-spin text-text-muted" />
                        ) : (
                          <Send className="w-4 h-4 text-bg-base" />
                        )}
                        <span>Signal Operation Desk</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {filteredCarriers.length === 0 && (
            <div className="text-center py-10 bg-bg-surface border border-bg-elevated rounded-xl p-4">
              <Truck className="w-8 h-8 opacity-40 mb-3 mx-auto text-text-muted" />
              <h3 className="text-sm font-semibold text-text-primary">No matching logistics partners</h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">Try resetting filters to show carriers.</p>
              <button 
                onClick={() => { setSearch(''); setSlaFilter('all'); }}
                className="mt-4 px-4 py-2 border border-bg-elevated bg-bg-elevated hover:bg-bg-elevated/60 text-text-primary text-xs rounded-lg"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      ) : (
        /* DESKTOP/LAPTOP VIEWPORT: CLASSICAL DUAL SPLIT CONSOLE PANEL */
        <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
          
          {/* Left panel: cards list */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {filteredCarriers.map(c => {
              const isSel = selectedId === c.id;
              const profile = CARRIER_PROFILES[c.id];
              const loadStats = carrierShipmentStats[c.id] || { active: 0, total: 0, delayed: 0 };
              const isCheckedForCompare = compareIds.includes(c.id);

              return (
                <div 
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={cn(
                    "bg-bg-surface border rounded-xl p-4 cursor-pointer transition-all duration-200 relative group flex flex-col justify-between h-56",
                    isSel 
                      ? "border-accent-primary ring-1 ring-accent-primary/60 bg-accent-primary/[0.01]" 
                      : "border-bg-elevated hover:border-accent-primary/45 hover:-translate-y-0.5"
                  )}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1.5 mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center transition-colors border",
                          isSel ? "bg-accent-primary/10 border-accent-primary/20 text-accent-primary" : "bg-bg-elevated border-bg-elevated"
                        )}>
                          <Truck className="w-4 h-4 text-text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-[14px] text-text-primary tracking-tight font-display flex items-center gap-1">
                            <span>{c.name}</span>
                            {c.onTimeRate >= 90 && <ShieldCheck className="w-3.5 h-3.5 text-accent-success" />}
                          </h3>
                          <p className="text-[10px] text-text-muted uppercase font-mono tracking-wider truncate max-w-[150px]">
                            {profile?.specialization.split(' & ')[0]}
                          </p>
                        </div>
                      </div>

                      {isCompareMode ? (
                        <button 
                          onClick={(e) => handleToggleCompare(c.id, e)}
                          className={cn(
                            "px-2 py-1 rounded text-[10px] font-mono font-bold border transition-all active:scale-90",
                            isCheckedForCompare 
                              ? "bg-accent-primary text-bg-base border-accent-primary" 
                              : "bg-bg-surface text-text-muted border-bg-elevated hover:text-accent-primary"
                          )}
                        >
                          {isCheckedForCompare ? "✓ COMPARING" : "+ COMPARE"}
                        </button>
                      ) : (
                        <div className="flex items-center gap-0.5 text-accent-warning bg-accent-warning/5 px-2 py-0.5 rounded border border-accent-warning/10">
                          <Star className="w-3" />
                          <span className="font-mono font-bold text-[10px]">{profile?.rating || "4.5"}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-left mb-3 bg-bg-elevated/20 p-2 rounded-lg border border-bg-elevated/30">
                      <div>
                        <span className="text-[9px] font-mono text-text-muted uppercase">Global SLA</span>
                        <p className={cn("font-mono text-xs font-bold mt-1", c.onTimeRate >= 90 ? "text-accent-success" : "text-accent-warning")}>
                          {c.onTimeRate}%
                        </p>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-text-muted uppercase">Transit Lead</span>
                        <p className="font-mono text-xs font-bold text-text-primary mt-1">{c.avgTransitDays}d</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-text-muted uppercase">Dispatch</span>
                        <p className="font-mono text-xs font-bold text-text-primary mt-1">{c.totalShipments.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[11px] text-text-muted">
                      <span className="flex items-center gap-1 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-primary"></span>
                        <span>{loadStats.active} Active Cargoes</span>
                      </span>
                    </div>

                    <div className="w-full bg-bg-elevated h-1 rounded-full overflow-hidden block">
                      <div 
                        className={cn("h-full rounded-full transition-all duration-1000", c.onTimeRate >= 90 ? "bg-accent-success" : "bg-accent-warning")}
                        style={{ width: `${c.onTimeRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right panelSticky Detail / Compare view component */}
          <div className="w-full lg:w-[410px] flex-shrink-0 sticky top-6">
            {isCompareMode ? (
              /* Compare pane details */
              <div className="bg-bg-surface border border-bg-elevated rounded-xl p-5 shadow-sm space-y-6">
                <div>
                  <h2 className="text-base font-bold font-display text-text-primary tracking-tight">Partner Comparison Matrix</h2>
                  <p className="text-[11px] text-text-muted font-mono mt-0.5">Analysing {compareIds.length} concurrently selected nodes.</p>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  {MOCK_CARRIERS.filter(c => compareIds.includes(c.id)).map(c => {
                    const profile = CARRIER_PROFILES[c.id];
                    const hasBestSLA = slaWinner?.id === c.id;
                    const hasBestSpeed = speedWinner?.id === c.id;

                    return (
                      <div key={c.id} className="border border-bg-elevated rounded-lg p-3 bg-bg-elevated/5 space-y-2.5">
                        <div className="flex justify-between items-center border-b border-bg-elevated/40 pb-1.5">
                          <strong className="text-text-primary">{c.name}</strong>
                          <div className="flex items-center gap-1 text-[9px]">
                            {hasBestSLA && <span className="bg-accent-success/15 text-accent-success px-1.5 py-0.5 rounded border border-accent-success/10 font-bold">🥇 Best SLA</span>}
                            {hasBestSpeed && <span className="bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/10 font-bold">⏱️ Fastest</span>}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                          <div>On-Time SLA: <strong className="text-text-primary block">{c.onTimeRate}%</strong></div>
                          <div>Mean Lead: <strong className="text-text-primary block">{c.avgTransitDays} Days</strong></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-text-muted uppercase font-bold tracking-wider">Metric Breakdown Comparisons</span>
                  <div className="h-44 bg-bg-base/30 rounded-lg p-2 border border-bg-elevated/50">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonChartData}>
                        <XAxis dataKey="metric" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#131929', borderColor: '#1C2539', fontSize: '11px' }} />
                        {MOCK_CARRIERS.filter(c => compareIds.includes(c.id)).map((c, i) => {
                          const colors = ['#3B82F6', '#10B981', '#F59E0B'];
                          return <Bar key={c.id} dataKey={c.name} fill={colors[i % colors.length]} radius={[2, 2, 0, 0]} />;
                        })}
                        <Legend verticalAlign="bottom" height={24} iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ) : (
              /* Standard carrier panel display detail */
              selected && (
                <div className="bg-bg-surface border border-bg-elevated rounded-xl p-5 shadow-sm space-y-5">
                  <div className="flex items-start justify-between border-b border-bg-elevated pb-4">
                    <div>
                      <h2 className="text-base font-bold font-display text-text-primary tracking-tight">{selected.name}</h2>
                      <p className="text-[10px] font-mono text-text-muted mt-1 uppercase tracking-wide">
                        {CARRIER_PROFILES[selected.id]?.specialization}
                      </p>
                    </div>
                  </div>

                  {/* Trends SLA visualizer */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-text-muted uppercase font-bold">Historical SLA Trend (6m)</span>
                      <span className="text-[10px] text-accent-success font-semibold">Target 90%</span>
                    </div>
                    <div className="h-44 bg-bg-base/30 rounded-lg p-2 border border-bg-elevated/50">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlySlaTrendsForSelected(selected.onTimeRate)} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                          <XAxis dataKey="name" stroke="#64748B" fontSize={9} tickLine={false} axisLine={false} />
                          <YAxis stroke="#64748B" fontSize={9} tickLine={false} axisLine={false} domain={[50, 100]} />
                          <RechartsTooltip contentStyle={{ backgroundColor: '#131929', borderColor: '#1F2937', fontSize: '11px' }} />
                          <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" vertical={false} />
                          <Line type="monotone" dataKey="ActualSLA" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} name="Actual SLA" />
                          <Line type="monotone" dataKey="StandardSLA" stroke="#F59E0B" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Target" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Corridors served */}
                  <div className="bg-bg-base p-3 rounded-lg border border-bg-elevated/75 flex flex-col gap-2">
                    <span className="text-[10px] font-mono text-text-muted uppercase font-bold tracking-wider block">Key Hub Corridors served</span>
                    <div className="flex flex-col gap-1.5 font-mono text-xs">
                      {topCorridorsForSelected(selected.id).map((tc, index) => (
                        <div key={index} className="flex justify-between items-center text-text-primary">
                          <span>{tc.route}</span>
                          <span className="font-bold">{tc.count} dispatches</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Signal triggers */}
                  <button 
                    disabled={isSignalling}
                    onClick={() => handleSimulatePing(selected.name)}
                    className="w-full h-10 flex items-center justify-center gap-1.5 bg-text-primary text-bg-base font-bold hover:bg-text-secondary text-xs rounded-lg select-none transition-transform active:scale-95 shadow-md"
                  >
                    {isSignalling ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-text-muted" />
                    ) : (
                      <Send className="w-4 h-4 text-bg-base" />
                    )}
                    <span>Signal Operation Desk</span>
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Action success indicators toast */}
      <div 
        className={cn(
          "fixed bottom-6 right-6 bg-bg-surface border text-[13px] px-4 py-3.5 rounded-lg shadow-2xl flex items-center gap-3.5 transition-all duration-300 z-50",
          toast.type === 'info' ? "border-accent-primary text-accent-primary" : "border-accent-success text-accent-success",
          toast.visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"
        )}
      >
        <CheckCircle2 className="w-5 h-5 text-accent-success shrink-0" />
        <span className="font-semibold text-text-primary">{toast.msg}</span>
      </div>

    </div>
  );
}
