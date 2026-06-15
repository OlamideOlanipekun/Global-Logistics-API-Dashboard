import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  MapPin, 
  Truck, 
  X, 
  ArrowRight, 
  Clock, 
  Info, 
  Calendar, 
  Scale, 
  Maximize2, 
  CheckCircle2, 
  AlertCircle, 
  Clock3,
  BadgeAlert,
  ArrowDown,
  ChevronRight,
  Filter
} from 'lucide-react';
import { MOCK_SHIPMENTS } from '../mockData';
import { cn } from '../lib/utils';
import { Shipment, ShipmentStatus } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface GlobalSearchProps {
  onClose: () => void;
  onSelectResult: (shipment: Shipment) => void;
}

export function GlobalSearch({ onClose, onSelectResult }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load and persist search history
  const [recents, setRecents] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kibuti_search_history');
      return saved ? JSON.parse(saved) : ['MTC-2026-4', 'Lagos', 'DHL', 'delayed'];
    } catch {
      return ['MTC-2026-4', 'Lagos', 'DHL', 'delayed'];
    }
  });

  // Safe check & parse of tags like 'status:delayed' or 'carrier:dhl'
  const filterShipments = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return MOCK_SHIPMENTS;

    // Advanced colon key filtering
    if (trimmed.includes(':')) {
      const parts = trimmed.split(':');
      if (parts.length === 2) {
        const key = parts[0].trim();
        const value = parts[1].trim();
        
        if (key === 'status') {
          return MOCK_SHIPMENTS.filter(s => 
            s.status.toLowerCase().replace('_', '').includes(value.replace('_', ''))
          );
        }
        if (key === 'carrier') {
          return MOCK_SHIPMENTS.filter(s => 
            s.carrier.toLowerCase().includes(value)
          );
        }
        if (key === 'city') {
          return MOCK_SHIPMENTS.filter(s => 
            s.origin.city.toLowerCase().includes(value) || 
            s.destination.city.toLowerCase().includes(value)
          );
        }
      }
    }

    // Standard substring queries
    return MOCK_SHIPMENTS.filter(s => 
      s.id.toLowerCase().includes(trimmed) || 
      s.origin.city.toLowerCase().includes(trimmed) || 
      s.origin.country.toLowerCase().includes(trimmed) || 
      s.destination.city.toLowerCase().includes(trimmed) || 
      s.destination.country.toLowerCase().includes(trimmed) || 
      s.carrier.toLowerCase().includes(trimmed) || 
      s.status.toLowerCase().replace('_', ' ').includes(trimmed)
    );
  }, [query]);

  // Keep selected index bounded
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(filterShipments.length, 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + Math.max(filterShipments.length, 1)) % Math.max(filterShipments.length, 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filterShipments[selectedIndex]) {
          handleSelect(filterShipments[selectedIndex]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filterShipments, selectedIndex, onClose]);

  const handleSelect = (shipment: Shipment) => {
    // Add to recent search histories
    const newHistories = [shipment.id, ...recents.filter(x => x !== shipment.id)].slice(0, 6);
    setRecents(newHistories);
    try {
      localStorage.setItem('kibuti_search_history', JSON.stringify(newHistories));
    } catch (e) {
      console.warn('Could not save recent search in localstorage', e);
    }
    onSelectResult(shipment);
    onClose();
  };

  const clearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecents([]);
    try {
      localStorage.removeItem('kibuti_search_history');
    } catch {}
  };

  // Helper to render matched highlights
  function highlightText(text: string, highlight: string) {
    if (!highlight.trim() || highlight.includes(':')) {
      return <span>{text}</span>;
    }
    const idx = text.toLowerCase().indexOf(highlight.toLowerCase());
    if (idx === -1) return <span>{text}</span>;

    const start = text.substring(0, idx);
    const middle = text.substring(idx, idx + highlight.length);
    const end = text.substring(idx + highlight.length);

    return (
      <span>
        {start}
        <mark className="bg-accent-primary/25 text-accent-primary font-bold px-0.5 rounded-sm">
          {middle}
        </mark>
        {end}
      </span>
    );
  }

  // Get current active preview consignment
  const activeShipment = filterShipments[selectedIndex] || null;

  // Render status badge colors
  const getStatusStyle = (status: ShipmentStatus) => {
    switch (status) {
      case 'delivered':
        return { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Delivered', icon: CheckCircle2 };
      case 'delayed':
        return { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20', label: 'Delayed', icon: Clock3 };
      case 'flagged':
        return { bg: 'bg-red-500/10 text-red-400 border-red-500/20', label: 'Flagged', icon: AlertCircle };
      case 'failed':
        return { bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20', label: 'Failed Delivery', icon: BadgeAlert };
      default:
        return { bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'In Transit', icon: Truck };
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 transition-opacity" 
        onClick={onClose} 
        id="search-backdrop"
      />

      {/* Main Dialog Panel */}
      <div 
        className="fixed top-[10vh] left-1/2 -translate-x-1/2 w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col h-[70vh] text-slate-100"
        id="search-dialog"
      >
        {/* Header bar input */}
        <div className="flex items-center px-4 py-3 border-b border-slate-800">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input 
            ref={inputRef}
            autoFocus
            type="text" 
            placeholder="Search tracking ID, city, carrier, or tag (e.g. status:delayed)..." 
            className="flex-1 bg-transparent border-none focus:outline-none text-slate-100 text-[14px] placeholder-slate-500"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-2">
            {query && (
              <button 
                onClick={() => setQuery('')}
                className="p-1 hover:hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-200 transition-colors"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-block bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-[10px] font-mono text-slate-400">
              ESC
            </kbd>
          </div>
        </div>

        {/* Content Area - Split Layout */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT PANEL: Results List */}
          <div className="flex-1 flex flex-col overflow-y-auto border-r border-slate-800/60 p-4">
            
            {/* Conditional Help/Filters when input is untouched */}
            {!query && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 tracking-wider uppercase mb-2">
                  <span>Quick Filters / Statuses</span>
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <div className="flex flex-wrap gap-1.5 mb-5">
                  <button 
                    onClick={() => setQuery('status:in_transit')}
                    className="px-2.5 py-1 text-xs bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-full text-blue-400 transition-colors flex items-center gap-1"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                    In Transit
                  </button>
                  <button 
                    onClick={() => setQuery('status:delayed')}
                    className="px-2.5 py-1 text-xs bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-full text-amber-400 transition-colors flex items-center gap-1"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Delayed
                  </button>
                  <button 
                    onClick={() => setQuery('status:flagged')}
                    className="px-2.5 py-1 text-xs bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-full text-red-400 transition-colors flex items-center gap-1"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    Flagged
                  </button>
                  <button 
                    onClick={() => setQuery('status:delivered')}
                    className="px-2.5 py-1 text-xs bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-full text-emerald-400 transition-colors flex items-center gap-1"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Delivered
                  </button>
                  <button 
                    onClick={() => setQuery('carrier:DHL')}
                    className="px-2.5 py-1 text-xs bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-full text-slate-300 transition-colors"
                  >
                    DHL Service
                  </button>
                  <button 
                    onClick={() => setQuery('carrier:FedEx')}
                    className="px-2.5 py-1 text-xs bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-full text-slate-300 transition-colors"
                  >
                    FedEx Service
                  </button>
                </div>
              </div>
            )}

            {/* Recent Searches */}
            {!query && recents.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 tracking-wider uppercase mb-2">
                  <span>Recent Shipments Selected</span>
                  <button 
                    onClick={clearHistory}
                    className="text-[10px] text-slate-500 hover:text-red-400 transition-colors"
                  >
                    Clear History
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5 mb-5">
                  {recents.map((item, id) => (
                    <button 
                      key={id}
                      onClick={() => setQuery(item)}
                      className="flex items-center gap-2 p-2 rounded bg-slate-800/30 hover:bg-slate-800 text-slate-300 transition-colors text-left text-xs font-mono border border-slate-800 hover:border-slate-700"
                    >
                      <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{item}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results Headings */}
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 tracking-wider uppercase mb-2">
              <span>{query ? `Search Matches (${filterShipments.length})` : 'All Active Consignments'}</span>
              <span className="text-[10px] font-normal text-slate-500">Arrow keys to navigate, Enter to load</span>
            </div>

            {/* List */}
            {filterShipments.length > 0 ? (
              <div className="space-y-1">
                {filterShipments.slice(0, 15).map((s, idx) => {
                  const isSelected = idx === selectedIndex;
                  const sc = getStatusStyle(s.status);
                  const IconComp = sc.icon;
                  return (
                    <button 
                      key={s.id}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={() => handleSelect(s)}
                      className={cn(
                        "w-full text-left flex items-center justify-between p-2.5 rounded-lg transition-all border outline-none",
                        isSelected 
                          ? "bg-slate-800 border-slate-700 text-slate-100 shadow-sm pl-3.5" 
                          : "bg-transparent border-transparent hover:bg-slate-800/40 text-slate-300"
                      )}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={cn(
                          "w-7 h-7 rounded flex items-center justify-center shrink-0 border",
                          isSelected ? "bg-slate-900 border-slate-700" : "bg-slate-800/60 border-slate-800"
                        )}>
                          <IconComp className={cn("w-3.5 h-3.5", isSelected ? "text-accent-primary" : "text-slate-400")} />
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-mono text-xs font-bold text-accent-primary flex items-center gap-1.5">
                            {highlightText(s.id, query)}
                            <span className="text-[10px] font-normal text-slate-500 font-sans">({s.carrier})</span>
                          </p>
                          <p className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                            {highlightText(s.origin.city, query)}
                            <span className="text-slate-600">→</span>
                            {highlightText(s.destination.city, query)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-2 shrink-0">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] uppercase font-mono tracking-wider border",
                          sc.bg
                        )}>
                          {sc.label}
                        </span>
                        <ChevronRight className={cn("w-3.5 h-3.5 text-slate-500 transition-transform", isSelected && "translate-x-0.5 text-slate-400")} />
                      </div>
                    </button>
                  );
                })}
                {filterShipments.length > 15 && (
                  <p className="text-center text-[11px] text-slate-500 pt-2 font-mono">
                    Showing 15 of {filterShipments.length} matching rows. Continue typing to refine.
                  </p>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-800/40 flex items-center justify-center border border-slate-800 mb-3">
                  <Info className="w-5 h-5 text-slate-500" />
                </div>
                <h4 className="text-sm font-semibold text-slate-300">No shipments found</h4>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  We couldn't find any consignments matching "{query}". Try checking details or tags.
                </p>
              </div>
            )}
          </div>

          {/* RIGHT PANEL: Live Preview of Active Consignment */}
          <div className="hidden md:flex w-[350px] bg-slate-950/60 p-5 flex-col overflow-y-auto  ">
            {activeShipment ? (
              <div className="space-y-4 flex-1 flex flex-col">
                <div>
                  <span className="text-[9px] font-bold text-accent-primary tracking-wider uppercase bg-accent-primary/10 px-2 py-0.5 rounded">
                    Operational Glance
                  </span>
                  <h3 className="text-sm font-bold font-mono text-slate-100 mt-2.5 flex items-center gap-2">
                    {activeShipment.id}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Created via API: <span className="font-mono text-slate-300">{new Date(activeShipment.createdAt).toLocaleDateString()}</span>
                  </p>
                </div>

                {/* Status Indicator Bar */}
                {(() => {
                  const sc = getStatusStyle(activeShipment.status);
                  const IconComp = sc.icon;
                  return (
                    <div className={cn("p-3 rounded-lg border flex items-center justify-between", sc.bg)}>
                      <div className="flex items-center gap-2">
                        <IconComp className="w-4 h-4 shrink-0" />
                        <span className="text-xs font-semibold capitalize">{sc.label}</span>
                      </div>
                      <span className="text-[10px] opacity-80 font-mono">Realtime Log</span>
                    </div>
                  );
                })()}

                {/* Map/Travel Flow diagram */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 space-y-2 relative">
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-slate-500">ORIGIN</p>
                      <p className="text-xs font-semibold text-slate-200">{activeShipment.origin.city}</p>
                      <p className="text-[10px] text-slate-400">{activeShipment.origin.country}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 mt-3 self-start" />
                    <div className="space-y-0.5 text-right">
                      <p className="text-[10px] text-slate-500">DESTINATION</p>
                      <p className="text-xs font-semibold text-slate-200">{activeShipment.destination.city}</p>
                      <p className="text-[10px] text-slate-400">{activeShipment.destination.country}</p>
                    </div>
                  </div>
                </div>

                {/* Additional metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                      <Scale className="w-3.5 h-3.5" />
                      <span>WEIGHT</span>
                    </div>
                    <p className="font-mono font-medium text-slate-200">{activeShipment.weight} kg</p>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>DIMENSIONS</span>
                    </div>
                    <p className="font-mono text-[11px] font-medium text-slate-200 truncate" title={activeShipment.dimensions}>
                      {activeShipment.dimensions}
                    </p>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800/80 col-span-2">
                    <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>ETA DATE</span>
                    </div>
                    <p className="font-mono font-medium text-slate-200">
                      {new Date(activeShipment.eta).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Timeline status events logs preview */}
                <div className="flex-1 flex flex-col min-h-0 bg-slate-900/30 rounded-lg p-3 border border-slate-800/50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2.5">
                    Recent Waybill Scans ({activeShipment.events.length})
                  </p>
                  <div className="space-y-3 overflow-y-auto flex-1 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                    {activeShipment.events.slice(0, 3).map((ev, i) => (
                      <div key={i} className="flex gap-2.5 text-xs relative">
                        {i < activeShipment.events.length - 1 && (
                          <div className="absolute left-[5px] top-[14px] bottom-[-14px] w-[1px] bg-slate-800"></div>
                        )}
                        <span className="w-2.5 h-2.5 rounded-full bg-accent-primary shrink-0 z-10 border-2 border-slate-900 mt-1" />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-200 text-[11px]">{ev.type}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{ev.location}</p>
                          <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                            {new Date(ev.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Launch Action */}
                <button 
                  onClick={() => handleSelect(activeShipment)}
                  className="w-full bg-accent-primary hover:bg-accent-primary/90 text-white rounded-lg py-2 text-xs font-semibold transition-all active:scale-95 flex items-center justify-center gap-1.5 mt-auto"
                >
                  <span>Select & Navigate to Consignment</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500">
                <Truck className="w-8 h-8 text-slate-600 mb-2.5 animate-pulse" />
                <p className="text-xs">Select any item on the left to see full logistics dispatch info.</p>
              </div>
            )}
          </div>

        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span>⚡ <kbd className="bg-slate-800 text-slate-400 px-1 rounded">↑↓</kbd> Select</span>
            <span>⏎ Go</span>
            <span><kbd className="bg-slate-800 text-slate-400 px-1 rounded">esc</kbd> Dismiss</span>
          </div>
          <div>
            <span>Press <kbd className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono font-bold">status:delayed</kbd> to force-filter</span>
          </div>
        </div>
      </div>
    </>
  );
}
