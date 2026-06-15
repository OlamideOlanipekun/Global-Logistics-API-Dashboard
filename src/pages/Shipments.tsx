import React, { useState, useMemo } from 'react';
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
  AlertTriangle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format, addDays } from 'date-fns';
import { ShipmentDrawer } from '../components/ShipmentDrawer';

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
  const [sortCol, setSortCol] = useState<keyof Shipment>('eta');
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId || null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [toast, setToast] = useState<{msg: string, visible: boolean, type?: 'success' | 'warning'}>({
    msg: '', 
    visible: false,
    type: 'success'
  });

  // Consignment Creation form state
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

  // Keep in sync if global search selects something new
  useMemo(() => {
    if (initialSelectedId) {
      setSelectedId(initialSelectedId);
      if (onClearSelection) onClearSelection();
    }
  }, [initialSelectedId]);

  const handleFlag = (id: string) => {
    setShipments(prev => prev.map(s => s.id === id ? { ...s, status: 'flagged' } : s));
    setToast({ msg: `Shipment ${id} flagged as exception.`, visible: true, type: 'warning' });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 4000);
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setCarrierFilter('all');
    setOriginFilter('all');
    setMaxWeight(600);
  };

  // Filtered & Sorted datasets
  const filtered = useMemo(() => {
    let result = shipments;
    
    // General search filter
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s => 
        s.id.toLowerCase().includes(q) || 
        s.origin.city.toLowerCase().includes(q) || 
        s.destination.city.toLowerCase().includes(q) ||
        s.carrier.toLowerCase().includes(q)
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(s => s.status === statusFilter);
    }

    // Carrier filter
    if (carrierFilter !== 'all') {
      result = result.filter(s => s.carrier === carrierFilter);
    }

    // Origin filter
    if (originFilter !== 'all') {
      result = result.filter(s => s.origin.city === originFilter);
    }

    // Weight limit filter
    if (maxWeight < 600) {
      result = result.filter(s => s.weight <= maxWeight);
    }
    
    // Sorter logic
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

  // Custom live counters aggregated for current match results
  const metrics = useMemo(() => {
    const total = filtered.length;
    const transit = filtered.filter(s => s.status === 'in_transit').length;
    const critical = filtered.filter(s => s.status === 'delayed' || s.status === 'flagged' || s.status === 'failed').length;
    const totalMass = filtered.reduce((acc, s) => acc + s.weight, 0);
    return { total, transit, critical, totalMass };
  }, [filtered]);

  // Exporter tool mapping the filtered scope directly
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
    link.setAttribute("download", `African_Hub_Manifest_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setToast({ 
      msg: `Exported ${filtered.length} consignments successfully to CSV file.`, 
      visible: true,
      type: 'success'
    });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 4000);
  };

  // Open the modal and set realistic defaults
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
    
    if (!newShipment.id.trim()) {
      alert("Please provide a consignment tracking ID.");
      return;
    }
    if (newShipment.originCity === newShipment.destinationCity) {
      alert("Conflict: Origin Port and Destination cannot be identical.");
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
      msg: `Custom Cargo ID ${newShipment.id} created and dispatched!`,
      visible: true,
      type: 'success'
    });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 4000);
  };

  const selectedShipment = shipments.find(s => s.id === selectedId) || null;

  return (
    <div className="p-6 max-w-[1600px] mx-auto animate-in fade-in duration-500 relative min-h-screen pb-14">
      
      {/* Title & Global Trigger Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-text-primary">Master Manifest</h1>
          <p className="text-xs text-text-muted mt-0.5 font-mono">Centralized monitoring of all air and ocean freight waybills.</p>
        </div>
        
        {/* Actions strip */}
        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
          <button 
            onClick={handleOpenRegistry}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-accent-primary hover:bg-accent-primary/90 text-bg-base font-semibold px-4 py-2 rounded-md text-[13px] active:scale-95 transition-all shadow-lg shadow-accent-primary/10"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Consignment</span>
          </button>

          <button 
            onClick={handleExportCSV}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-bg-surface border border-bg-elevated/80 hover:border-accent-primary/40 hover:text-accent-primary px-3.5 py-2 rounded-md text-[13px] text-text-primary transition-all shadow-sm active:scale-95"
            title="Download viewable selection as spreadsheet document"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <div className="bg-bg-surface border border-bg-elevated p-0.5 rounded-md flex items-center shadow-inner shrink-0">
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "p-1.5 rounded transition-colors",
                viewMode === 'list' ? "bg-bg-elevated text-accent-primary font-bold" : "text-text-muted hover:text-text-primary"
              )}
              title="Table View Layout"
            >
              <List className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-1.5 rounded transition-colors",
                viewMode === 'grid' ? "bg-bg-elevated text-accent-primary font-bold" : "text-text-muted hover:text-text-primary"
              )}
              title="Interactive Cards Layout"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Performance KPI Indicator bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-bg-surface border border-bg-elevated rounded-lg p-3.5 flex items-center gap-3">
          <div className="p-2.5 rounded bg-accent-primary/10 text-accent-primary">
            <Layers className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">Filtered Volume</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-mono font-bold leading-tight">{metrics.total}</span>
              <span className="text-[9px] text-text-muted">records Match</span>
            </div>
          </div>
        </div>

        <div className="bg-bg-surface border border-bg-elevated rounded-lg p-3.5 flex items-center gap-3">
          <div className="p-2.5 rounded bg-accent-success/15 text-accent-success">
            <Truck className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">Active In-Transit</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-mono font-bold leading-tight text-accent-success">{metrics.transit}</span>
              <span className="text-[9px] text-text-muted">en route</span>
            </div>
          </div>
        </div>

        <div className="bg-bg-surface border border-bg-elevated rounded-lg p-3.5 flex items-center gap-3">
          <div className="p-2.5 rounded bg-accent-warning/15 text-accent-warning">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">Incident Warnings</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-mono font-bold leading-tight text-accent-warning">{metrics.critical}</span>
              <span className="text-[9px] text-text-muted">flagged/failed</span>
            </div>
          </div>
        </div>

        <div className="bg-bg-surface border border-bg-elevated rounded-lg p-3.5 flex items-center gap-3">
          <div className="p-2.5 rounded bg-amber-500/10 text-amber-500">
            <Scale className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">Payload Weight</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-mono font-bold leading-tight">
                {metrics.totalMass >= 1000 
                  ? `${(metrics.totalMass / 1000).toFixed(2).toLocaleString()} T` 
                  : `${metrics.totalMass.toLocaleString()} kg`}
              </span>
              <span className="text-[9px] text-text-muted">total cargo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Query Filters Control Strip */}
      <div className="bg-bg-surface border border-bg-elevated rounded-lg p-4 mb-6 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Quick Find Field */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Find consignment via ID, Carrier, Port..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-bg-elevated/40 border border-bg-elevated rounded-md py-2 pl-10 pr-4 text-xs font-sans text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-all"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-accent-primary text-text-muted"
                title="Reset search field"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Filter: Status Selector */}
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value as any)}
              className="bg-bg-surface border border-bg-elevated rounded-md py-2 pl-3 pr-8 text-xs font-mono font-medium focus:outline-none focus:border-accent-primary appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1em' }}
            >
              <option value="all">📁 All Cargo Statuses</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="delayed">Delayed</option>
              <option value="failed">Failed</option>
              <option value="flagged">Flagged Exceptions</option>
            </select>

            {/* Toggle Advanced Filters Container */}
            <button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={cn(
                "flex items-center gap-1 px-3 py-2 border rounded-md text-xs font-medium transition-all select-none active:scale-95",
                showAdvanced 
                  ? "bg-bg-elevated border-accent-primary text-accent-primary font-bold" 
                  : "bg-bg-surface border-bg-elevated hover:bg-bg-elevated/40 text-text-primary"
              )}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Attributes</span>
              {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {/* Reset All filter settings */}
            {(search || statusFilter !== 'all' || carrierFilter !== 'all' || originFilter !== 'all' || maxWeight < 600) && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-3 py-2 bg-text-primary text-bg-base rounded-md text-xs font-semibold hover:bg-text-secondary transition-all active:scale-95 shadow-sm"
                title="Wipe current filtration selection parameters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Expandable Advanced Parameter controls */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-bg-elevated/50 animate-in slide-in-from-top-2 duration-150">
            {/* Carrier select drop */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono text-text-muted uppercase font-bold tracking-wider">Logistics Transporter</label>
              <select 
                value={carrierFilter}
                onChange={e => setCarrierFilter(e.target.value)}
                className="bg-bg-surface border border-bg-elevated rounded-md py-1.5 px-2 text-xs focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary cursor-pointer w-full"
              >
                <option value="all">All Operators</option>
                {CARRIERS_LIST.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Origin port selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono text-text-muted uppercase font-bold tracking-wider">Source Hub Terminal</label>
              <select 
                value={originFilter}
                onChange={e => setOriginFilter(e.target.value)}
                className="bg-bg-surface border border-bg-elevated rounded-md py-1.5 px-2 text-xs focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary cursor-pointer w-full"
              >
                <option value="all">All Launch Ports</option>
                {Object.keys(CITY_COORDS).map(city => (
                  <option key={city} value={city}>{city} ({CITY_COORDS[city].country})</option>
                ))}
              </select>
            </div>

            {/* Weight sliders constraint */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono text-text-muted uppercase font-bold tracking-wider">Maximum Transit Weight</label>
                <span className="text-[10px] font-mono font-semibold text-accent-primary bg-accent-primary/10 px-1.5 py-0.5 rounded">
                  {maxWeight === 600 ? "No Limit" : `<= ${maxWeight} kg`}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-mono text-text-muted">15kg</span>
                <input 
                  type="range"
                  min="15"
                  max="600"
                  step="10"
                  value={maxWeight}
                  onChange={e => setMaxWeight(Number(e.target.value))}
                  className="flex-1 accent-accent-primary bg-bg-elevated h-1 rounded-lg cursor-pointer transition-colors"
                />
                <span className="text-[10px] font-mono text-text-muted">600kg</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main content display */}
      <div className="bg-bg-surface border border-bg-elevated rounded-lg overflow-hidden flex flex-col shadow-sm">
        
        {viewMode === 'list' ? (
          /* Classical structured list display with rich actions */
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
                        "px-5 py-3 text-[11px] font-mono text-text-muted uppercase font-bold tracking-wider cursor-pointer hover:text-text-primary whitespace-nowrap bg-bg-elevated/70 select-none group",
                        col.resp
                      )}
                      onClick={() => toggleSort(col.key as keyof Shipment)}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{col.label}</span>
                        <span className="text-text-muted/40 group-hover:text-text-primary transition-colors">
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
                  else if (s.status === 'delayed') badgeColor = 'bg-accent-warning/10 text-accent-warning border border-accent-warning/15';
                  else if (s.status === 'flagged') badgeColor = 'bg-accent-warning/20 text-accent-warning border border-accent-warning/30 font-bold';
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
                      {/* Tracking ID */}
                      <td className="px-5 py-3 font-mono text-[12px] font-semibold text-text-primary group-hover:text-accent-primary group-hover:translate-x-0.5 transition-all">
                        {s.id}
                      </td>

                      {/* Origin Depot */}
                      <td className="px-5 py-3 text-[12px]">
                        <div className="flex flex-col">
                          <span className="font-semibold text-text-primary">{s.origin.city}</span>
                          <span className="font-mono text-[10px] text-text-muted">{s.origin.country}</span>
                        </div>
                      </td>

                      {/* Destination depot */}
                      <td className="px-5 py-3 text-[12px]">
                        <div className="flex flex-col">
                          <span className="font-semibold text-text-primary">{s.destination.city}</span>
                          <span className="font-mono text-[10px] text-text-muted">{s.destination.country}</span>
                        </div>
                      </td>

                      {/* Carrier */}
                      <td className="px-5 py-3 text-[12px] hidden md:table-cell">
                        <span className="px-2 py-0.5 bg-bg-base rounded border border-bg-elevated text-text-muted text-[11px] font-mono">
                          {s.carrier}
                        </span>
                      </td>

                      {/* Tracking Node Status */}
                      <td className="px-5 py-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase tracking-[0.05em] inline-block",
                          badgeColor
                        )}>
                          {s.status.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Projected ETA */}
                      <td className="px-5 py-3 font-mono text-[12px] text-text-primary hidden sm:table-cell">
                        {format(new Date(s.eta), 'MMM dd, yyyy')}
                      </td>

                      {/* Mass dimensions */}
                      <td className="px-5 py-3 text-[12px] hidden md:table-cell">
                        <div className="flex flex-col">
                          <span className="font-mono text-text-primary">{s.weight} kg</span>
                          <span className="text-[10px] text-text-muted truncate max-w-[100px]" title="Dimensions">{s.dimensions}</span>
                        </div>
                      </td>

                      {/* Inspect Indicator button container */}
                      <td className="px-5 py-3 text-right text-[12px] text-text-muted group-hover:text-accent-primary transition-colors">
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
          /* Dynamic Interactive Cargo Bento-Grid Cards View mode */
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 bg-bg-elevated/20">
            {filtered.map(s => {
              let borderStyle = 'border-l-[4px] border-text-muted';
              let badgeStyle = 'bg-bg-elevated text-text-muted';
              
              if (s.status === 'in_transit') {
                borderStyle = 'border-l-[4px] border-accent-primary';
                badgeStyle = 'bg-accent-primary/10 text-accent-primary border border-accent-primary/15';
              } else if (s.status === 'delivered') {
                borderStyle = 'border-l-[4px] border-accent-success';
                badgeStyle = 'bg-accent-success/10 text-accent-success border border-accent-success/15';
              } else if (s.status === 'delayed') {
                borderStyle = 'border-l-[4px] border-accent-warning';
                badgeStyle = 'bg-accent-warning/10 text-accent-warning border border-accent-warning/15';
              } else if (s.status === 'flagged') {
                borderStyle = 'border-l-[4px] border-accent-warning';
                badgeStyle = 'bg-accent-warning/20 text-accent-warning border border-accent-warning/35 font-bold';
              } else if (s.status === 'failed') {
                borderStyle = 'border-l-[4px] border-accent-danger';
                badgeStyle = 'bg-accent-danger/10 text-accent-danger border border-accent-danger/25';
              }

              return (
                <div 
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={cn(
                    "bg-bg-surface border border-bg-elevated/80 rounded-lg p-4 transition-all hover:translate-y-[-2px] hover:shadow-md cursor-pointer flex flex-col gap-3 relative group",
                    borderStyle
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[13px] font-bold text-text-primary group-hover:text-accent-primary transition-colors">
                      {s.id}
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[9px] font-mono font-medium uppercase tracking-[0.05em]",
                      badgeStyle
                    )}>
                      {s.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Route Indicator graphic */}
                  <div className="bg-bg-elevated/40 border border-bg-elevated/20 p-2.5 rounded flex items-center justify-between text-xs gap-2">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-mono text-text-muted uppercase font-bold">Departure Port</span>
                      <span className="font-semibold text-text-primary">{s.origin.city}</span>
                    </div>

                    {/* Arrow/Line strip */}
                    <div className="flex-1 flex flex-col items-center">
                      <Truck className="w-3.5 h-3.5 text-text-muted/60 absolute group-hover:translate-x-3 transition-transform duration-500 ease-out" />
                      <div className="w-full h-px border-t border-dashed border-bg-elevated/80 mt-1" />
                    </div>

                    <div className="flex flex-col text-right">
                      <span className="text-[9px] font-mono text-text-muted uppercase font-bold">Arrival Port</span>
                      <span className="font-semibold text-text-primary">{s.destination.city}</span>
                    </div>
                  </div>

                  {/* Dimension stats */}
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px] border-t border-bg-elevated/40 pt-2 font-mono">
                    <div className="flex flex-col items-center border-r border-bg-elevated/40">
                      <Scale className="w-3.5 h-3.5 text-text-muted mb-0.5" />
                      <span className="text-[10px] text-text-muted">Cargo Weight</span>
                      <strong className="text-text-primary font-bold mt-0.5">{s.weight} kg</strong>
                    </div>
                    <div className="flex flex-col items-center border-r border-bg-elevated/40">
                      <Package className="w-3.5 h-3.5 text-text-muted mb-0.5" />
                      <span className="text-[10px] text-text-muted">Operator</span>
                      <strong className="text-text-primary font-bold mt-0.5 truncate max-w-[70px]">{s.carrier}</strong>
                    </div>
                    <div className="flex flex-col items-center">
                      <Calendar className="w-3.5 h-3.5 text-text-muted mb-0.5" />
                      <span className="text-[10px] text-text-muted">ETA Limit</span>
                      <strong className="text-text-primary font-bold mt-0.5">{format(new Date(s.eta), 'MMM dd')}</strong>
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-text-muted bg-bg-elevated/20 p-2.5 rounded-sm border border-bg-elevated/10 flex items-center justify-between">
                    <span>📐 {s.dimensions}</span>
                    <span className="text-accent-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      Inspect Console &rarr;
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty placeholder design */}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-text-muted bg-bg-surface">
            <div className="flex flex-col items-center max-w-sm mx-auto">
              <div className="p-3 bg-bg-elevated rounded-full text-text-muted mb-3 border border-bg-elevated">
                <Filter className="w-6 h-6 opacity-60" />
              </div>
              <h3 className="text-sm font-semibold text-text-primary">No Matching Freight Found</h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Could not find any consignments matching "<strong>{search || statusFilter || carrierFilter || originFilter}</strong>" with current constraints. Try pulling back or resetting filter controls.
              </p>
              <button 
                onClick={handleResetFilters}
                className="mt-4 inline-flex items-center gap-1 text-xs border border-bg-elevated bg-bg-elevated/40 hover:bg-bg-elevated text-text-primary px-3 py-1.5 rounded transition-all active:scale-95 font-semibold"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset manifest query filters</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-out Shipment Details controller */}
      <ShipmentDrawer shipment={selectedShipment} onClose={() => setSelectedId(null)} onFlag={handleFlag} />

      {/* Creation and Register Freight Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-bg-base/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-bg-surface border border-bg-elevated rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
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

            {/* Modal content body */}
            <form onSubmit={handleRegisterShipment} className="p-5 flex flex-col gap-4 text-xs font-sans">
              
              {/* Waybill tracking field */}
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

              {/* Hub terminal coordinates selection row */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-text-muted uppercase font-bold">Departure Depot</label>
                  <select 
                    value={newShipment.originCity}
                    onChange={e => setNewShipment(p => ({ ...p, originCity: e.target.value }))}
                    className="bg-bg-surface border border-bg-elevated rounded p-2 focus:outline-none focus:border-accent-primary cursor-pointer font-medium"
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
                    className="bg-bg-surface border border-bg-elevated rounded p-2 focus:outline-none focus:border-accent-primary cursor-pointer font-medium"
                  >
                    {Object.keys(CITY_COORDS).map(city => (
                      <option key={city} value={city}>{city} ({CITY_COORDS[city].country})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Courier Operator and Status */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-text-muted uppercase font-bold">Transporter Partner</label>
                  <select 
                    value={newShipment.carrier}
                    onChange={e => setNewShipment(p => ({ ...p, carrier: e.target.value }))}
                    className="bg-bg-surface border border-bg-elevated rounded p-2 focus:outline-none focus:border-accent-primary cursor-pointer"
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
                    className="bg-bg-surface border border-bg-elevated rounded p-2 focus:outline-none focus:border-accent-primary cursor-pointer text-accent-primary font-bold"
                  >
                    <option value="in_transit">In Transit (Active)</option>
                    <option value="delayed">Delayed (Exception)</option>
                    <option value="flagged">Flagged (Critical)</option>
                    <option value="failed">Failed (Offline)</option>
                    <option value="delivered">Delivered (Complete)</option>
                  </select>
                </div>
              </div>

              {/* Mass + Dimensions */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-text-muted uppercase font-bold">Container Dimensions</label>
                  <input 
                    type="text" 
                    value={newShipment.dimensions}
                    onChange={e => setNewShipment(prev => ({ ...prev, dimensions: e.target.value }))}
                    required
                    placeholder="30x30x30 cm"
                    className="bg-bg-surface border border-bg-elevated rounded p-2 tracking-wide focus:outline-none focus:border-accent-primary"
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
                    className="bg-bg-surface border border-bg-elevated rounded p-2 focus:outline-none focus:border-accent-primary font-mono font-bold"
                  />
                </div>
              </div>

              {/* ETA window */}
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

              {/* Actions Footer row */}
              <div className="flex justify-end items-center gap-2.5 pt-4 border-t border-bg-elevated/60 mt-2">
                <button 
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="bg-bg-surface border border-bg-elevated hover:bg-bg-elevated/40 text-text-primary px-4 py-2 rounded-md font-semibold font-mono active:scale-95 transition-all text-[12px] h-9"
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
