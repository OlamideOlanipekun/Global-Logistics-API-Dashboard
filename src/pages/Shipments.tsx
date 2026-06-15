import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_SHIPMENTS } from '../mockData';
import { Shipment, ShipmentStatus } from '../types';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  Plus, 
  Download, 
  Grid, 
  List, 
  RotateCcw, 
  Scale, 
  Truck, 
  MapPin, 
  Calendar, 
  Package, 
  Layers, 
  X, 
  Info,
  CheckCircle2,
  AlertTriangle,
  MoreVertical,
  Check,
  Eye,
  Copy
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format, addDays } from 'date-fns';
import { ShipmentDrawer } from '../components/ShipmentDrawer';
import { RouteWaypointVisualizer } from '../components/RouteWaypointVisualizer';

const CITY_COORDS: { [key: string]: { country: string, lat: number, lng: number } } = {
  Lagos: { country: 'Nigeria', lat: 6.5244, lng: 3.3792 },
  Nairobi: { country: 'Kenya', lat: -1.2921, lng: 36.8219 },
  Accra: { country: 'Ghana', lat: 5.6037, lng: -0.1870 },
  Johannesburg: { country: 'South Africa', lat: -26.2041, lng: 28.0473 },
  Cairo: { country: 'Egypt', lat: 30.0444, lng: 31.2357 },
  Kigali: { country: 'Rwanda', lat: -1.9441, lng: 30.0619 },
  Casablanca: { country: 'Morocco', lat: 33.5731, lng: -7.5898 },
  Dakar: { country: 'Senegal', lat: 14.7167, lng: -17.4677 },
};

const CARRIERS_LIST = ['DHL', 'FedEx', 'UCP Logistics', 'Kobo360', 'Sendbox'];

export function Shipments({ initialSelectedId, onClearSelection }: { initialSelectedId?: string | null, onClearSelection?: () => void }) {
  const [shipments, setShipments] = useState<Shipment[]>(MOCK_SHIPMENTS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | 'all'>('all');
  const [carrierFilter, setCarrierFilter] = useState<string>('all');
  const [originFilter, setOriginFilter] = useState<string>('all');
  const [maxWeight, setMaxWeight] = useState<number>(600);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  // Sorting state
  const [sortCol, setSortCol] = useState<keyof Shipment>('eta');
  const [sortAsc, setSortAsc] = useState(true);
  
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId || null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // Mobile UI States
  const [isMobile, setIsMobile] = useState(false);
  const [showFilterBottomSheet, setShowFilterBottomSheet] = useState(false);
  const [showSortActionSheet, setShowSortActionSheet] = useState(false);
  const [contextMenuShipment, setContextMenuShipment] = useState<Shipment | null>(null);
  const [swipedCardId, setSwipedCardId] = useState<string | null>(null);

  const [toast, setToast] = useState<{msg: string, visible: boolean, type?: 'success' | 'warning'}>({
    msg: '', 
    visible: false,
    type: 'success'
  });

  // Consignment creation form state
  const [newShipment, setNewShipment] = useState({
    id: '',
    originCity: 'Lagos',
    destinationCity: 'Johannesburg',
    carrier: 'DHL',
    status: 'in_transit' as ShipmentStatus,
    weight: 220,
    dimensions: '30x30x30 cm',
    etaDays: 4
  });

  // Keep responsive triggers updated
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Synchronize dynamic updates
  useEffect(() => {
    if (initialSelectedId) {
      setSelectedId(initialSelectedId);
      if (onClearSelection) onClearSelection();
    }
  }, [initialSelectedId]);

  const handleFlag = (id: string) => {
    setShipments(prev => prev.map(s => s.id === id ? { ...s, status: 'flagged' } : s));
    setToast({ msg: `Cargo ${id} flagged as incident exception.`, visible: true, type: 'warning' });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 4000);
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setCarrierFilter('all');
    setOriginFilter('all');
    setMaxWeight(600);
  };

  // Filtered & Sorted Datasets
  const filtered = useMemo(() => {
    let result = shipments;
    
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s => 
        s.id.toLowerCase().includes(q) || 
        s.origin.city.toLowerCase().includes(q) || 
        s.destination.city.toLowerCase().includes(q) ||
        s.carrier.toLowerCase().includes(q)
      );
    }
    
    if (statusFilter !== 'all') {
      result = result.filter(s => s.status === statusFilter);
    }

    if (carrierFilter !== 'all') {
      result = result.filter(s => s.carrier === carrierFilter);
    }

    if (originFilter !== 'all') {
      result = result.filter(s => s.origin.city === originFilter);
    }

    if (maxWeight < 600) {
      result = result.filter(s => s.weight <= maxWeight);
    }
    
    result = [...result].sort((a, b) => {
      let valA: any = a[sortCol];
      let valB: any = b[sortCol];
      
      if (sortCol === 'origin' || sortCol === 'destination') {
        valA = a[sortCol].city;
        valB = b[sortCol].city;
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return result;
  }, [shipments, search, statusFilter, carrierFilter, originFilter, maxWeight, sortCol, sortAsc]);

  const toggleSort = (col: keyof Shipment) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else {
      setSortCol(col);
      setSortAsc(true);
    }
  };

  const applyMobileSort = (col: keyof Shipment, asc: boolean) => {
    setSortCol(col);
    setSortAsc(asc);
    setShowSortActionSheet(false);
  };

  const metrics = useMemo(() => {
    const total = filtered.length;
    const transit = filtered.filter(s => s.status === 'in_transit').length;
    const critical = filtered.filter(s => s.status === 'delayed' || s.status === 'flagged' || s.status === 'failed').length;
    const totalMass = filtered.reduce((acc, s) => acc + s.weight, 0);
    return { total, transit, critical, totalMass };
  }, [filtered]);

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      alert("No data available to export.");
      return;
    }
    const headers = ['Tracking ID', 'Origin Port', 'Destination Port', 'Courier', 'Status', 'ETA', 'Weight (kg)', 'Dimensions', 'Dispatched At'];
    const rows = filtered.map(s => [
      s.id,
      `${s.origin.city} (${s.origin.country})`,
      `${s.destination.city} (${s.destination.country})`,
      s.carrier,
      s.status.toUpperCase(),
      format(new Date(s.eta), 'yyyy-MM-dd'),
      s.weight,
      s.dimensions,
      format(new Date(s.createdAt), 'yyyy-MM-dd')
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Master_Manifest_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setToast({ 
      msg: `Exported ${filtered.length} consignments to CSV.`, 
      visible: true,
      type: 'success'
    });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 4000);
  };

  const handleOpenRegistry = () => {
    const customId = `MTC-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const citiesKeys = Object.keys(CITY_COORDS);
    const randomOrigin = citiesKeys[Math.floor(Math.random() * citiesKeys.length)];
    let randomDest = citiesKeys[Math.floor(Math.random() * citiesKeys.length)];
    while (randomDest === randomOrigin) {
      randomDest = citiesKeys[Math.floor(Math.random() * citiesKeys.length)];
    }
    const randomCarrier = CARRIERS_LIST[Math.floor(Math.random() * CARRIERS_LIST.length)];
    
    setNewShipment({
      id: customId,
      originCity: randomOrigin,
      destinationCity: randomDest,
      carrier: randomCarrier,
      status: 'in_transit',
      weight: Math.floor(Math.random() * 320) + 25,
      dimensions: `${Math.floor(Math.random() * 40) + 15}x${Math.floor(Math.random() * 35) + 15}x${Math.floor(Math.random() * 25) + 12} cm`,
      etaDays: Math.floor(Math.random() * 5) + 3
    });
    setIsCreateOpen(true);
  };

  const handleRegisterShipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShipment.id.trim()) return;
    if (newShipment.originCity === newShipment.destinationCity) {
      alert("Conflict: Origin and Destination ports cannot be identical.");
      return;
    }

    const oData = CITY_COORDS[newShipment.originCity];
    const dData = CITY_COORDS[newShipment.destinationCity];
    const dispatchDate = new Date();

    const freshCargo: Shipment = {
      id: newShipment.id,
      origin: {
        city: newShipment.originCity,
        country: oData.country,
        lat: oData.lat,
        lng: oData.lng
      },
      destination: {
        city: newShipment.destinationCity,
        country: dData.country,
        lat: dData.lat,
        lng: dData.lng
      },
      carrier: newShipment.carrier,
      status: newShipment.status,
      eta: addDays(dispatchDate, newShipment.etaDays).toISOString(),
      weight: Number(newShipment.weight),
      dimensions: newShipment.dimensions,
      createdAt: dispatchDate.toISOString(),
      events: [
        {
          timestamp: dispatchDate.toISOString(),
          location: `${newShipment.originCity} Terminal`,
          type: 'Manifest Registered & Dispatched'
        }
      ]
    };

    setShipments([freshCargo, ...shipments]);
    setIsCreateOpen(false);
    setToast({
      msg: `Cargo ID ${newShipment.id} created!`,
      visible: true,
      type: 'success'
    });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 4000);
  };

  const handleCopyIDToClipboard = (id: string) => {
    navigator.clipboard.writeText(id).then(() => {
      setToast({ msg: `Copied ID: ${id} to clipboard.`, visible: true, type: 'success' });
      setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
    });
    setContextMenuShipment(null);
  };

  const selectedShipment = shipments.find(s => s.id === selectedId) || null;

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto animate-in fade-in duration-500 relative min-h-screen pb-20 md:pb-12">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-display tracking-tight text-text-primary">Master Manifest</h1>
          <p className="text-[11px] text-text-muted mt-0.5 font-mono">Real-time status registers of African inter-hub waybills.</p>
        </div>
        
        {/* Actions Button Strip */}
        <div className="flex items-center gap-2 w-full md:w-auto h-9">
          <button 
            onClick={handleOpenRegistry}
            className="flex-1 md:flex-none h-full flex items-center justify-center gap-1.5 bg-accent-primary hover:bg-accent-primary/95 text-bg-base font-bold px-4 rounded-lg text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Cargo</span>
          </button>

          <button 
            onClick={handleExportCSV}
            className="flex-1 md:flex-none h-full flex items-center justify-center gap-1.5 bg-bg-surface border border-bg-elevated hover:bg-bg-elevated px-3.5 rounded-lg text-xs"
          >
            <Download className="w-3.5 h-3.5 text-text-muted" />
            <span>Export Manifest</span>
          </button>

          {!isMobile && (
            <div className="bg-bg-surface border border-bg-elevated p-0.5 rounded-lg flex items-center h-full shrink-0">
              <button 
                onClick={() => setViewMode('list')}
                className={cn("p-1.5 rounded transition-colors", viewMode === 'list' && "bg-bg-elevated text-accent-primary")}
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setViewMode('grid')}
                className={cn("p-1.5 rounded transition-colors", viewMode === 'grid' && "bg-bg-elevated text-accent-primary")}
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPI stats dashboard panels */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="bg-bg-surface border border-bg-elevated rounded-lg p-3 flex items-center gap-3">
          <div className="p-2 bg-accent-primary/10 text-accent-primary rounded">
            <Layers className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-mono text-text-muted uppercase">Volume</span>
            <span className="text-base font-mono font-bold">{metrics.total}</span>
          </div>
        </div>

        <div className="bg-bg-surface border border-bg-elevated rounded-lg p-3 flex items-center gap-3">
          <div className="p-2 bg-accent-success/15 text-accent-success rounded">
            <Truck className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-mono text-text-muted uppercase">En Route</span>
            <span className="text-base font-mono font-bold text-accent-success">{metrics.transit}</span>
          </div>
        </div>

        <div className="bg-bg-surface border border-bg-elevated rounded-lg p-3 flex items-center gap-3">
          <div className="p-2 bg-accent-warning/15 text-accent-warning rounded">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-mono text-text-muted uppercase">Incident</span>
            <span className="text-base font-mono font-bold text-accent-warning">{metrics.critical}</span>
          </div>
        </div>

        <div className="bg-bg-surface border border-bg-elevated rounded-lg p-3 flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 text-amber-500 rounded">
            <Scale className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-mono text-text-muted uppercase">Payload</span>
            <span className="text-base font-mono font-bold">
              {metrics.totalMass >= 1000 ? `${(metrics.totalMass / 1000).toFixed(1)}T` : `${metrics.totalMass}kg`}
            </span>
          </div>
        </div>
      </div>

      {/* Embedded Route Waypoint Arc Visualizer */}
      <div className="mb-6">
        <RouteWaypointVisualizer 
          shipment={selectedShipment || (filtered.length > 0 ? filtered[0] : null)} 
        />
      </div>

      {/* SEARCH AND FILTERS */}
      {/* Dynamic Header Layout based on viewport matches */}
      {isMobile ? (
        /* Mobile Specific: search / sorting single line combo */
        <div className="flex items-center gap-2 mb-4 w-full">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search ID, carrier..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-bg-surface border border-bg-elevated rounded-lg py-1.5 pl-8.5 pr-8 text-xs text-text-primary focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          
          <button 
            onClick={() => setShowFilterBottomSheet(true)}
            className={cn(
              "h-[32px] px-3.5 border rounded-lg text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all select-none",
              statusFilter !== 'all' || carrierFilter !== 'all' || originFilter !== 'all' || maxWeight < 600
                ? "bg-accent-primary/10 border-accent-primary text-accent-primary font-bold"
                : "bg-bg-surface border-bg-elevated text-text-primary"
            )}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
          </button>
          
          <button 
            onClick={() => setShowSortActionSheet(true)}
            className="h-[32px] px-3.5 bg-bg-surface border border-bg-elevated text-text-primary rounded-lg text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all select-none"
          >
            <Layers className="w-3.5 h-3.5 text-text-muted" />
            <span>Sort</span>
          </button>
        </div>
      ) : (
        /* Desktop/Tablet view standard filters */
        <div className="bg-bg-surface border border-bg-elevated rounded-lg p-4 mb-5 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Find waybill ID, Carrier, Port..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-bg-elevated/20 border border-bg-elevated rounded-lg py-1.5 pl-10 pr-4 text-xs placeholder:text-text-muted text-text-primary focus:outline-none"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value as any)}
                className="bg-bg-surface border border-bg-elevated rounded-lg py-1.5 pl-3 pr-8 text-xs font-semibold focus:outline-none cursor-pointer appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1em' }}
              >
                <option value="all">📁 All Transit Statuses</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="delayed">Delayed</option>
                <option value="failed">Failed</option>
                <option value="flagged">Flagged</option>
              </select>

              <button 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-all select-none h-8",
                  showAdvanced ? "bg-bg-elevated border-accent-primary text-accent-primary font-bold" : "bg-bg-surface border-bg-elevated"
                )}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Attributes</span>
                {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {(search || statusFilter !== 'all' || carrierFilter !== 'all' || originFilter !== 'all' || maxWeight < 600) && (
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-text-primary text-bg-base font-bold rounded-lg text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {showAdvanced && (
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-bg-elevated/40 animate-in slide-in-from-top-2">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-mono text-text-muted uppercase">Transporter Agency</span>
                <select 
                  value={carrierFilter}
                  onChange={e => setCarrierFilter(e.target.value)}
                  className="bg-bg-surface border border-bg-elevated rounded-md py-1.5 px-2 text-xs"
                >
                  <option value="all">All Transporters</option>
                  {CARRIERS_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-mono text-text-muted uppercase">Source Port Hub</span>
                <select 
                  value={originFilter}
                  onChange={e => setOriginFilter(e.target.value)}
                  className="bg-bg-surface border border-bg-elevated rounded-md py-1.5 px-2 text-xs"
                >
                  <option value="all">All Launch Ports</option>
                  {Object.keys(CITY_COORDS).map(city => <option key={city} value={city}>{city}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono text-text-muted uppercase">Max Weight Limit</span>
                  <span className="text-[10px] font-mono text-accent-primary bg-accent-primary/10 px-1 rounded">{maxWeight}kg</span>
                </div>
                <input 
                  type="range"
                  min="15"
                  max="600"
                  step="10"
                  value={maxWeight}
                  onChange={e => setMaxWeight(Number(e.target.value))}
                  className="mt-2"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* CORE DISPLAY (GRID/LIST FOR DESKTOP OR SWIPE-CARDS FOR MOBILE) */}
      <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-lg overflow-hidden flex flex-col shadow-sm">
        {isMobile ? (
          /* Mobile Card List: ZERO TABLES, gesture responsive */
          <div className="divide-y divide-[rgba(255,255,255,0.05)] bg-bg-surface p-1">
            {filtered.map((s) => {
              const activeSwipe = swipedCardId === s.id;
              let badgeStyle = 'bg-bg-elevated text-text-muted';
              if (s.status === 'in_transit') badgeStyle = 'bg-accent-primary/15 text-accent-primary';
              else if (s.status === 'delivered') badgeStyle = 'bg-accent-success/15 text-accent-success';
              else if (s.status === 'delayed' || s.status === 'flagged') badgeStyle = 'bg-accent-warning/15 text-accent-warning';
              else if (s.status === 'failed') badgeStyle = 'bg-accent-danger/15 text-accent-danger';

              return (
                <div 
                  key={s.id} 
                  className="relative overflow-hidden w-full select-none"
                  onTouchStart={(e) => {
                    const startX = e.touches[0].clientX;
                    e.currentTarget.setAttribute('data-swipe-start', String(startX));
                  }}
                  onTouchEnd={(e) => {
                    const startX = Number(e.currentTarget.getAttribute('data-swipe-start') || 0);
                    const endX = e.changedTouches[0].clientX;
                    const deltaX = startX - endX;
                    if (deltaX > 45) {
                      setSwipedCardId(s.id); // swiped left -> reveal
                    } else if (deltaX < -45) {
                      setSwipedCardId(null); // swiped right -> collapse
                    }
                  }}
                >
                  {/* Swipe-to-Action slide-behind triggers */}
                  <div className="absolute inset-y-0 right-0 w-[120px] flex items-center justify-end z-10">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFlag(s.id);
                        setSwipedCardId(null);
                      }}
                      className="bg-accent-warning text-bg-base w-[60px] h-full flex flex-col items-center justify-center gap-1 active:opacity-85"
                    >
                      <AlertTriangle className="w-4 h-4 text-bg-base" />
                      <span className="text-[9px] font-sans font-bold uppercase leading-none">Flag</span>
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(s.id);
                        setSwipedCardId(null);
                      }}
                      className="bg-accent-primary text-bg-base w-[60px] h-full flex flex-col items-center justify-center gap-1 active:opacity-85"
                    >
                      <Eye className="w-4 h-4 text-bg-base" />
                      <span className="text-[9px] font-sans font-bold uppercase leading-none">Info</span>
                    </button>
                  </div>

                  {/* Swipe-sliding main card layer */}
                  <div 
                    onClick={() => {
                      if (activeSwipe) {
                        setSwipedCardId(null);
                      } else {
                        setSelectedId(s.id);
                      }
                    }}
                    className={cn(
                      "bg-bg-surface p-4 flex flex-col gap-2.5 transition-transform duration-350 ease-out relative z-20 cursor-pointer border-b border-[rgba(255,255,255,0.03)]",
                      activeSwipe ? "transform -translate-x-[110px]" : "transform translate-x-0"
                    )}
                  >
                    {/* Top status & Action dropdown */}
                    <div className="flex items-center justify-between">
                      <span className={cn("px-2 py-0.5 rounded text-[9px] font-sans font-bold uppercase tracking-wider", badgeStyle)}>
                        {s.status.replace('_', ' ')}
                      </span>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setContextMenuShipment(s);
                        }}
                        className="p-1 hover:bg-bg-elevated rounded text-text-muted active:text-text-primary"
                        aria-label="Open context actions menu"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Tracking ID */}
                    <div className="font-mono text-xs font-bold text-accent-primary block">
                      {s.id}
                    </div>

                    {/* Path City details */}
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-text-primary">{s.origin.city}</span>
                      <span className="text-text-muted text-xs">&rarr;</span>
                      <span className="text-[13px] font-semibold text-text-primary">{s.destination.city}</span>
                    </div>

                    {/* Low level facts */}
                    <div className="flex items-center gap-2 text-[10px] text-text-muted font-mono flex-wrap">
                      <span>👤 {s.carrier}</span>
                      <span>•</span>
                      <span>⚖️ {s.weight}kg</span>
                      <span>•</span>
                      <span className="text-text-secondary font-medium">📅 ETA {format(new Date(s.eta), 'MMM dd')}</span>
                    </div>

                    {/* Swipe helper pill indicator */}
                    <div className="absolute right-3 bottom-3 w-1.5 h-1.5 rounded-full bg-border-strong/40 animate-pulse hidden" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Desktop/Tablet List and Grid Views */
          viewMode === 'list' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-bg-elevated/80 border-b border-bg-elevated">
                  <tr>
                    {[
                      { key: 'id', label: 'Waybill ID', resp: '' },
                      { key: 'origin', label: 'Departure Terminal', resp: '' },
                      { key: 'destination', label: 'Arrival Terminal', resp: '' },
                      { key: 'carrier', label: 'Operator', resp: 'hidden md:table-cell' },
                      { key: 'status', label: 'Tracking Node Status', resp: '' },
                      { key: 'eta', label: 'Projected ETA', resp: 'hidden sm:table-cell' },
                      { key: 'weight', label: 'Mass Class', resp: 'hidden md:table-cell' },
                    ].map(col => (
                      <th 
                        key={col.key} 
                        className={cn(
                          "px-5 py-3 text-[11px] font-mono text-text-muted uppercase font-bold tracking-wider cursor-pointer hover:text-text-primary bg-bg-elevated/70 group",
                          col.resp
                        )}
                        onClick={() => toggleSort(col.key as keyof Shipment)}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{col.label}</span>
                          <span className="text-text-muted/45 group-hover:text-text-primary transition-colors">
                            {sortCol === col.key 
                              ? (sortAsc ? <ChevronUp className="w-3.5 h-3.5 text-accent-primary" /> : <ChevronDown className="w-3.5 h-3.5 text-accent-primary" />) 
                              : <ChevronDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100" />
                            }
                          </span>
                        </div>
                      </th>
                    ))}
                    <th className="px-5 py-3 text-[11px] font-mono text-text-muted uppercase font-bold tracking-wider text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bg-elevated/50">
                  {filtered.map((s, index) => {
                    let badgeColor = 'bg-bg-elevated text-text-muted';
                    if (s.status === 'in_transit') badgeColor = 'bg-accent-primary/10 text-accent-primary border border-accent-primary/15';
                    else if (s.status === 'delivered') badgeColor = 'bg-accent-success/10 text-accent-success border border-accent-success/15';
                    else if (s.status === 'delayed' || s.status === 'flagged') badgeColor = 'bg-accent-warning/10 text-accent-warning border border-accent-warning/15';
                    else if (s.status === 'failed') badgeColor = 'bg-accent-danger/10 text-accent-danger border border-accent-danger/20';

                    return (
                      <tr 
                        key={s.id} 
                        onClick={() => setSelectedId(s.id)}
                        className={cn(
                          "hover:bg-bg-elevated/30 cursor-pointer transition-all border-b border-bg-elevated/60 group",
                          index % 2 === 1 ? "bg-bg-surface/50" : "bg-bg-surface"
                        )}
                      >
                        <td className="px-5 py-3 font-mono text-[12px] font-semibold text-text-primary group-hover:text-accent-primary transition-all">
                          {s.id}
                        </td>
                        <td className="px-5 py-3 text-[12px]">
                          <div className="flex flex-col">
                            <span className="font-semibold text-text-primary">{s.origin.city}</span>
                            <span className="font-mono text-[10px] text-text-muted">{s.origin.country}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-[12px]">
                          <div className="flex flex-col">
                            <span className="font-semibold text-text-primary">{s.destination.city}</span>
                            <span className="font-mono text-[10px] text-text-muted">{s.destination.country}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-[12px] hidden md:table-cell">
                          <span className="px-2 py-0.5 bg-bg-base border rounded text-text-muted text-[11px] font-mono">
                            {s.carrier}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={cn("px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase tracking-[0.05em]", badgeColor)}>
                            {s.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-mono text-[12px] text-text-primary hidden sm:table-cell">
                          {format(new Date(s.eta), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-5 py-3 text-[12px] hidden md:table-cell">
                          <div className="flex flex-col">
                            <span className="font-mono text-text-primary">{s.weight} kg</span>
                            <span className="text-[10px] text-text-muted truncate max-w-[100px]">{s.dimensions}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right text-text-muted group-hover:text-accent-primary transition-colors">
                          <span className="inline-flex items-center gap-1 bg-bg-elevated/40 border border-bg-elevated px-2 py-1 rounded text-[11px] font-semibold group-hover:bg-accent-primary group-hover:text-bg-base transition-all select-none">
                            Inspect
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 bg-bg-elevated/10">
              {filtered.map(s => {
                let borderStyle = 'border-l-[4px] border-text-muted';
                let badgeStyle = 'bg-bg-elevated text-text-muted';
                
                if (s.status === 'in_transit') borderStyle = 'border-l-[4px] border-accent-primary';
                else if (s.status === 'delivered') borderStyle = 'border-l-[4px] border-accent-success';
                else if (s.status === 'delayed' || s.status === 'flagged') borderStyle = 'border-l-[4px] border-accent-warning';
                else if (s.status === 'failed') borderStyle = 'border-l-[4px] border-accent-danger';

                return (
                  <div 
                    key={s.id}
                    onClick={() => setSelectedId(s.id)}
                    className={cn(
                      "bg-bg-surface border border-bg-elevated/80 rounded-lg p-4 transition-all hover:-translate-y-[2px] cursor-pointer flex flex-col gap-3 relative group",
                      borderStyle
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[13px] font-bold text-text-primary group-hover:text-accent-primary transition-colors">
                        {s.id}
                      </span>
                    </div>

                    <div className="bg-bg-elevated/40 border border-bg-elevated/25 p-2.5 rounded flex items-center justify-between text-xs gap-2">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-mono text-text-muted uppercase font-bold">Departure Port</span>
                        <span className="font-semibold text-text-primary">{s.origin.city}</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center">
                        <Truck className="w-3.5 h-3.5 text-text-muted/60 absolute group-hover:translate-x-3 transition-transform duration-500 ease-out" />
                        <div className="w-full h-px border-t border-dashed border-bg-elevated/80 mt-1" />
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[9px] font-mono text-text-muted uppercase font-bold">Arrival Port</span>
                        <span className="font-semibold text-text-primary">{s.destination.city}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-[11px] border-t border-bg-elevated/40 pt-2 font-mono">
                      <div className="flex flex-col items-center border-r border-bg-elevated/40">
                        <Scale className="w-3.5 h-3.5 text-text-muted mb-0.5" />
                        <strong className="text-text-primary font-bold mt-0.5">{s.weight} kg</strong>
                      </div>
                      <div className="flex flex-col items-center border-r border-bg-elevated/40">
                        <Package className="w-3.5 h-3.5 text-text-muted mb-0.5" />
                        <strong className="text-text-primary font-bold mt-0.5 truncate max-w-[70px]">{s.carrier}</strong>
                      </div>
                      <div className="flex flex-col items-center">
                        <Calendar className="w-3.5 h-3.5 text-text-muted mb-0.5" />
                        <strong className="text-text-primary font-bold mt-0.5">{format(new Date(s.eta), 'MMM dd')}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Empty layout state check */}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-text-muted bg-bg-surface">
            <div className="flex flex-col items-center max-w-sm mx-auto p-4">
              <div className="p-3 bg-bg-elevated rounded-full text-text-muted mb-3">
                <Filter className="w-6 h-6 opacity-60" />
              </div>
              <h3 className="text-sm font-semibold text-text-primary">No Matching Freight Found</h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed text-center">
                Could not find any consignments matching filters. Try pulling back or resetting controls.
              </p>
              <button 
                onClick={handleResetFilters}
                className="mt-4 border border-bg-elevated bg-bg-elevated hover:bg-bg-elevated/65 text-text-primary px-4 py-2 rounded-lg text-xs font-semibold"
              >
                Reset manifest query filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MOBILE COMPONENT 1: Filter Bottom Sheet (70vh sliding overlay drawer) */}
      {showFilterBottomSheet && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 animate-in fade-in"
            onClick={() => setShowFilterBottomSheet(false)}
          />
          <div className="fixed bottom-0 inset-x-0 max-h-[75vh] h-[75vh] bg-bg-surface border-t border-x border-bg-elevated rounded-t-xl z-50 flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            {/* Handlebar */}
            <div className="w-full py-2.5 flex items-center justify-center shrink-0">
              <div className="w-10 h-[4px] rounded-full bg-[#cbd5e1]/20" />
            </div>

            <div className="px-4 py-3 border-b border-bg-elevated flex items-center justify-between shrink-0">
              <span className="font-bold text-sm text-text-primary">Operational Parameters</span>
              <button onClick={() => setShowFilterBottomSheet(false)} className="p-1 text-text-muted hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable filtering content body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              
              {/* Waybill tracking status pills */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-text-muted uppercase block font-bold leading-none">Tracking Status</span>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
                  {['all', 'in_transit', 'delivered', 'delayed', 'failed', 'flagged'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st as any)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border shrink-0 transition-colors uppercase font-mono",
                        statusFilter === st 
                          ? "bg-accent-primary text-bg-base border-accent-primary font-bold" 
                          : "bg-bg-elevated border-transparent text-text-secondary"
                      )}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Courier service checkboxes */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-text-muted uppercase block font-bold leading-none">Registered Carrier</span>
                <div className="grid grid-cols-2 gap-2.5">
                  {['all', ...CARRIERS_LIST].map((carrier) => (
                    <button
                      key={carrier}
                      onClick={() => setCarrierFilter(carrier)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-left text-xs border truncate relative text-ellipsis font-bold",
                        carrierFilter === carrier 
                          ? "border-accent-primary bg-accent-primary/10 text-accent-primary" 
                          : "border-bg-elevated bg-bg-surface text-text-secondary"
                      )}
                    >
                      <span>{carrier === 'all' ? "All Carriers" : carrier}</span>
                      {carrierFilter === carrier && (
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-accent-primary flex items-center justify-center text-bg-base font-bold text-[8px]">&radic;</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Origin cities picker list */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-text-muted uppercase block font-bold leading-none">Departure Port Hub</span>
                <div className="grid grid-cols-2 gap-2.5">
                  {['all', ...Object.keys(CITY_COORDS)].map((city) => (
                    <button
                      key={city}
                      onClick={() => setOriginFilter(city)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-left text-xs border truncate relative text-ellipsis font-bold",
                        originFilter === city 
                          ? "border-accent-primary bg-accent-primary/10 text-accent-primary" 
                          : "border-bg-elevated bg-bg-surface text-text-secondary"
                      )}
                    >
                      <span>{city === 'all' ? "All Ports" : city}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Weight limit slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-text-muted uppercase font-bold leading-none">Max Consignment Weight</span>
                  <span className="text-[10px] font-mono text-accent-primary bg-accent-primary/10 px-1.5 py-0.5 rounded font-extrabold">{maxWeight}kg</span>
                </div>
                <input 
                  type="range"
                  min="15"
                  max="600"
                  step="10"
                  value={maxWeight}
                  onChange={e => setMaxWeight(Number(e.target.value))}
                  className="w-full h-1 bg-bg-elevated accent-accent-primary mt-2"
                />
              </div>

            </div>

            {/* Footer full screen triggers */}
            <div className="border-t border-bg-elevated p-4 bg-bg-surface shrink-0 flex items-center gap-3">
              <button 
                onClick={() => {
                  handleResetFilters();
                  setShowFilterBottomSheet(false);
                }}
                className="flex-1 bg-bg-surface hover:bg-bg-elevated text-text-primary text-xs py-2.5 border border-bg-elevated rounded-lg font-bold"
              >
                Clear All
              </button>
              <button 
                onClick={() => setShowFilterBottomSheet(false)}
                className="flex-1 bg-accent-primary text-bg-base text-xs py-2.5 rounded-lg font-bold shadow-lg shadow-accent-primary/15"
              >
                Apply Parameters
              </button>
            </div>
          </div>
        </>
      )}

      {/* MOBILE COMPONENT 2: Sort Selection Action Sheet */}
      {showSortActionSheet && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 animate-in fade-in"
            onClick={() => setShowSortActionSheet(false)}
          />
          <div className="fixed bottom-0 inset-x-0 bg-bg-surface border-t border-x border-bg-elevated rounded-t-xl z-50 flex flex-col p-4 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="w-10 h-[4px] rounded-full bg-[#cbd5e1]/20 mx-auto mb-4 shrink-0" />
            <h4 className="text-[10px] font-mono text-text-muted uppercase block font-bold leading-none mb-3">Sort Registries</h4>
            
            <div className="space-y-1">
              {[
                { label: 'Newest freight dispatched first', col: 'createdAt' as const, asc: false },
                { label: 'ETA Soonest transit first', col: 'eta' as const, asc: true },
                { label: 'Weight Payload (High to Low)', col: 'weight' as const, asc: false },
                { label: 'Waybill ID sequence (Alphanumeric)', col: 'id' as const, asc: true },
              ].map((opt, i) => {
                const isActive = sortCol === opt.col && sortAsc === opt.asc;
                return (
                  <button
                    key={i}
                    onClick={() => applyMobileSort(opt.col, opt.asc)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-3 rounded-lg text-left text-xs transition-colors font-medium active:bg-bg-elevated",
                      isActive ? "bg-accent-primary/10 text-accent-primary font-bold" : "hover:bg-bg-elevated/40 text-text-primary"
                    )}
                  >
                    <span>{opt.label}</span>
                    {isActive && <Check className="w-4 h-4 text-accent-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* MOBILE COMPONENT 3: Tapped Card 3-Dot context sheet action modal */}
      {contextMenuShipment && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 animate-in"
            onClick={() => setContextMenuShipment(null)}
          />
          <div className="fixed bottom-0 inset-x-0 bg-bg-surface border-t border-bg-elevated rounded-t-xl p-4 z-50 flex flex-col gap-3.5 shadow-2xl animate-in slide-in-from-bottom duration-150">
            {/* Top drawer drag line */}
            <div className="w-10 h-1 rounded-full bg-[#cbd5e1]/20 mx-auto shrink-0" />
            
            <div className="flex items-center gap-2 pb-2.5 border-b border-bg-elevated">
              <span className="font-mono text-xs font-bold text-accent-primary">{contextMenuShipment.id}</span>
              <span className="text-[10px] text-text-muted">Waybill Context Actions</span>
            </div>

            <div className="flex flex-col gap-1">
              <button
                onClick={() => {
                  setSelectedId(contextMenuShipment.id);
                  setContextMenuShipment(null);
                }}
                className="w-full flex items-center gap-3.5 px-3 py-3 hover:bg-bg-elevated rounded-lg text-left text-xs font-semibold text-text-primary active:bg-bg-elevated"
              >
                <Eye className="w-4 h-4 text-accent-primary" />
                <span>View Full Stepper Waypoint details</span>
              </button>

              <button
                onClick={() => {
                  handleFlag(contextMenuShipment.id);
                  setContextMenuShipment(null);
                }}
                className="w-full flex items-center gap-3.5 px-3 py-3 hover:bg-bg-elevated rounded-lg text-left text-xs font-semibold text-accent-warning active:bg-bg-elevated"
              >
                <AlertTriangle className="w-4 h-4 text-accent-warning" />
                <span>Flag Critical Incidental Exception</span>
              </button>

              <button
                onClick={() => handleCopyIDToClipboard(contextMenuShipment.id)}
                className="w-full flex items-center gap-3.5 px-3 py-3 hover:bg-bg-elevated rounded-lg text-left text-xs font-semibold text-text-primary active:bg-bg-elevated"
              >
                <Copy className="w-4 h-4 text-text-muted" />
                <span>Copy Consignment Tracking ID</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Slide-out details drawer frame */}
      <ShipmentDrawer shipment={selectedShipment} onClose={() => setSelectedId(null)} onFlag={handleFlag} />

      {/* Creation Consignment Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-bg-base/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-bg-surface border border-bg-elevated rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-5 py-4 bg-bg-elevated/80 border-b border-bg-elevated/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-accent-primary/10 text-accent-primary rounded">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-[14px] text-text-primary">Cargo Waybill Registration</h3>
                  <p className="text-[11px] text-text-muted font-mono">Dispatches active cargo manifest to live simulated flow.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCreateOpen(false)}
                className="p-1 text-text-muted hover:text-text-primary bg-bg-elevated hover:bg-bg-elevated/80 rounded border border-bg-elevated transition-colors"
                title="Dismiss Registration Dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterShipment} className="p-5 flex flex-col gap-4 text-xs font-sans">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono text-text-muted uppercase font-bold">Consignment tracking number (Waybill ID)</label>
                <input 
                  type="text" 
                  value={newShipment.id}
                  onChange={e => setNewShipment(prev => ({ ...prev, id: e.target.value.trim() }))}
                  required
                  placeholder="MTC-2026-XXXXX"
                  className="bg-bg-elevated/30 border border-bg-elevated rounded p-2 text-xs font-mono focus:outline-none focus:border-accent-primary tracking-wider"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-text-muted uppercase font-bold">Departure Depot</label>
                  <select 
                    value={newShipment.originCity}
                    onChange={e => setNewShipment(p => ({ ...p, originCity: e.target.value }))}
                    className="bg-bg-surface border border-bg-elevated rounded p-2 focus:outline-none focus:border-accent-primary cursor-pointer font-medium text-text-primary"
                  >
                    {Object.keys(CITY_COORDS).map(city => (
                      <option key={city} value={city}>{city} ({CITY_COORDS[city].country})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-text-muted uppercase font-bold">Arrival Depot</label>
                  <select 
                    value={newShipment.destinationCity}
                    onChange={e => setNewShipment(p => ({ ...p, destinationCity: e.target.value }))}
                    className="bg-bg-surface border border-bg-elevated rounded p-2 focus:outline-none focus:border-accent-primary cursor-pointer font-medium text-text-primary"
                  >
                    {Object.keys(CITY_COORDS).map(city => (
                      <option key={city} value={city}>{city} ({CITY_COORDS[city].country})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-text-muted uppercase font-bold">Transporter Partner</label>
                  <select 
                    value={newShipment.carrier}
                    onChange={e => setNewShipment(p => ({ ...p, carrier: e.target.value }))}
                    className="bg-bg-surface border border-bg-elevated rounded p-2 focus:outline-none focus:border-accent-primary cursor-pointer text-text-primary"
                  >
                    {CARRIERS_LIST.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-text-muted uppercase font-bold">Initial Tracking Node Status</label>
                  <select 
                    value={newShipment.status}
                    onChange={e => setNewShipment(p => ({ ...p, status: e.target.value as ShipmentStatus }))}
                    className="bg-bg-surface border border-bg-elevated rounded p-2 focus:outline-none focus:border-accent-primary cursor-pointer text-accent-primary font-bold text-text-primary"
                  >
                    <option value="in_transit">In Transit (Active)</option>
                    <option value="delayed">Delayed (Exception)</option>
                    <option value="flagged">Flagged (Critical)</option>
                    <option value="failed">Failed (Offline)</option>
                    <option value="delivered">Delivered (Complete)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-text-muted uppercase font-bold">Container Dimensions</label>
                  <input 
                    type="text" 
                    value={newShipment.dimensions}
                    onChange={e => setNewShipment(prev => ({ ...prev, dimensions: e.target.value }))}
                    required
                    placeholder="30x30x30 cm"
                    className="bg-bg-surface border border-bg-elevated rounded p-2 tracking-wide focus:outline-none focus:border-accent-primary text-text-primary"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-text-muted uppercase font-bold">Weight (kg)</label>
                  <input 
                    type="number" 
                    value={newShipment.weight}
                    min="1"
                    max="1500"
                    onChange={e => setNewShipment(prev => ({ ...prev, weight: Number(e.target.value) }))}
                    required
                    className="bg-bg-surface border border-bg-elevated rounded p-2 focus:outline-none focus:border-accent-primary font-mono font-bold text-text-primary"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono text-text-muted uppercase font-bold flex justify-between">
                  <span>Projected Departure-to-Arrival Duration</span>
                  <span className="text-accent-primary font-bold">ETA: {newShipment.etaDays} Days</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-text-muted">1 Day</span>
                  <input 
                    type="range" 
                    min="1"
                    max="14"
                    value={newShipment.etaDays}
                    onChange={e => setNewShipment(p => ({ ...p, etaDays: Number(e.target.value) }))}
                    className="flex-1 accent-accent-primary"
                  />
                  <span className="text-text-muted">14 Days</span>
                </div>
              </div>

              <div className="flex justify-end items-center gap-2.5 pt-4 border-t border-bg-elevated/60 mt-2">
                <button 
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="bg-bg-surface border border-bg-elevated hover:bg-bg-elevated/45 text-text-primary px-4 py-2 rounded-md font-semibold font-mono active:scale-95 transition-all text-[12px] h-9"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-accent-primary hover:bg-accent-primary/95 text-bg-base px-5 py-2 rounded-md font-bold text-[12px] active:scale-95 transition-all shadow-lg shadow-accent-primary/20 h-9"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating System-Wide Action Toast Notification */}
      <div className={cn(
        "fixed bottom-6 right-6 bg-bg-surface border text-[13px] px-4 py-3.5 rounded-lg shadow-2xl flex items-center gap-3.5 transition-all duration-300 z-50",
        toast.type === 'warning' ? "border-accent-warning text-accent-warning" : "border-accent-success text-accent-success",
        toast.visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"
      )}>
        {toast.type === 'warning' ? (
          <AlertTriangle className="w-5 h-5 text-accent-warning shrink-0" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-accent-success shrink-0" />
        )}
        <span className="font-medium text-text-primary">{toast.msg}</span>
      </div>

    </div>
  );
}
